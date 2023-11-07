document.addEventListener('DOMContentLoaded', (event) => {
  fetch('/images-data')
    .then(response => response.json())
    .then(data => {
      const imagesDiv = document.getElementById('images');
      imagesDiv.innerHTML = '';

      data.forEach(item => {
        const imageWrapper = document.createElement('div');
        imageWrapper.classList.add('image-wrapper');
        imageWrapper.innerHTML = imageWrapper.innerHTML = GetImageWrapperHTML(item.imageUrl, item.prompt, item.revisedPrompt, item.style, item.quality);
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
  var size = document.getElementById('size').value;
  var quality = document.getElementById('quality').value;
  var useExactPrompt = document.getElementById('useExactPrompt').checked;

  if (!prompt) {
    alert('Please enter a prompt.');
    return;
  }

  if (useExactPrompt) {
    prompt = "Please use this exact prompt, do not change it: " + prompt;
  }

  var button = document.getElementById('generate');
  button.disabled = true;
  button.classList.add('spinner');
  
  var numImages = parseInt(document.getElementById('numImages').value, 10);

  Array.from({ length: numImages }, (_, i) => i + 1).forEach(function() {
    fetch('/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, style, size, quality })
    })
    .then(response => response.json())
    .then(data => {
      button.disabled = false;
      button.classList.remove('spinner');

      var imageWrapper = document.createElement('div');
      imageWrapper.classList.add('image-wrapper');
      imageWrapper.innerHTML = GetImageWrapperHTML(data.imageUrl, prompt, data.revisedPrompt, style, quality, data);
      document.getElementById('images').prepend(imageWrapper);

    })
    .catch(error => {
      console.error('Error:', error);
      button.disabled = false;
      button.classList.remove('spinner');
    });
  });
});

function GetImageWrapperHTML(imageUrl, prompt, revisedPrompt, style, quality) {
    return `
        <img src="${imageUrl}" alt="">
        <p>${prompt}<br>
          (${style} style, ${quality} quality)</p>
        <p><em>${revisedPrompt}</em></p>
      `;
}
