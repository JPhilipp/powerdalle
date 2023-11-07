document.addEventListener('DOMContentLoaded', (event) => {
  fetch('/images-data')
    .then(response => response.json())
    .then(data => {
      const imagesDiv = document.getElementById('images');
      imagesDiv.innerHTML = '';

      data.forEach(item => {
        const parts = item.prompt.split('\n---\n');
        const prompt = parts[0];
        const revisedPrompt = parts[1] || '';

        const imageWrapper = document.createElement('div');
        imageWrapper.classList.add('image-wrapper');
        imageWrapper.innerHTML = `
          <img src="${item.imageUrl}" alt="">
          <p>${prompt}</p>
          <p><em>${revisedPrompt}</em></p>
        `;
        imagesDiv.appendChild(imageWrapper);
      });
    })
    .catch(error => {
      console.error('Error fetching images:', error);
    });
});



document.getElementById('generate').addEventListener('click', function() {
  var prompt = document.getElementById('prompt').value;
  var style = document.getElementById('style').value;
  var resolution = document.getElementById('resolution').value;
  var quality = document.getElementById('quality').value;
  var useExactPrompt = document.getElementById('useExactPrompt').checked;

  var button = document.getElementById('generate');
  button.disabled = true;
  button.classList.add('spinner');

  if (!prompt) {
    alert('Please enter a prompt.');
    return;
  }

  if (useExactPrompt) {
    prompt = "Please use this exact prompt, do not change it: " + prompt;
  }
  
  var numImages = parseInt(document.getElementById('numImages').value, 10);

  Array.from({ length: numImages }, (_, i) => i + 1).forEach(function() {
    fetch('/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, style, resolution, quality })
    })
    .then(response => response.json())
    .then(data => {
      button.disabled = false;
      button.classList.remove('spinner');

      var imageWrapper = document.createElement('div');
      imageWrapper.classList.add('image-wrapper');
      imageWrapper.innerHTML = `
        <img src="${data.imageUrl}" alt="">
        <p>${prompt}<br>
          (${style} style, ${quality} quality)</p>
        <p><em>${data.revisedPrompt}</em></p>
      `;
      document.getElementById('images').prepend(imageWrapper);

    })
    .catch(error => {
      console.error('Error:', error);
      button.disabled = false;
      button.classList.remove('spinner');
    });
  });
});
