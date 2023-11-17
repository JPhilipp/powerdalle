'use strict';

const suppressDuplicateCategories = true;
const showCategoriesInfoText = false;
const stageTypes = ['stageSubject', 'stageForeground', 'stageBackground'];
let distinctConnectionIds = [];
const trueString = 'true';
const categoriesToGetModifiers = ["people", "props"];

const dynamicEmoji = "✨";
const dragMeTextSubject = 'Person';
const dragMeTextWithoutEmoji = dragMeTextSubject + ' (drag me on stage)';
const dragMeText = '🧑 ' + dragMeTextWithoutEmoji;

const doubleClickToEditTextWithoutEmoji = ' Person (double-click to edit)';
const doubleClickToEditText = '🧑 ' + doubleClickToEditTextWithoutEmoji;

function addCategories() {
  let titleCount = 0;
  let info = '';

  for (let category in categories) {
    let button = document.createElement("button");

    const categoryEmoji = category.split(" ")[0];
    const categoryTitle = category.split(" ").slice(1).join(" ");
    const categoryName = categoryTitle.toLowerCase().replace(" & ", "_").replace(" ", "_");

    info += categoryTitle + " (";

    button.className = "tab";
    button.id = `tab-${categoryName}`;
    button.onclick = function() { showCategory(categoryName); };
    button.textContent = categoryEmoji;
    document.getElementById("categories").appendChild(button);
  
    let group = document.createElement("div");
    group.className = "object-group";
    group.dataset.category = categoryName;

    const includeRisque = true;

    const addTableOfContents = true;
    if (addTableOfContents) {
      for (let subGroup of categories[category]) {
        let subGroupLinkDiv = document.createElement("div");
        subGroupLinkDiv.className = "subGroupLink";

        group.appendChild(subGroupLinkDiv);

        let subGroupTitleId = toId(subGroup.title);

        let aElement = document.createElement("a");
        aElement.href = `#${subGroupTitleId}`;
        let [emoji, title] = getEmojiAndTitle(subGroup.title);
        aElement.innerHTML = emoji + ' <span>' + title + '</span>';

        subGroupLinkDiv.appendChild(aElement);
      }
      group.appendChild(document.createElement("hr"));
    }
  
    for (let subGroup of categories[category]) {
      let titles = [];

      let subGroupTitle = subGroup.title;
      let subGroupObjects = subGroup.objects;

      info += subGroupTitle + ", ";

      let subGroupDiv = document.createElement("div");
      subGroupDiv.className = "subGroupTitle";
      subGroupDiv.innerHTML = subGroupTitle;
      let subGroupTitleId = toId(subGroupTitle);
      subGroupDiv.id = subGroupTitleId;
      subGroupDiv.addArticle = boolToString(subGroup.addArticle);
      group.appendChild(subGroupDiv);

      for (let item of subGroupObjects) {
        let [emoji, title] = getEmojiAndTitle(item);
        const typeName = title.toLowerCase().replace(" ", "_") + "_" + titleCount;

        if (suppressDuplicateCategories && titles.includes(title)) {
          console.error(`Duplicate title "${title}" found in category "${category} - ${subGroupTitle}"`);
        }
        else {

          if (includeRisque || !isRisque(title)) {
            let div = document.createElement("div");
            div.className = "stageObject draggable original";
            div.draggable = "true";
            div.dataset.type = typeName;
            div.dataset.category = categoryName;
            div.dataset.title = title;
            div.dataset.subGroupTitleId = subGroupTitleId;
            div.dataset.keepCase = boolToString(subGroup.keepCase);
            div.dataset.addArticle = boolToString(subGroup.addArticle);
            div.innerHTML = `${emoji} ${title}`;
            group.appendChild(div);

            titles.push(title);
            titleCount++;
          }

        }
      }

      let isLastSubGroup = subGroup === categories[category][categories[category].length - 1];
      if (!isLastSubGroup) {
        let hr = document.createElement("hr");
        group.appendChild(hr);
      }
    }

    info += ")";
    if (category === Object.keys(categories)[Object.keys(categories).length - 1]) {
      info += ".";
    }
    else {
      info += ", ";
    }
  
    document.getElementById("objects").appendChild(group);
  }
  
  let titleCountCommaSeparated = titleCount.toLocaleString('en-US');
  console.log("Added " + titleCountCommaSeparated + " stage objects.");

  info = info.replace(/, \)/g, ")");
  if (showCategoriesInfoText) {
    console.log(info);
  }
}

function toId(text) {
  text = text.toLowerCase();
  text = text.replace(/[^a-z]/g, "_");
  text = text.replace(/^_+|_+$/g, "");
  return text;
}

