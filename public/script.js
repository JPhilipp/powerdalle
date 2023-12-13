const inspirerId = 'inspirer';
let previousSearch = '';

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
        imageWrapper.innerHTML = getImageWrapperHTML(item.imageUrl, item.prompt, item.revisedPrompt, item.style, item.quality, item.size, item.id, item.model, doLazyLoad);

        imagesDiv.appendChild(imageWrapper);
      });

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          setInspirerDisplay('none');
          window.scrollTo(0, 0);
          document.getElementById('prompt').focus();
        }
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
    const promptPrefix = 'Please use this exact prompt, do not change it: ';
    if (!prompt.startsWith(promptPrefix)) {
      prompt = promptPrefix + prompt;
    }
  }

  var numImages = parseInt(document.getElementById('numImages').value, 10);

  Array.from({ length: numImages }, (_, i) => i + 1).forEach(function() {
    var imageWrapper = document.createElement('div');
    imageWrapper.classList.add('spinner');
    document.getElementById('images').prepend(imageWrapper);
  
    fetch('/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, style, size, quality })
    })
    .then(response => response.json())
    .then(data => {
      imageWrapper.classList.remove('spinner');
      imageWrapper.classList.add('image-wrapper');

      if (data.error) {
        imageWrapper.innerHTML = `<p class="error-wrapper">Oops, OpenAI says "${data.error.message}" (Code: ${data.error.code}).</p><p>Your prompt was "<strong>${prompt}</strong>", though the issue may also have been in the unknowable OpenAI-auto-revised prompt.</p>`;
      }
      else {
        imageWrapper.setAttribute('data-id', data.id); 
        imageWrapper.innerHTML = getImageWrapperHTML(data.imageUrl, prompt, data.revisedPrompt, style, quality, size, data.id, data.model, false);
      }
  
    })
    .catch(error => {
      console.log(error);
      imageWrapper.classList.remove('spinner');
      imageWrapper.innerHTML = `<p class="error-wrapper">Error generating image.</p>`;
    });
  });
});


