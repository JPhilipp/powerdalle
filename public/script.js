document.addEventListener('DOMContentLoaded', (event) => {
  fetch('/images-data')
    .then(response => response.json())
    .then(data => {
      const imagesDiv = document.getElementById('images');
      imagesDiv.innerHTML = '';

      data.forEach((item, index) => {
        const imageWrapper = document.createElement('div');
        imageWrapper.classList.add('image-wrapper');
        imageWrapper.setAttribute('data-id', item.id); 

        var doLazyLoad = index > 10;
        imageWrapper.innerHTML = GetImageWrapperHTML(item.imageUrl, item.prompt, item.revisedPrompt, item.style, item.quality, item.id, doLazyLoad);

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
      if (data.error) {
        imageWrapper.innerHTML = `<p class="error-wrapper">Oops, OpenAI says "${data.error.message}" (Code: ${data.error.code}).</p><p>Your prompt was "<strong>${prompt}</strong>", though the issue may also have been in the unknowable OpenAI-auto-revised prompt.</p>`;
      }
      else {
        imageWrapper.setAttribute('data-id', data.id); 
        imageWrapper.innerHTML = GetImageWrapperHTML(data.imageUrl, prompt, data.revisedPrompt, style, quality, data.id, false);
      }
      document.getElementById('images').prepend(imageWrapper);

    })
    .catch(error => {
      console.log(error);
      button.disabled = false;
      button.classList.remove('spinner');
    });
  });
});


document.addEventListener('click', function(event) {
  if (event.target.classList.contains('delete-btn')) {
    const confirmed = confirm('Delete image?');
    if (confirmed) {
      const imageWrapper = event.target.closest('.image-wrapper');
      const imageId = imageWrapper.getAttribute('data-id');
  
      fetch(`/delete-image/${imageId}`, {
        method: 'DELETE'
      })
      .then(response => response.json())
      .then(data => {
        if (data.message === 'Image data deleted successfully') {
          imageWrapper.remove();
        } else {
          alert('Error deleting image');
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
    }
  }
});


function GetImageWrapperHTML(imageUrl, prompt, revisedPrompt, style, quality, id, doLazyLoad) {
  const loadingAttribute = doLazyLoad ? 'loading="lazy"' : '';
  return `
        <img src="${imageUrl}" alt="" ${loadingAttribute}>
        <p>${prompt}
          <br><button onclick="copyToClipboard('${prompt}', this)" class="copyToClipboard">📋 <span>copy prompt</span></button>
        </p>
        <p>${revisedPrompt}
          <br><button onclick="copyToClipboard('${revisedPrompt}', this)" class="copyToClipboard">📋 <span>copy revised prompt</span></button>
        </p>

        <p><span class="creationSettings">${style} style, ${quality} quality</span>
          <button class="delete-btn" data-id="${id}">Delete image</button>
        </p>
  `;
}

function copyToClipboard(textToCopy, btnElement) {
  navigator.clipboard.writeText(textToCopy).then(() => {
      btnElement.classList.add('copy-success');
      setTimeout(() => btnElement.classList.remove('copy-success'), 1000);
  }).catch(err => {
      console.error('Failed to copy text to clipboard', err);
  });
}