document.addEventListener('DOMContentLoaded', () => {
  handleIfInIframe();
  if (isMobile()) { addMobileInfo(); }
  addCategories();

  const draggableItems = document.querySelectorAll('.draggable.original');
  draggableItems.forEach(item => {
    item.addEventListener('dragstart', handleToolbarDragStart);
  });

  document.body.addEventListener('dragover', handleDragOverPage);
  document.body.addEventListener('drop', handleDropOnPage);

  const stageLayers = document.querySelectorAll('.stageSection');
  enableDrop(stageLayers);
  
  const customStageObjects = document.querySelectorAll('.stageObject[data-category="custom"]');
  const nonCustomStageObjects = document.querySelectorAll('.stageObject[data-category]:not([data-category="custom"])');
  customStageObjects.forEach(element => {
    enableDoubleClickEditing(element);
  });
  nonCustomStageObjects.forEach(element => {
    enableDoubleClickEditingNotSupported(element);
  });
  
  showCategory('custom');

  loadCustomStageObjects();
  if (isDesktop()) {
    ensureDrageMeSampleStageObjectExists();
  }
});

function addMobileInfo() {
  let info = document.createElement("div");
  info.className = "infoAboutDesktopVersion";
  info.innerHTML = "On desktop, you also get a stage to drag on &amp; more 🙂";

  let promptWrapper = document.getElementById("promptWrapper");
  promptWrapper.appendChild(info);
}

function ensureDrageMeSampleStageObjectExists() {
  let [emoji, title] = getEmojiAndTitle(dragMeText);
  let sampleStageObject = document.querySelector(`.stageObject[data-title*="${title}"]`);
  if (!sampleStageObject) {
    addNewStageObject(dragMeText);
  }
}

function enableDoubleClickEditingNotSupported(element) {
  if (isMobile()) {
    enableClickAddingToRecent(element);
    return;
  }

  element.addEventListener('dblclick', function() {
    customAlert("Please move to stage first.");
  });
}

function enableClickAddingToRecent(element) {
  element.addEventListener('click', function() {
    addStageObjectToRecent(element);
    element.classList.add('animateStageObjectSelected');
    setTimeout(() => { element.classList.remove('animateStageObjectSelected'); }, 750);
  });
}
  
function enableDoubleClickEditing(element) {
  if (isMobile()) {
    enableClickAddingToRecent(element);
    return;
  }  

  element.addEventListener('dblclick', function() {
    if (element.querySelector('input')) { return; }

    let originalText = this.innerText;

    if (originalText == doubleClickToEditText) {
      const regexBetweenBrackets = /\((.*?)\)/g;
      originalText = originalText.replace(regexBetweenBrackets, "").trim();
    }

    let input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = originalText;

    this.innerHTML = '';
    this.appendChild(input);
    input.focus();

    let lastSavedInputValue;

    const updateText = () => {
      if (input.value === lastSavedInputValue) { return; }
      lastSavedInputValue = input.value;

      let [emoji, title] = getEmojiAndTitle(input.value || originalText);
      if (emoji === "") { emoji = dynamicEmoji; }
      if (!title || title.trim() == "" || startsWithEmoji(title)) { title = "Something"; }
      const doubleSpacesRegex = /\s\s+/g;
      title = title.replace(doubleSpacesRegex, ' ');
      element.innerText = emoji + " " + title;

      element.dataset.title = title;
      handleStageChanged();
      saveCustomStageObjects();
      addStageObjectToRecent(element);
    };

    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            updateText(e);
        }
    });

    input.addEventListener('keyup', function(e) {
      if (e.key === 'Escape') {
        input.value = originalText;
        input.blur();
      }
    });

    input.addEventListener('blur', updateText);
  });
}

function getEmojiAndTitle(item) {
  let emoji;
  let title;
  
  if (item.startsWith("[color] ")) {
    const color = item.split(" ").slice(1).join(" ").toLowerCase().replace(" color", "").replace(" ", "");
    emoji = `<span class="colorEmoji" style="background-color: ${color}">&nbsp;</span>`;
    title = item.split(" ").slice(1).join(" ");
  }
  else {
    if (startsWithEmoji(item) && item.includes(" ")) {
      emoji = item.split(" ")[0];
      title = item.split(" ").slice(1).join(" ");
    }
    else {
      emoji = "";
      title = item.trim();
    }
  }

  title = title.replace("’", "'");

  return [emoji, title];
}

function startsWithEmoji(text) {
  const regexMatchingEmojiUnicodeRanges = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  return regexMatchingEmojiUnicodeRanges.test(text);
}

function handleStageChanged() {
  updateModifierConnections();
  updatePrompt();
}

function updateModifierConnections() {
  clearModifierConnections();
  stageTypes.forEach(stageType => {
    setModifierConnections(document.getElementById(stageType));
  });
}

function clearModifierConnections() {
  distinctConnectionIds = [];
  const stage = document.getElementById('stage');
  const stageObjects = stage.querySelectorAll('.stageObject');
  stageObjects.forEach(obj => {
    obj.removeAttribute('data-connected-to-id');
    obj.classList.remove('connectedNonModifier');
  });
}