document.addEventListener('click', function(event) {
  if (event.target.classList.contains('deleteButton')) {
    const confirmed = confirm('Delete image?');
    if (confirmed) {
      const imageWrapper = event.target.closest('.image-wrapper');
      const imageId = imageWrapper.getAttribute('data-id');
  
      fetch(`/delete-image/${imageId}`, {
        method: 'DELETE'
      })
      .then(response => response.json())
      .then(data => {
        if (data.message === 'Image deleted') {
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

document.getElementById('images').addEventListener('click', function(event) {
  if (event.target.classList.contains('generatedImage')) {
    if (event.ctrlKey) {
      rotateImage(event.target.id);
    } else {
      event.target.classList.toggle('fullSizeImage');
    }
  }
});

function addSearchHitsMarkup(text, searchQuery) {
  if (!text || !searchQuery) {
    console.log("Text or search query is empty", text, searchQuery);
    return text;
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  const escapedSearchQuery = escapeRegExp(searchQuery);
  const regex = new RegExp(escapedSearchQuery, 'gi');

  let newText = text.replace(regex, function(match) { return `<span class="searchHit">${match}</span>`; });

  if (!newText.includes('searchHit')) {
    const words = searchQuery.split(/\s+/);
    words.forEach(word => {
      const wordRegex = new RegExp(escapeRegExp(word), 'gi');
      newText = newText.replace(wordRegex, function(match) { return `<span class="searchHit">${match}</span>`; });
    });
  }

  return newText;
}

function removeSearchHitsMarkup(text) {
  text = text.replace(/<span class="searchHit">/g, '');
  text = text.replace(/<\/span>/g, '');
  return text;
}

function getImageWrapperHTML(imageUrl, prompt, revisedPrompt, style, quality, size, id, model, doLazyLoad, searchQuery) {
  const defaultModel = 'dall-e-3';

  let originalStyleValue = style;
  let originalQualityValue = quality;

  if (quality == 'hd') { quality = quality.toUpperCase(); }

  var settingsInfo = capitalize(style) + " Style, " + capitalize(quality) + " Quality";
  if (model && model != defaultModel) { settingsInfo += ", Model: " + model; }

  if (!revisedPrompt) { revisedPrompt = "(none)"; }

  prompt = escapeHTML(prompt);
  revisedPrompt = escapeHTML(revisedPrompt);

  if (searchQuery) {
    prompt        = addSearchHitsMarkup(prompt, searchQuery);
    revisedPrompt = addSearchHitsMarkup(revisedPrompt, searchQuery);
  }

  const loadingAttribute = doLazyLoad ? 'loading="lazy"' : '';
  return `
        <img src="${imageUrl}" alt="" ${loadingAttribute} id="image-${id}" class="generatedImage" data-angle="0">
        <div class="creationTools">
          <button onclick="rotateImage('image-${id}')" class="rotateButton imageButton" title="Rotate (alternative: Ctrl+Click)">↷</button>
          <button onclick="flipImage('image-${id}')" class="flipButton imageButton" title="Flip">↔️</button>
          <a href="#" class="additionalButtonsLink" onclick="showMoreOptions(event, '${id}')">...</a>
          <span id="additionalButtons-${id}" class="additionalButtons">
            <button class="deleteButton imageButton" data-id="${id}" title="Permanently deletes image from disk and database">🗑 Delete</button>
          </span>
        </div>
        <div class="promptWrapper">
          <div class="prompt">${prompt}</div>
          <div class="promptButtons">
            <button onclick="copyToClipboard(this)" class="copyToClipboard">📋 <span>copy prompt</span></button>
            <button onclick="redoPrompt(this, '${originalStyleValue}', '${originalQualityValue}', '${size}')" class="redoPrompt">&#9658; <span>Redo</span></button>
          </div>
        </div>
        <div class="promptWrapper">
          <div class="prompt">${revisedPrompt}</div>
          <div class="promptButtons">
            <button onclick="copyToClipboard(this)" class="copyToClipboard">📋 <span>copy revised prompt</span></button>
          </div>
        </div>
        <div class="creationSettings">
          ${settingsInfo}
        </div>
  `;
}

function showMoreOptions(event, id) {
  event.preventDefault();
  event.target.style.display = 'none';
  document.getElementById(`additionalButtons-${id}`).style.display = 'inline';
}

function rotateImage(id) {
  const image = document.getElementById(id);
  const currentAngle = image.getAttribute('data-angle') || '0';
  const newAngle = (parseInt(currentAngle) + 90) % 360;
  image.style.transform = `rotate(${newAngle}deg)`;
  image.setAttribute('data-angle', newAngle.toString());
}

function flipImage(id) {
  const image = document.getElementById(id);

  const currentAngle = image.getAttribute('data-angle') || '0';

  const isFlipped = image.getAttribute('data-flipped') === 'true';
  const newFlipState = !isFlipped;

  const flipTransform = newFlipState ? 'scaleX(-1)' : 'scaleX(1)';
  image.style.transform = `${flipTransform} rotate(${currentAngle}deg)`;
  
  image.setAttribute('data-flipped', newFlipState.toString());
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function copyToClipboard(btnElement) {
  let parentElement = btnElement.parentElement.parentElement;
  let textToCopy = parentElement.querySelector('.prompt').innerHTML;
  textToCopy = removeSearchHitsMarkup(textToCopy);

  navigator.clipboard.writeText(textToCopy).then(() => {
      btnElement.classList.add('copy-success');
      setTimeout(() => btnElement.classList.remove('copy-success'), 1000);
  }).catch(err => {
      console.error('Failed to copy text to clipboard', err);
  });
}

function redoPrompt(btnElement, style, quality, size) {
  let parentElement = btnElement.parentElement.parentElement;
  let textToRedo = parentElement.querySelector('.prompt').innerHTML;
  textToRedo = removeSearchHitsMarkup(textToRedo);

  document.getElementById('prompt').value = textToRedo;

  const options = {'style': style, 'quality': quality, 'size': size};
  Object.keys(options).forEach(function(option) {
    const optionValue = options[option];
    const dropdown = document.getElementById(option);
    const optionElement = Array.from(dropdown.options).find(option => option.value === optionValue);
    dropdown.selectedIndex = optionElement.index;
  });

  document.getElementById('generate').click();
  window.scrollTo(0, 0);
}

function togglePromptInspirer(event) {
  if (event.shiftKey || event.ctrlKey) {
    window.open('inspirer/', '_blank').focus();;
    return;
  }

  let currentIframe = document.getElementById('inspirer');
  if (!currentIframe) {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', 'inspirer/');
    iframe.setAttribute('id', inspirerId);
    iframe.setAttribute('title', 'Inspirer');

    document.body.appendChild(iframe);


    var backdrop = document.createElement('div');
    backdrop.id= 'backdrop';
  
    var closeFunction = function() {
      setInspirerDisplay('none');
    };
    backdrop.addEventListener('click', closeFunction);
    document.body.appendChild(backdrop);
  }
  else if (currentIframe.style.display != 'none') {
    setInspirerDisplay('none');
  }
  else {
    setInspirerDisplay('block');
  }
}

function setInspirerDisplay(styleValue) {
  [inspirerId, 'backdrop'].forEach(function(id) {
    let elm = document.getElementById(id);
    if (elm) {
      elm.style.display = styleValue;
    }
  });
}

function startSearch(event) {
  let query = prompt('Search in prompts:', previousSearch);

  if (query === null) { return; }
  previousSearch = query;
  
  if (!query) { return; }

  const resultsNode = document.getElementById('images')
  resultsNode.innerHTML = '';

  fetch('/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  })
  .then(response => response.json())
  .then(dataAll => {
    let results = dataAll.results;
    if (results.length === 0) {
      resultsNode.innerHTML = `<p class="error-wrapper">No results found for "${escapeHTML(query)}".</p>`;
    }
    else {
      results.forEach(function(data) {
        var imageWrapper = document.createElement('div');
        imageWrapper.classList.add('image-wrapper');
        imageWrapper.setAttribute('data-id', data.id); 
        resultsNode.prepend(imageWrapper);

        const doLazyLoad = false;
        imageWrapper.innerHTML = getImageWrapperHTML(data.imageUrl, data.prompt, data.revisedPrompt, data.style, data.quality, data.size, data.id, data.model, doLazyLoad, query);
      });

    }
  })
  .catch(error => {
    console.error('Search error:', error);
  });

}

window.addEventListener('message', function(e) {
  let data = e.data;
  // console.log('Message received', data);
  if (data.type) {
    let content = data.content;
    switch (data.type) {
      case 'promptUpdated':
        document.getElementById('prompt').value = content;
        break;

      case 'scrollBackToTop':
        window.scrollTo(0, 0);
        break;

      case 'close':
        setInspirerDisplay('none');
        break;
    }
  }
});

function escapeHTML(text) {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
