const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

app.use(express.json());
app.use(express.static('public'));

const allowedStyles = ['vivid', 'natural'];
const defaultModel = "dall-e-3";
const model = process.env.MODEL ? process.env.MODEL : defaultModel;
const saveJsonWithImages = process.env.SAVE_JSON_WITH_IMAGES === 'true';

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY,
      imageUrl TEXT,
      prompt TEXT,
      revisedPrompt TEXT,
      style TEXT,
      size TEXT,
      quality TEXT,
      model TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});


app.post('/generate-image', async (req, res) => {

  const { prompt, style, size, quality } = req.body;
  
  console.log(`Now working on received prompt "${prompt}" with style "${style}", size "${size}", and quality "${quality}"`);

  if (!allowedStyles.includes(style)) {
    return res.status(400).send('Invalid style value provided.');
  }

  const doTestError = false;
  if (doTestError) {
    var data = {
      error: {
        code: 'test_content_policy_violation',
        message: 'Your request was rejected as a result of our safety system. Your prompt may contain text that is not allowed by our safety system.',
        param: null,
        type: 'invalid_request_error'
      }
    }
    return res.status(500).send(data);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        n: 1,
        size: size,
        style: style,
        quality: quality,
        model: model
      }),
    });

    const data = await response.json();

    console.log("Dall-E returned:");
    console.log(data);

    if (data.error) {
      return res.status(500).send(data);
    }

    const imageUrl = data.data[0].url;
    const revisedPrompt = data.data[0].revised_prompt;
    let localImageUrl;
    let dateTime;
    let guid;
    
    axios({
        method: 'get',
        url: imageUrl,
        responseType: 'stream'
      })
      .then(function (response) {

        dateTime = getFormattedDateTime();
        guid = crypto.randomBytes(4).toString('hex');
        
        const filename = `${dateTime}-${guid}.png`;
        const filepath = path.join(__dirname, 'images', filename);
        localImageUrl = `/images/${filename}`;

        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
          writer.on('finish', () => {

            db.run(`
              INSERT INTO images (imageUrl, prompt, revisedPrompt, style, size, quality, model) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`, 
              [localImageUrl, prompt, revisedPrompt, style, size, quality, model],
              function(err) {
                if (err) {
                  reject(err);
                } else {
                  resolve(this.lastID);
                }
              }
            );
            
        });
          writer.on('error', reject);
        });

      })
      .then(lastID => {

        if (saveJsonWithImages) {
          const jsonFilename = `${dateTime}-${guid}.json`;
          const jsonFilepath = path.join(__dirname, 'images', jsonFilename);
          const jsonData = JSON.stringify({
            prompt: prompt,
            revisedPrompt: revisedPrompt,
            style: style,
            size: size,
            quality: quality,
            model: model
          }, null, 2);

          fs.writeFile(jsonFilepath, jsonData, err => {
            if (err) {
              console.error('Error saving Json file:', err);
              res.status(500).send('Error saving Json file');
            } else {
              console.log('Json file saved successfully.');
              res.json({ imageUrl: localImageUrl, revisedPrompt: revisedPrompt, id: lastID });
            }
          });
        }
        else {
          res.json({ imageUrl: localImageUrl, revisedPrompt: revisedPrompt, id: lastID, model: model });
        }

      })
      .catch(error => {
        console.error('Error downloading or saving image:', error);
        res.status(500).send('Error processing image');
      });

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).send('Error generating image');
  }
});


app.get('/images-data', async (req, res) => {
  const query = `
    SELECT id, imageUrl, prompt, revisedPrompt, style, size, quality, model 
    FROM images 
    ORDER BY createdAt DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Error querying the database' });
    } else {
      res.json(rows.map(row => ({
        id: row.id,
        imageUrl: row.imageUrl,
        prompt: row.prompt,
        revisedPrompt: row.revisedPrompt,
        style: row.style,
        size: row.size,
        quality: row.quality,
        model: row.model
      })));
    }
  });
});


app.delete('/delete-image/:id', (req, res) => {
  const { id } = req.params;

  db.get("SELECT imageUrl FROM images WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Error finding image to delete' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const imageFilePath = path.join(__dirname, row.imageUrl);
    const jsonFilePath = imageFilePath.replace('.png', '.json');

    fs.unlink(imageFilePath, (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: 'Error deleting image file' });
      }

      fs.unlink(jsonFilePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.log(err);
          return res.status(500).json({ message: 'Error deleting JSON file' });
        }

        const deleteStmt = db.prepare("DELETE FROM images WHERE id = ?");
        deleteStmt.run(id, function (err) {
          deleteStmt.finalize();
          if (err) {
            res.status(500).json({ message: 'Error deleting image data from database' });
          } else {
            res.json({ message: 'Image deleted', id: id });
          }
        });
      });
    });
  });
});


app.use('/images', express.static(path.join(__dirname, 'images')));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  const imagesDir = path.join(__dirname, 'images');
  if (!fs.existsSync(imagesDir)){
    fs.mkdirSync(imagesDir);
  }
});


process.on('SIGINT', () => {
  db.close(() => {
    console.log('Database connection closed due to app termination');
    process.exit(0);
  });
});


function getFormattedDateTime() {
    const pad = (number) => number < 10 ? `0${number}` : number;
  
    const dateTimeNow = new Date();
    const year = dateTimeNow.getUTCFullYear();
    const month = pad(dateTimeNow.getUTCMonth() + 1);
    const date = pad(dateTimeNow.getUTCDate());
    const hours = pad(dateTimeNow.getUTCHours());
    const minutes = pad(dateTimeNow.getUTCMinutes());
    const seconds = pad(dateTimeNow.getUTCSeconds());
  
    return `${year}-${month}-${date}-${hours}-${minutes}-${seconds}`;
}