function setModifierConnections(stage) {
  const connectionPrefix = "connection";
  const stageObjects = stage.querySelectorAll('.stageObject');
  
  const allObjects = stage.querySelectorAll('.stageObject');
  allObjects.forEach(obj => {
    removeClassesStartingWith(obj, connectionPrefix);
  });

  const modifiers = stage.querySelectorAll('.stageObject[data-category="modifiers"]');

  modifiers.forEach(modifier => {
    const modifierRect = modifier.getBoundingClientRect();
    let nearestNonModifier = undefined;
    let nearestNonModifierDistance = Number.MAX_SAFE_INTEGER;

    stageObjects.forEach(obj => {
      if (categoriesToGetModifiers.includes(obj.dataset.category)) {
        const objRect = obj.getBoundingClientRect();
        const distance = Math.sqrt(Math.pow(modifierRect.x - objRect.x, 2) + Math.pow(modifierRect.y - objRect.y, 2));
        if (distance < nearestNonModifierDistance) {
          nearestNonModifier = obj;
          nearestNonModifierDistance = distance;
        }
      }
    });

    if (nearestNonModifier) {
      if (!distinctConnectionIds.includes(nearestNonModifier.id)) {
        distinctConnectionIds.push(nearestNonModifier.id);
      }
      const index = distinctConnectionIds.indexOf(nearestNonModifier.id);
      const connectionNumber = index + 1;

      modifier.dataset.connectedToId = nearestNonModifier.id;
      
      modifier.          classList.add(`${connectionPrefix}${connectionNumber}`);
      nearestNonModifier.classList.add(`${connectionPrefix}${connectionNumber}`);
      nearestNonModifier.classList.add('connectedNonModifier');
    }
  });
}

function removeClassesStartingWith(element, prefix) {
  const classList = element.classList;
  for (let i = 0; i < classList.length; i++) {
    if (classList[i].startsWith(prefix)) {
      classList.remove(classList[i]);
      i--;
    }
  }
}

function connectObjectsWithLine(obj1, obj2) {
  const line = document.createElement('div');
  line.className = 'line';

  const x1 = obj1.offsetLeft + obj1.offsetWidth / 2;
  const y1 = obj1.offsetTop  + obj1.offsetHeight / 2;
  const x2 = obj2.offsetLeft + obj2.offsetWidth / 2;
  const y2 = obj2.offsetTop  + obj2.offsetHeight / 2;

  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angle  = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

  line.style.width = length + "px";
  line.style.top = y1 + "px";
  line.style.left = x1 + "px";
  line.style.transform = "rotate(" + angle + "deg)";
  line.style.transformOrigin = "0 0";
}

function updatePrompt() {
  const inTheForeground = "In the foreground, we have ";
  const inTheBackground = "In the background, we have ";
  const pleaseShow = "Please show ";

  let subjectText         = getStageSectionText('stageSubject', pleaseShow);
  let subjectLocationText = getStageSectionText('stageSubject', "The location is ", undefined, true);
  let foregroundText      = getStageSectionText('stageForeground', inTheForeground);
  let backgroundText      = getStageSectionText('stageBackground', inTheBackground);
  let ambienceText        = getStageSectionText(undefined, "Make it ", 'ambience');
  let styleText           = getStageSectionText(undefined, "Use a style of ", 'styles');
  
  let text = subjectText + subjectLocationText + foregroundText + backgroundText + ambienceText + styleText;
  text = text.trim();
  text = pluralizeSentence(text);

  const dragMeLower = dragMeTextWithoutEmoji.toLowerCase();
  const dragMeSubjectLower = dragMeTextSubject.toLowerCase();
  text = text.replace(new RegExp(dragMeLower, 'gi'), dragMeSubjectLower);

  text = text.replace(/ \./g, ".");
  text = text.replace(/ ,/g, ",");

  let dragMeSubject = dragMeTextSubject.toLowerCase();
  text = text.replace("show " + dragMeSubject, "show " + addIndefiniteArticle(dragMeSubject));
  text = text.replace("have " + dragMeSubject, "have " + addIndefiniteArticle(dragMeSubject));

  text = text.replace(/, and\./g, "."); 

  text = text.replace(inTheForeground.trim() + ".", "");
  text = text.replace(inTheBackground.trim() + ".", "");
  text = text.replace(pleaseShow.trim() + ".", "");
  text = text.trim();

  const doubleSpacesRegex = /\s\s+/g;
  text = text.replace(doubleSpacesRegex, ' ');

  text = text.replace(/, ,/g, ",");
  text = text.replace(/,,/g, ",");

  const promptElement = document.getElementById('prompt');
  promptElement.value = text;

  messageParent('promptUpdated', text);
}

