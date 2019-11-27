import '../sass/styles.scss';

let isFillEnabled = false;
let isColorEnabled = false;
let isPencilEnabled = false;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let canvasSize = 128;
let pixel = 4;
let imageWidth = 0;
let imageHeight = 0;
let savedImage;

window.onload = () => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  const clear = document.querySelector('.canvas--options--clear');
  const load = document.querySelector('.canvas--options--load');
  const search = document.querySelector('.search');
  const grayscaleButton = document.querySelector('.canvas--options input[name="b&w"]');

  const current = document.querySelector('.currentColor');
  let currentColor = current.firstElementChild.style.backgroundColor;

  const colorInput = document.querySelector('.input');

  const red = document.body.querySelector('.red');
  const blue = document.body.querySelector('.blue');
  const prev = document.body.querySelector('.prevColor');
  let prevColor = prev.firstElementChild.style.backgroundColor;

  if (localStorage.getItem('currentColor') === null) {
    currentColor = '#C4C4C4';
    current.firstElementChild.style.backgroundColor = currentColor;
    prevColor = '#41F795';
    prev.firstElementChild.style.backgroundColor = prevColor;
  } else {
    currentColor = localStorage.getItem('currentColor');
    current.firstElementChild.style.backgroundColor = currentColor;
    prevColor = localStorage.getItem('prevColor');
    prev.firstElementChild.style.backgroundColor = prevColor;
  }

  const fillBucket = document.getElementById('fillBucket');
  const colorPicker = document.getElementById('chooseColor');
  const pencil = document.getElementById('pencil');

  const sizeSwitcher = document.querySelector('.canvas--switcher');
  const sizeSmall = document.querySelector('.canvas--switcher input[class=small]');
  const sizeMedium = document.querySelector('.canvas--switcher input[class=medium]');
  const sizeLarge = document.querySelector('.canvas--switcher input[class=large]');

  function select(element) {
    let elem = element;
    const string = document.querySelectorAll('.string');
    string.forEach((e) => {
      e.classList.remove('isSelected');
    });
    switch (true) {
      case isColorEnabled:
        elem = colorPicker;
        break;
      case isFillEnabled:
        elem = fillBucket;
        break;
      case isPencilEnabled:
        elem = pencil;
        break;
      default: elem = pencil;
    }
    elem.classList.add('isSelected');
  }

  function fill() {
    isColorEnabled = false;
    isPencilEnabled = false;
    isFillEnabled = true;
    select(fillBucket);
    colorInput.classList.add('hide');
    localStorage.setItem('tool', 'isFillEnabled');
  }

  /* Function floodFill needs to be rewritten taking into account different canvas sizes,
   but current task doesn't require it to work */
  function floodFill(e) {
    if (isFillEnabled) {
      let x;
      let y;
      const newColor = currentColor;
      const queue = [];
      if (e.offsetX) {
        x = Math.floor(e.offsetX / pixel) * pixel;
        y = Math.floor(e.offsetY / pixel) * pixel;
      }
      const initial = ctx.getImageData(x, y, pixel, pixel).data;
      const initialColor = `rgb(${initial[0]},${initial[1]},${initial[2]})`;
      ctx.fillStyle = newColor;
      ctx.fillRect(x, y, pixel, pixel);
      queue.push([x, y]);
      const moves = [
        [-pixel, 0],
        [0, +pixel],
        [+pixel, 0],
        [0, -pixel],
      ];
      while (queue.length) {
        [[x, y]] = queue;
        for (let i = 0; i < moves.length; i += 1) {
          const newX = x + moves[i][0];
          const newY = y + moves[i][1];
          if (newX >= 0 && newX < 512 && newY >= 0 && newY < 512) {
            const cell = ctx.getImageData(newX, newY, pixel, pixel).data;
            const cellColor = `rgb(${cell[0]},${cell[1]},${cell[2]})`;
            if (cellColor === initialColor) {
              queue.push([newX, newY]);
              ctx.fillRect(newX, newY, pixel, pixel);
            }
          }
        }
        queue.shift();
      }
    }
  }

  function chooseColor() {
    isPencilEnabled = false;
    isFillEnabled = false;
    isColorEnabled = true;
    select(colorPicker);
    localStorage.setItem('tool', 'isColorEnabled');
  }

  function chooseColorInput() {
    isColorEnabled = true;
    select(colorPicker);
    if (isColorEnabled) {
      colorInput.classList.remove('hide');
    }
  }

  function pickColor(e) {
    if (isColorEnabled) {
      let x = e.offsetX || e.layerX;
      let y = e.offsetY || e.layerY;
      switch (canvasSize) {
        case 128:
          pixel = 4;
          break;
        case 256:
          pixel = 2;
          break;
        case 512:
          pixel = 1;
          break;
        default: pixel = 4;
      }
      const newColorData = ctx.getImageData(x /= pixel, y /= pixel, pixel, pixel).data;
      const newColor = `rgb(${newColorData[0]},${newColorData[1]},${newColorData[2]})`;
      prev.firstElementChild.style.backgroundColor = currentColor;
      currentColor = newColor;
      current.firstElementChild.style.backgroundColor = newColor;
    }
    localStorage.setItem('currentColor', currentColor);
    localStorage.setItem('prevColor', prev.firstElementChild.style.backgroundColor);
  }

  function setCurrentColor(newColor) {
    const oldColor = currentColor;
    currentColor = getComputedStyle(newColor.firstElementChild).backgroundColor;
    current.firstElementChild.style.backgroundColor = currentColor;
    prev.firstElementChild.style.backgroundColor = oldColor;
    localStorage.setItem('currentColor', currentColor);
    localStorage.setItem('prevColor', prev.firstElementChild.style.backgroundColor);
  }

  function updateColor(event) {
    const oldColor = currentColor;
    currentColor = event.target.value;
    current.firstElementChild.style.backgroundColor = currentColor;
    prev.firstElementChild.style.backgroundColor = oldColor;
    localStorage.setItem('currentColor', currentColor);
    localStorage.setItem('prevColor', prev.firstElementChild.style.backgroundColor);
  }

  function drawPencil() {
    isColorEnabled = false;
    isFillEnabled = false;
    isPencilEnabled = true;
    select(pencil);
    colorInput.classList.add('hide');
    localStorage.setItem('tool', 'isPencilEnabled');
  }

  function draw(event) {
    if (isPencilEnabled) {
      if (!isDrawing) return;
      switch (canvasSize) {
        case 128:
          pixel = 4;
          break;
        case 256:
          pixel = 2;
          break;
        case 512:
          pixel = 1;
          break;
        default: pixel = 4;
      }
      lastX = event.offsetX;
      lastY = event.offsetY;
      const x = Math.floor(lastX / pixel);
      const y = Math.floor(lastY / pixel);
      ctx.fillStyle = currentColor;
      ctx.fillRect(x, y, 4, 4);
    }
  }

  function pressKey(key) {
    switch (key) {
      case 'KeyB':
        fill();
        break;
      case 'KeyP':
        drawPencil();
        break;
      case 'KeyC':
        chooseColor();
        break;
      default: drawPencil();
    }
  }

  function reflectImage(image, width, height) {
    if (!image) { return; }
    const max = Math.max(width, height);
    const proportion = canvasSize / max;
    const scaledWidth = width * proportion;
    const scaledHeight = height * proportion;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);
    let x = 0;
    let y = 0;
    if (scaledWidth < canvasSize) {
      x = (canvasSize - scaledWidth) / 2;
    } else if (scaledHeight < canvasSize) {
      y = (canvasSize - scaledHeight) / 2;
    }

    ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
  }

  function changeCanvasSize(element) {
    const elements = document.querySelectorAll('.canvas--switcher input');
    elements.forEach((e) => { e.classList.remove('isSelected'); });
    switch (element) {
      case sizeSmall:
        canvasSize = 128;
        element.classList.add('isSelected');
        break;
      case sizeMedium:
        canvasSize = 256;
        element.classList.add('isSelected');
        break;
      case sizeLarge:
        canvasSize = 512;
        element.classList.add('isSelected');
        break;
      default: canvasSize = 128;
        element.classList.add('isSelected');
    }
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    reflectImage(savedImage, imageWidth, imageHeight);
    localStorage.setItem('sizeCanvas', canvasSize);
  }

  const ACCESS_KEY = 'a24d7baec6101d6a79aa8a053926d35f9817c6c6e818ddf40f80982eb11b2ee2';

  async function searchImageByQuery(query) {
    const baseUrl = 'https://api.unsplash.com/photos/random';
    const queryString = `?query=town,${query}&client_id=${ACCESS_KEY}`;

    const url = baseUrl + queryString;

    let data;
    try {
      const response = await fetch(url);
      data = await response.json();
    } catch (e) {
      console.error(e);
    }
    imageWidth = data.width;
    imageHeight = data.height;

    const image = new Image();
    image.crossOrigin = 'Anonymous';
    image.src = data.urls.small;
    image.onload = () => {
      reflectImage(image, imageWidth, imageHeight);
      savedImage = image;
    };
  }

  function grayscale() {
    const imageData = ctx.getImageData(0, 0, 512, 512);
    const { data } = imageData;
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  document.body.addEventListener('keypress', (event) => {
    pressKey(event.code);
  });

  canvas.addEventListener('click', (e) => {
    floodFill(e);
    pickColor(e);
  });
  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    draw(e);
  });
  canvas.addEventListener('mousemove', (e) => {
    draw(e);
  });
  canvas.addEventListener('mouseup', () => {
    isDrawing = false;
  });
  canvas.addEventListener('mouseout', () => {
    isDrawing = false;
  });

  const imageURL = localStorage.getItem('canvas');
  const img = new Image();
  img.src = imageURL;
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
  };

  if (localStorage.getItem('tool') === 'isFillEnabled') {
    fill();
  } else if (localStorage.getItem('tool') === 'isPencilEnabled' || localStorage.getItem('tool') === null) {
    drawPencil();
  } else if (localStorage.getItem('tool') === 'isColorEnabled') {
    chooseColor();
  }

  red.addEventListener('click', () => setCurrentColor(red));
  blue.addEventListener('click', () => setCurrentColor(blue));
  prev.addEventListener('click', () => setCurrentColor(prev));
  current.addEventListener('click', () => chooseColorInput());
  colorInput.addEventListener('input', (event) => updateColor(event));

  sizeSwitcher.addEventListener('click', (event) => changeCanvasSize(event.target));

  if (localStorage.getItem('sizeCanvas') === null || localStorage.getItem('sizeCanvas') === '128') {
    changeCanvasSize(sizeSmall);
  } else if (localStorage.getItem('sizeCanvas') === '256') {
    changeCanvasSize(sizeMedium);
  } else if (localStorage.getItem('sizeCanvas') === '512') {
    changeCanvasSize(sizeLarge);
  }

  clear.addEventListener('click', () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);
  });
  load.addEventListener('click', () => {
    searchImageByQuery(search.value);
  });
  grayscaleButton.addEventListener('click', () => { grayscale(); });


  fillBucket.addEventListener('click', () => {
    fill();
  });
  colorPicker.addEventListener('click', () => {
    chooseColor();
  });
  pencil.addEventListener('click', () => {
    drawPencil();
  });
};

window.onbeforeunload = () => {
  const canvas = document.getElementById('canvas');
  localStorage.setItem('canvas', canvas.toDataURL());
};