function getStageSectionText(stageSectionId, prefix, category, subjectLocationOnly) {
  const isSpecificStage = stageSectionId !== undefined; 
  if (!isSpecificStage) { stageSectionId = 'stage'; }

  const stageAgnosticCategories = ["ambience", "styles"];
  
  const anyStage = document.getElementById('stage');
  const stageSection = document.getElementById(stageSectionId);
  const stageObjectsNodeList = category ?
      stageSection.querySelectorAll(`.stageObject[data-category="${category}"]`) :
      stageSection.querySelectorAll('.stageObject');
  let stageObjects = Array.from(stageObjectsNodeList);

  const theWorldOf = " the world of ";
  const subGroupPrefixes = {
    "time": "during ",
    "book_worlds": theWorldOf,
    "comic_worlds": theWorldOf,
    "franchise_worlds": theWorldOf,
    "game_worlds": theWorldOf,
    "historical_events": " the event of ",
  };

  if (stageObjects.length > 0) {
    stageObjects.sort((a, b) => {
      return a.getBoundingClientRect().x - b.getBoundingClientRect().x;
    });
  }

  let text = "";
  if (stageObjects.length >= 1) {
    let i = 0;

    stageObjects.forEach(obj => {
      const isSubjectLocation = stageSectionId == 'stageSubject' && obj.dataset.category === 'location';

      if (subjectLocationOnly) {
        if (isSubjectLocation) {
          if (text == "") { text = prefix; }
          if (i >= 1) { text += ", "; }
          
          let subGroupPrefix = subGroupPrefixes[obj.dataset.subGroupTitleId];
          if (subGroupPrefix) { text += subGroupPrefix; }

          let title = obj.dataset.title;
          title = toLowerCaseUnlessKeepCase(title, obj.dataset.keepCase)
          if (stringToBool(obj.dataset.addArticle)) {
            title = addIndefiniteArticle(title);
          }
          
          text += title;

          i++;
        }
      }
      else if (!isSubjectLocation) {
        const isStageAgnosticCategory = stageAgnosticCategories.includes(obj.dataset.category);
        const isModifier = obj.dataset.category === "modifiers" && obj.dataset.connectedToId !== undefined;

        if (text == "") { text = prefix; }
        if (i >= 1) { text += ", "; }

        if (!isModifier &&
            ((isSpecificStage && !isStageAgnosticCategory) || (!isSpecificStage && isStageAgnosticCategory))) {

          let modifiers = anyStage.querySelectorAll(`.stageObject[data-connected-to-id="${obj.id}"]`);
          let modifierExtendedText = toLowerCaseUnlessKeepCase(obj.dataset.title, obj.dataset.keepCase);
          if (modifiers.length > 0) {
            for (var n = 0; n <= 1; n++) {
              const searchForPositionsOnly = n == 0;

              modifiers.forEach(modifier => {
                let isPosition = modifier.dataset.subGroupTitleId == "positions";
                if ((searchForPositionsOnly && isPosition) || (!searchForPositionsOnly && !isPosition)) {
                  if (modifier.dataset.subGroupTitleId == "positions") {
                    modifierExtendedText += " " + toLowerCaseUnlessKeepCase(modifier.dataset.title, modifier.dataset.keepCase);
                  }
                  else {
                    modifierExtendedText = toLowerCaseUnlessKeepCase(modifier.dataset.title, modifier.dataset.keepCase) +
                        " " + modifierExtendedText;
                  }
                }
              });
            }

            text += addIndefiniteArticle(modifierExtendedText);

          }
          else if (categoriesToGetModifiers.includes(obj.dataset.category)) {
            if (obj.dataset.keepCase) {
              text += toLowerCaseUnlessKeepCase(obj.dataset.title, obj.dataset.keepCase);
            }
            else {
              text += addIndefiniteArticle(toLowerCaseUnlessKeepCase(obj.dataset.title, obj.dataset.keepCase));
            }

          }
          else {
            let subGroupPrefix = subGroupPrefixes[obj.dataset.subGroupTitleId];
            if (subGroupPrefix) { text += subGroupPrefix; }

            let title = obj.dataset.title;
            title = toLowerCaseUnlessKeepCase(title, obj.dataset.keepCase)
            if (stringToBool(obj.dataset.addArticle)) {
              title = addIndefiniteArticle(title);
            }

            text += title;

          }
         
          i++;
        }
        else {
          //
        }
      }
    });
    
    if (text !== "") {
      let lastCommaIndex = findLastCommaNotFollowedByString(text, " we have");
      if (lastCommaIndex !== -1) {
        text = text.substring(0, lastCommaIndex) + ", and " + text.substring(lastCommaIndex + 2);
      }
      text += ". ";
    }
  }
  return text;
}

function toLowerCaseUnlessKeepCase(text, keepCaseString) {
  function containsTwoSuccessiveUppercase(str) {
    return /[A-Z]{2}/.test(str);
  }

  if (!stringToBool(keepCaseString)) {
    const isAbbreviation = containsTwoSuccessiveUppercase(text);
    if (!isAbbreviation) {
      text = text.toLowerCase();
    }
  }
  return text;
}

function findLastCommaNotFollowedByString(text, str) {
  var offset = str.length + 1;
  for (let i = text.length - 1; i >= 0; i--) {
      if (text[i] === ',' && text.substring(i, i + offset) !== ',' + str) {
          return i;
      }
  }
  return -1;
}

// Drag & Drop

let dragOffsetX = 0;
let dragOffsetY = 0;

function handleToolbarDragStart(e) {
  e.dataTransfer.setData('text/plain', 'create-' + e.target.getAttribute('data-type'));
  e.dataTransfer.effectAllowed = 'copy';

  const rect = e.target.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;
}

function handleStageDragStart(e) {
  e.dataTransfer.setData('text/plain', 'move-' + e.target.id);
  e.dataTransfer.effectAllowed = 'move';

  const rect = e.target.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;
}

function handleDragOver(e) {
  e.preventDefault();
}

function handleDragOverPage(e) {
  e.preventDefault();
}

function handleDrop(e) {
  e.preventDefault();

  const data = e.dataTransfer.getData('text/plain');
  
  const splitIndex = data.indexOf('-');
  const action = data.substring(0, splitIndex);
  const itemTypeOrId = data.substring(splitIndex + 1);
  let stage = e.target;

  if (action === 'create') {
    const original = document.querySelector(`.draggable.original[data-type="${itemTypeOrId}"]`);
    if (original) {
      const newItem = createNewItem(original);
      positionItemOnStage(stage, newItem, e);
      if (newItem.innerHTML === dragMeText) {
        newItem.innerHTML = doubleClickToEditText;
        newItem.dataset.category = 'people';
      }

      stage.appendChild(newItem);
      enableDoubleClickEditing(newItem);

      addStageObjectToRecent(newItem);
    } else {
      console.error('Original element for creating a new item not found:', itemTypeOrId);
    }
  } else if (action === 'move') {
    const itemToMove = document.getElementById(itemTypeOrId);
    if (itemToMove) {
      try {
        stage.appendChild(itemToMove);
        positionItemOnStage(stage, itemToMove, e);
        addStageObjectToRecent(itemToMove);
      } catch (e) {
        // console.error('Failed to move item to stage:', e);
      }
    } else {
      console.error('Item to move not found:', itemTypeOrId);
    }
  } else {
    console.error('Unsupported action or missing item:', data);
  }

  handleStageChanged();
}

function handleDropOnPage(e) {
  if (!e.target.classList.contains('stageSection') &&
      !e.target.classList.contains('draggable') &&
      !e.target.parentNode.classList.contains('draggable')) {
    const data = e.dataTransfer.getData('text/plain');
    const splitIndex = data.indexOf('-');
    const itemTypeOrId = data.substring(splitIndex + 1);

    const itemToMove = document.getElementById(itemTypeOrId);
    if (itemToMove) {
      itemToMove.remove();
      handleStageChanged();
    }
  }
}

function createNewItem(original) {
  const deepClone = true;
  const clone = original.cloneNode(deepClone);
  const uniqueId = original.getAttribute('data-type') + '-' + new Date().getTime();
  clone.id = uniqueId;

  clone.classList.remove('original');
  clone.style = '';

  clone.classList.add('clone');

  clone.setAttribute('draggable', true);
  clone.dataset.category = original.dataset.category;
  clone.dataset.title = original.dataset.title;

  clone.addEventListener('dragstart', handleStageDragStart);
  return clone;
}

function positionItemOnStage(stageSection, item, e) {
  const itemRect = e.target.getBoundingClientRect();
  const stageRect = document.getElementById('stage').getBoundingClientRect();
  const stageSectionRect = stageSection.getBoundingClientRect();
  item.style.position = 'absolute';

  let newX = e.clientX - stageSectionRect.left - dragOffsetX;
  let newY = e.clientY - stageSectionRect.top - dragOffsetY;

  if (stageSection.id == "stageSubject") {
    newX += stageSectionRect.width;
  }
  else if (stageSection.id == "stageForeground") {
    newX += stageSectionRect.width * 2;
  }

  const draggableMargin = 10;
  newX -= draggableMargin;
  newY -= draggableMargin;

  item.style.left = `${newX}px`;
  item.style.top = `${newY}px`;
  
  if (itemRect.right < stageRect.left || 
    itemRect.left > stageRect.right || 
    itemRect.bottom < stageRect.top || 
    itemRect.top > stageRect.bottom) {
     e.target.remove();
  }
}

function enableDrag(elements) {
  elements.forEach(elem => {
    if (!elem.classList.contains('original')) {
      elem.addEventListener('dragstart', handleStageDragStart, false);
    }
  });
}

function enableDrop(elements) {
  elements.forEach(elem => {
    elem.addEventListener('dragover', handleDragOver, false);
    elem.addEventListener('drop', handleDrop, false);
  });
}

//

function promptForNewStageObject() {
  let promptText = prompt("Enter text, like \"orc woman\" or \"colorful flower vase\":");
  if (promptText && promptText.trim() !== "") {
    let unwantedChars = ['"', '_', '<', '>'];
    for (let char of unwantedChars) {
      promptText = promptText.replace(char, " ");
    }
    const multipleWhitespaceRegex = /\s\s+/g;
    promptText = promptText.replace(multipleWhitespaceRegex, ' ').trim();

    promptText = capitalize(promptText);
    addNewStageObject(promptText, undefined, true);
    saveCustomStageObjects();
  }
}

function addNewStageObject(text, parentNode, doShake, ignoreOverride) {
  if (parentNode === undefined) {
    parentNode = document.querySelector('#customStageObjects')
  }

  const stageObject = document.createElement('div');
  stageObject.classList.add('stageObject', 'draggable', 'original');
  stageObject.setAttribute('draggable', 'true');
  if (doShake) {
    stageObject.classList.add('shake');
    setTimeout(() => { stageObject.classList.remove('shake'); }, 500);
  }

  let [emoji, title] = getEmojiAndTitle(text);
  if (emoji === "") { emoji = dynamicEmoji; }
  stageObject.innerHTML = emoji + " " + title;
  stageObject.dataset.category = "custom";
  stageObject.dataset.type = title;
  stageObject.dataset.title = title;
  stageObject.dataset.keepCase = false;
  stageObject.dataset.originalCategory = stageObject.dataset.category;

  if (!ignoreOverride) {
    overrideStageObjectWithMatchingData(stageObject, text, title);
  }

  parentNode.appendChild(stageObject);

  stageObject.addEventListener('dragstart', handleToolbarDragStart);

  enableDrag([stageObject]);
  enableDoubleClickEditing(stageObject);
}

function overrideStageObjectWithMatchingData(stageObject, text, title) {
  if (text != dragMeText && text != dragMeTextWithoutEmoji) {
    let titleLower = title.toLowerCase();
    for (let categoryKey in categories) {
      const categoryTitle = categoryKey.split(" ").slice(1).join(" ");
      if (categoryTitle != "Custom") {
        for (let subGroup of categories[categoryKey]) {
          for (let obj of subGroup.objects) {
            const [objEmoji, objTitle] = getEmojiAndTitle(obj);
            let objTitleLower = objTitle.toLowerCase();
            if (objTitleLower == titleLower) {
              const typeName = objTitleLower.replace(" ", "_");
              const categoryName = categoryTitle.toLowerCase().replace(" & ", "_").replace(" ", "_");
              const subGroupTitleId = toId(subGroup.title);

              stageObject.innerHTML = objEmoji + " " + objTitle;
              stageObject.dataset.type = typeName;
              stageObject.dataset.category = categoryName;
              stageObject.dataset.title = title;
              stageObject.dataset.subGroupTitleId = subGroupTitleId;
              stageObject.dataset.keepCase = subGroup.keepCase;

              break;
            }
          }
        }
      }
    }
  }
}

function saveCustomStageObjects() {
    const objectsDiv = document.querySelector('#customStageObjects');
    const customObjects = objectsDiv.querySelectorAll('.stageObject[data-original-category="custom"]');

    const customObjectsArray = [];
    const dragMeLower = dragMeTextWithoutEmoji.toLowerCase();
    customObjects.forEach(obj => {
      if (!obj.dataset.title.toLowerCase().includes(dragMeLower)) {
        customObjectsArray.push(obj.dataset.title);
      }
    });
    let json = JSON.stringify(customObjectsArray);
    localStorage.setItem('customStageObjects', json);
}

function loadCustomStageObjects() {
  const json = localStorage.getItem('customStageObjects');
  if (json) {
    let dragMeLower = dragMeText.toLowerCase();
    const customObjectsArray = JSON.parse(json);
    customObjectsArray.forEach(obj => {
      if (obj && obj.toLowerCase() !== dragMeLower) {
        addNewStageObject(obj);
      }
    });
  }
}

function removeCustomStageObjects() {
  const customObjects = document.querySelectorAll('.stageObject[data-original-category="custom"]');
  if (customObjects.length > 0) {
    if (confirm("Remove all custom items?")) {
      customObjects.forEach(obj => {
        obj.remove();
      });
      saveCustomStageObjects();
    }
  }
  else {
    customAlert("There are no custom objects.");
  }
}

function clearStage(quiet) {
  const stage = document.getElementById('stage');
  const stageObjects = stage.querySelectorAll('.stageObject');
  if (stageObjects.length > 0) {
    if (quiet || confirm("Remove all items from stage?")) {
      stageObjects.forEach(obj => {
        obj.remove();
      });
    }
  }
  else {
    if (!quiet) {
      customAlert("Stage is clear already.");
    }
  }
}

function addRandomStageObjects() {
  const randomStageObjects = document.querySelector('#randomStageObjects')
  randomStageObjects.innerHTML = '';

  for (let category in categories) {
    if (category.toLowerCase().includes("custom")) { continue; }
    let randomSubGroup = categories[category][Math.floor(Math.random() * categories[category].length)];
    
    let randomObject = undefined;
    while (!randomObject) {
      let randomObjectCandidate = randomSubGroup.objects[Math.floor(Math.random() * randomSubGroup.objects.length)];
      let [emoji, title] = getEmojiAndTitle(randomObjectCandidate);
      if (!isRisque(title) && !isPossiblyMinor(title)) {
        randomObject = randomObjectCandidate;
      }
    }

    addNewStageObject(randomObject, randomStageObjects, true);
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showCategory(category) {
  const tabIsActiveAlready = document.getElementById(`tab-${category}`).classList.contains('active');
  const selectedCategory = document.querySelector(`.object-group[data-category="${category}"]`);

  if (tabIsActiveAlready) {
    selectedCategory.scrollTop = 0;
  }
  else {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });

    document.getElementById(`tab-${category}`).classList.add('active');

    const objectsContainer = document.getElementById('objects');
    objectsContainer.style.display = 'flex';

    document.querySelectorAll('.object-group').forEach(group => {
      group.style.display = 'none';
      group.classList.remove('active');
    });
    
    if (selectedCategory) {
      selectedCategory.style.display = 'flex';
      selectedCategory.classList.add('active');
    } else {
      console.error('Selected category does not exist:', category);
    }
  }
}

function searchStageObjectsInCategories() {
  let searchInput = prompt("Search for:");
  const searchResultStageObjects = document.querySelector('#searchResultStageObjects')
  searchResultStageObjects.innerHTML = '';

  if (searchInput && searchInput.trim() !== "") {
    searchInput = searchInput.trim().toLowerCase();

    let useExactMatch = searchInput.startsWith("\"") && searchInput.endsWith("\"");

    searchInput = searchInput.replace(/"/g, " ");
    const multipleWhitespaceRegex = /\s\s+/g;
    searchInput = searchInput.replace(multipleWhitespaceRegex, ' ').trim();
    let stageObjectTitles = [];
    let resultCount = 0;

    let searchResults = [];
    for (let category in categories) {
      for (let subGroup of categories[category]) {
        let [subGroupEmoji, subGroupTitle] = getEmojiAndTitle(subGroup.title);
        const subGroupTitleLower = subGroupTitle.toLowerCase();

        for (let item of subGroup.objects) {
          let [emoji, title] = getEmojiAndTitle(item);
          let titleLower = title.toLowerCase();

          let isMatch = false;
          if (useExactMatch) {
            isMatch = searchInput === titleLower ||
              searchInput === emoji + " " + titleLower;
          }
          else {
            isMatch = titleLower.includes(searchInput) ||
              subGroupTitleLower.includes(searchInput) ||
              searchInput === emoji ||
              searchInput === emoji + " " + titleLower;
          }
          if (isMatch && !stageObjectTitles.includes(title)) {
            stageObjectTitles.push(title);
            const categoryEmoji = category.split(" ")[0];
            searchResults.push(categoryEmoji + "  >  " + subGroup.title + " > " + item);
            addNewStageObject(item, searchResultStageObjects, undefined, true);
            resultCount++;
          }
        }
      }
    }
    
    if (resultCount === 0) {
      customAlert("No results found.");
    }
    else {
      let subGroupSearch = document.getElementById('subGroupSearch');
      subGroupSearch.scrollIntoView();
    }
  }
}

function customAlert(text, allowHTML) {
  if (!allowHTML) {
    escapeHTML(text);
    text = text.replace(/\n/g, "<br>");
  }

  var backdrop = document.createElement('div');
  backdrop.className = 'custom-alert-backdrop';

  var alertBox = document.createElement('div');
  alertBox.className = 'custom-alert-box';
  alertBox.innerHTML = text;

  var closeButton = document.createElement('span');
  closeButton.className = 'custom-alert-close-btn';
  closeButton.innerHTML = '&times;';

  var closeFunction = function() {
    backdrop.remove();
  };

  backdrop.addEventListener('click', closeFunction);

  alertBox.addEventListener('click', function(event) {
    event.stopPropagation();
  });

  closeButton.onclick = closeFunction;

  alertBox.appendChild(closeButton);
  backdrop.appendChild(alertBox);

  document.body.appendChild(backdrop);

  document.addEventListener('keyup', function(e) {
    if (e.key === 'Escape') {
      closeFunction();
    }
  });
}

function copyPromptToClipboard() {
  const promptElement = document.getElementById('prompt');
  const textToCopy = promptElement.value;

  navigator.clipboard.writeText(textToCopy).then(() => {
    promptElement.classList.add('animateTextbox');
    setTimeout(() => { promptElement.classList.remove('animateTextbox'); }, 350);
  }).catch(err => {
    console.error('Failed to copy text to clipboard:', err);
  });
}

function clearRecentStageObjects() {
  document.querySelector('#recentStageObjects').innerHTML = '';
}

function addStageObjectToRecent(stageObject) {
  const recentStageObjects = document.querySelector('#recentStageObjects')
  let existingObject;
  recentStageObjects.querySelectorAll('.stageObject').forEach(element => {
    if (element.dataset.title.toLowerCase() === stageObject.dataset.title.toLowerCase()) {
      existingObject = element;
    }
  });

  if (!existingObject) {
    const doShake = false;
    const text = stageObject.innerHTML;
    const textLower = text.toLowerCase();
    if (!textLower.includes(dragMeTextWithoutEmoji.toLowerCase()) &&
        !textLower.includes(doubleClickToEditTextWithoutEmoji.toLowerCase())
        ) {
      const ignoreOverride = true;
      addNewStageObject(text, recentStageObjects, doShake, ignoreOverride);
    }
  }
}

function boolToString(bool) {
  return bool ? trueString : '';
}

function stringToBool(boolString) {
  return boolString === trueString;
} 

function addIndefiniteArticle(text) {
  function couldBeIntNumber(str) {
    const num = +str;
    const couldBe = Number.isInteger(num) && String(num) === str;
    return couldBe;
  }

  if (text) {
    const textLower = text.toLowerCase();
    if (!couldBeIntNumber(text.charAt(0)) && textLower != 'something') {
      const vowels = ["a", "e", "i", "o", "u"];
      const mayBePlural = text.endsWith("es");
      if (!mayBePlural && !startsWithIndefiniteArticle(text)) {
        text = (vowels.includes(textLower[0]) ? "an" : "a") +
            " " + text;
      }
    }
  }
  return text;
}

function startsWithIndefiniteArticle(word) {
  return word.startsWith("a ") || word.startsWith("an ");
}

function pluralizeSentence(sentence) {
  if (!sentence) { return sentence; }

  const pluralForms = {
    'person': 'people',
    'human': 'humans',
    'body': 'bodies',
    'woman': 'women',
    'man': 'men',
    'senior': 'seniors',
    'child': 'children',
    'toddler': 'toddlers',
    'baby': 'babies',
    'grandma': 'grandmas',
    'grandpa': 'grandpas',
    'teen': 'teens',
    'teenager': 'teenagers',
    'mother': 'mothers',
    'father': 'fathers',
    'daughter': 'daughters',
    'son': 'sons',
    'aunt': 'aunts',
    'uncle': 'uncles',
    'sister': 'sisters',
    'brother': 'brothers',
    'newborn': 'newborns',
    'family': 'families',
    'parent': 'parents',
    'partner': 'partners',
    'couple': 'couples'
  };

  let quantityWords = [
    "many",
    "multiple",
    "group of",
    "crowd of",
    "team of",
    "pair of",
    "trio of",
    "quartet of",
  ];

  let words = sentence.match(/[\w'-]+|[.,!?;]/g);
  if (!words) { return sentence; }

  for (let i = 0; i < words.length; i++) {
    let shouldPluralize = false;

    let prevWordNumber = parseInt(words[i - 1]);
    if (!isNaN(prevWordNumber) && prevWordNumber > 1) {
      shouldPluralize = true;
    }

    quantityWords.forEach(qw => {
      if (sentence.includes(qw) && sentence.indexOf(qw) < sentence.indexOf(words[i])) {
        shouldPluralize = true;
      }
    });

    if (shouldPluralize) {
      let wordWithoutPunctuation = words[i].replace(/[.,!?;]/g, '');
      if (pluralForms[wordWithoutPunctuation]) {
        words[i] = pluralForms[wordWithoutPunctuation] + words[i].replace(/[\w'-]+/g, '');
      }
    }
  }

  let sentenceAfter = words.join(' ');
  return sentenceAfter;
}

function isDesktop() {
  return !isMobile();
}

function isMobile() {
  return window.innerWidth <= 600 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

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

function isRisque(text) {
  const risqueWords = [
    "bikini", "shirtless", "pinup", "pin-up", "beachwear", "nightwear",
    "blood", "skin", "intestines",
    "underwear", "lingerie"
  ];
  return risqueWords.includes(text.trim().toLowerCase());
}

function isPossiblyMinor(text) {
  const minorWords = [
    "child", "toddler", "baby", "newborn", "teen", "teenager",
    "son", "daughter", "nephew", "niece"
  ];
  return minorWords.includes(text.trim().toLowerCase());
}

function showAbout() {
  let info = "";
  
  info = `
    <div class="about">
    <p>
    <strong>Prompt Inspirer helps you create prompts for text-to-image AI art generators</strong>
    <p>... like 
    ChatGPT Dall-E (great prompt understanding!),<br>
    Midjourney (great style!),<br>
    Stable Diffusion (great open source community!),<br>
    Adobe Firefly (great Photoshop integration!)
    and others.
    </p>
    <p>
    There's over 10,000 items you can drag onto the stage.
    <a href="https://www.youtube.com/watch?v=g2T3LDPkV-0" target="_blank">Here's an overview video</a>.
    If you have ideas for more words, categories &amp; features, please let me know!
    This tool is also open source &amp; integrated for quick local image generation
    with <a href="https://github.com/JPhilipp/powerdalle" target="_blank">Power Dall-E (GitHub)</a>.
    You can support me at my <a href="https://www.patreon.com/PhilippLenssen" target="_blank">Patreon</a>.
    </p>
    <p>
    Cheers!<br>
    <em>– <a href="mailto:philipp.lenssen@gmail.com">Philipp.Lenssen@gmail.com</a></em>
    </p>
    </div>
  `;

  customAlert(info, true);
}

function isInFrame() {
  return window.location !== window.parent.location;
}

function handleIfInIframe() {
  if (isInFrame()) {
    document.body.classList.add('in-iframe');
  }
}

function messageParent(messageType, optionalContent) {
  if (isInFrame()) {
    window.parent.postMessage(
      {type: messageType, content: optionalContent},
      '*'
    );
  }
}

function closeIfIframed() {
  document.getElementById('close-button-if-iframed').addEventListener('click', function() {
    console.log("Close clicked");
    messageParent('close');
  });

}
