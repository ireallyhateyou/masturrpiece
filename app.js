const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let desiredAspectRatio = null;
let paintingLoaded = false;
const paintingImg = document.getElementById('monaLisaImg');

function clampZeroToOne(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
}

function resizeCanvas() {
    const comparisonSection = document.getElementById('comparisonSection');
    const container = comparisonSection || canvas.parentElement;
    
    const windowWidth = window.innerWidth || 1200;
    const windowHeight = window.innerHeight || 800;
    
    let availableWidth = 1000;
    if (comparisonSection && !comparisonSection.classList.contains('hidden')) {
        const sectionWidth = comparisonSection.clientWidth || windowWidth;
        availableWidth = Math.min(1000, sectionWidth - 80);
    } else {
        availableWidth = Math.min(1000, windowWidth - 80);
    }
    
    const availableHeight = Math.min(750, windowHeight - 300);
    
    const limitWidth = Math.max(500, availableWidth);
    const limitHeight = Math.max(400, availableHeight);
    
    let newWidth, newHeight;
    
    if (desiredAspectRatio && desiredAspectRatio > 0) {
        const containerAspect = limitWidth / limitHeight;
        if (containerAspect > desiredAspectRatio) {
            newHeight = limitHeight;
            newWidth = Math.floor(newHeight * desiredAspectRatio);
        } else {
            newWidth = limitWidth;
            newHeight = Math.floor(newWidth / desiredAspectRatio);
        }
        if (newWidth < 200) {
            newWidth = 200;
            newHeight = Math.floor(newWidth / desiredAspectRatio);
        }
        if (newHeight < 200) {
            newHeight = 200;
            newWidth = Math.floor(newHeight * desiredAspectRatio);
        }
        console.log('Resizing canvas with aspect ratio:', desiredAspectRatio, 'to:', newWidth, 'x', newHeight, 'calculated aspect:', (newWidth / newHeight).toFixed(3));
    } else {
        newWidth = limitWidth;
        newHeight = limitHeight;
        console.log('Resizing canvas with default size:', newWidth, 'x', newHeight);
    }

    if (newWidth <= 0 || newHeight <= 0) {
        console.error('Invalid canvas dimensions calculated:', newWidth, 'x', newHeight);
        newWidth = 1000;
        newHeight = 750;
    }

    if (newWidth === canvas.width && newHeight === canvas.height) {
        console.log('Canvas already correct size, skipping resize');
        return;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (canvas.width && canvas.height) {
        tempCtx.drawImage(canvas, 0, 0);
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
    canvas.style.setProperty('width', newWidth + 'px', 'important');
    canvas.style.setProperty('height', newHeight + 'px', 'important');
    canvas.style.setProperty('max-width', 'none', 'important');
    canvas.style.setProperty('max-height', 'none', 'important');
    canvas.style.setProperty('min-width', 'auto', 'important');
    canvas.style.setProperty('min-height', 'auto', 'important');
    canvas.style.setProperty('flex-shrink', '0', 'important');
    canvas.style.setProperty('flex-grow', '0', 'important');
    console.log('Canvas set to:', newWidth, 'x', newHeight, 'aspect ratio:', (newWidth / newHeight).toFixed(3));
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (tempCanvas.width && tempCanvas.height) {
        ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
    }
}

function updateVideoSize() {
    if (noseModeActive && !video.classList.contains('hidden')) {
        video.style.position = 'fixed';
        video.style.width = '200px';
        video.style.height = '150px';
        video.style.bottom = '10px';
        video.style.right = '10px';
        video.style.objectFit = 'cover';

        const handCanvas = document.getElementById('handWireframeCanvas');
        if (handCanvas && !handCanvas.classList.contains('hidden')) {
            handCanvas.width = 200;
            handCanvas.height = 150;
        }
    }
}

resizeCanvas();
window.addEventListener('resize', () => {
    resizeCanvas();
    if (noseModeActive && video.classList.contains('hidden') === false) {
        setTimeout(updateVideoSize, 100);
    }
});

function updateNoseCursor(canvasX, canvasY) {
    if (!noseModeActive) return;

    const canvasRect = canvas.getBoundingClientRect();
    const screenX = canvasRect.left + (canvasX / canvas.width) * canvasRect.width;
    const screenY = canvasRect.top + (canvasY / canvas.height) * canvasRect.height;
    const brushSizeScaled = brushSize * 5;

    noseCursor.style.left = screenX + 'px';
    noseCursor.style.top = screenY + 'px';
    noseCursor.style.width = brushSizeScaled + 'px';
    noseCursor.style.height = brushSizeScaled + 'px';
    noseCursor.classList.remove('hidden');
}

let isDrawing = false;
let currentTool = 'brush';
let currentColor = '#000000';
let brushSize = 5;
let lastX = 0;
let lastY = 0;
let inputEnabled = true;

const colorPicker = document.getElementById('colorPicker');
const brushSizeSlider = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const clearBtn = document.getElementById('clearBtn');
const eraserBtn = document.getElementById('eraserBtn');
const video = document.getElementById('video');
const noseCursor = document.getElementById('noseCursor');
const handWireframeCanvas = document.getElementById('handWireframeCanvas');

let handWireframeCtx = null;
if (handWireframeCanvas) {
    handWireframeCtx = handWireframeCanvas.getContext('2d');
}

colorPicker.addEventListener('change', (e) => {
    currentColor = e.target.value;
    if (currentTool === 'brush') {
        ctx.strokeStyle = currentColor;
        ctx.fillStyle = currentColor;
    }
});

brushSizeSlider.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value);
    brushSizeValue.textContent = brushSize;
    ctx.lineWidth = brushSize;
});

clearBtn.addEventListener('click', () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    updateCanvasVisibility();
});

eraserBtn.addEventListener('click', () => {
    if (currentTool === 'eraser') {
        switchToBrush();
    } else {
        currentTool = 'eraser';
        eraserBtn.classList.add('active');
        ctx.strokeStyle = '#ffffff';
        ctx.globalCompositeOperation = 'destination-out';
    }
});

function switchToBrush() {
    currentTool = 'brush';
    eraserBtn.classList.remove('active');
    ctx.strokeStyle = currentColor;
    ctx.fillStyle = currentColor;
    ctx.globalCompositeOperation = 'source-over';
}

function startDrawing(e) {
    if (!inputEnabled) {
        console.log('startDrawing blocked - inputEnabled:', inputEnabled);
        return;
    }
    const paintingNumber = currentPaintingIndex + 1;
    if (paintingNumber !== 1) {
        console.log('startDrawing blocked - not painting 1, painting:', paintingNumber);
        return;
    }
    startTimer();
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    lastX = (e.clientX - rect.left) * scaleX;
    lastY = (e.clientY - rect.top) * scaleY;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
}

function draw(e) {
    if (!isDrawing) return;
    if (!inputEnabled) return;
    const paintingNumber = currentPaintingIndex + 1;
    if (paintingNumber !== 1) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor;
        ctx.fillStyle = currentColor;
    }

    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(currentX, currentY);

    lastX = currentX;
    lastY = currentY;
    
    updateCanvasVisibility();
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
    }
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
});

ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.lineWidth = brushSize;
ctx.strokeStyle = currentColor;
ctx.fillStyle = currentColor;

const comparisonResult = document.getElementById('comparisonResult');
const gameBar = document.getElementById('gameBar');
const toolsBar = document.getElementById('toolsBar');
const startGameBtn = document.getElementById('startGameBtn');
const peekBtn = document.getElementById('peekBtn');
const finishBtn = document.getElementById('finishBtn');
const phaseLabel = document.getElementById('phaseLabel');
const countdownLabel = document.getElementById('countdownLabel');
const timerBar = document.getElementById('timerBar');
const mouseDrawingImage = document.getElementById('mouseDrawingImage');
const referenceTitle = document.getElementById('referenceTitle');
const referenceWrapper = document.getElementById('referenceWrapper');
const comparisonSection = document.getElementById('comparisonSection');
const resultsBar = document.getElementById('resultsBar');

let noseModeActive = false;

const paintings = [
    { title: 'Mona Lisa', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/500px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg' },
    { title: 'The Starry Night', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Vincent_van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/960px-Vincent_van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg' },
    { title: 'The Scream', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/The_Scream.jpg/500px-The_Scream.jpg' },
    { title: 'Girl with a Pearl Earring', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Meisje_met_de_parel.jpg/960px-Meisje_met_de_parel.jpg' }
];
let currentPaintingIndex = 0;

function loadCurrentPainting() {
    console.log('Loading painting:', paintings[currentPaintingIndex]?.title);
    paintingLoaded = false;
    const { title, src } = paintings[currentPaintingIndex];
    referenceTitle.textContent = title;
    paintingImg.style.width = '';
    paintingImg.style.height = '';
    paintingImg.src = src;
    
    desiredAspectRatio = null;
    
    paintingImg.onerror = () => {
        console.error('Failed to load painting:', src);
        paintingLoaded = false;
    };
}

paintingImg.onload = () => {
    console.log('Painting loaded successfully:', paintingImg.src);
    paintingLoaded = true;
    
    const imgAspect = paintingImg.naturalWidth / paintingImg.naturalHeight;
    desiredAspectRatio = imgAspect;
    
    console.log('Painting aspect ratio:', desiredAspectRatio, 'Dimensions:', paintingImg.naturalWidth, 'x', paintingImg.naturalHeight);
    
    resizeCanvas();
    
    const container = paintingImg.parentElement;
    const maxWidth = container ? Math.min(paintingImg.naturalWidth, container.clientWidth - 40) : paintingImg.naturalWidth;
    const maxHeight = Math.min(paintingImg.naturalHeight, window.innerHeight - 300);
    
    const maxDisplayWidth = 200;
    const maxDisplayHeight = 300;
    
    let displayWidth = maxDisplayWidth;
    let displayHeight = displayWidth / desiredAspectRatio;
    
    if (displayHeight > maxDisplayHeight) {
        displayHeight = maxDisplayHeight;
        displayWidth = displayHeight * desiredAspectRatio;
    }
    
    displayWidth = Math.floor(displayWidth);
    displayHeight = Math.floor(displayHeight);
    
    paintingImg.style.width = displayWidth + 'px';
    paintingImg.style.height = 'auto';
    console.log('Reference painting initial size:', displayWidth, 'x', displayHeight);
    
    resizeCanvas();

    setTimeout(() => {
        extractedColors = extractPrimaryColors(paintingImg);
        orderedPalette = createOrderedPalette(extractedColors);
        paletteIndex = 0;
        console.log('Color extraction complete, palette length:', orderedPalette.length);
    }, 0);

    if (noseModeActive) {
        setTimeout(updateVideoSize, 100);
    }
};

function getImageDataFromCanvas(sourceCanvas, width, height) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(sourceCanvas, 0, 0, width, height);
    return tempCtx.getImageData(0, 0, width, height);
}

function getImageDataFromImage(img, width, height) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const canvasAspect = width / height;

    let drawWidth = width;
    let drawHeight = height;
    let x = 0;
    let y = 0;
    if (imgAspect > canvasAspect) {
        drawHeight = height;
        drawWidth = height * imgAspect;
        x = (width - drawWidth) / 2;
    } else {
        drawWidth = width;
        drawHeight = width / imgAspect;
        y = (height - drawHeight) / 2;
    }

    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, width, height);
    tempCtx.drawImage(img, x, y, drawWidth, drawHeight);
    return tempCtx.getImageData(0, 0, width, height);
}

function getLuminance(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

function compareImages(drawingData, referenceData, width, height) {
    const scores = {
        colorSimilarity: 0,
        luminanceSimilarity: 0,
        edgeSimilarity: 0,
        structuralSimilarity: 0
    };

    let totalPixels = width * height;
    let colorDiff = 0;
    let luminanceDiff = 0;
    let edgeDiff = 0;
    let structureDiff = 0;

    const drawingEdges = detectEdges(drawingData, width, height);
    const referenceEdges = detectEdges(referenceData, width, height);
    let drawingBrightnessSum = 0;
    let referenceBrightnessSum = 0;
    let drawingBrightnessSq = 0;
    let referenceBrightnessSq = 0;
    let crossSum = 0;

    for (let i = 0; i < totalPixels; i++) {
        const idx = i * 4;
        const dr = drawingData.data[idx];
        const dg = drawingData.data[idx + 1];
        const db = drawingData.data[idx + 2];
        const rr = referenceData.data[idx];
        const rg = referenceData.data[idx + 1];
        const rb = referenceData.data[idx + 2];

        const colorDistance = Math.sqrt(
            Math.pow(dr - rr, 2) +
            Math.pow(dg - rg, 2) +
            Math.pow(db - rb, 2)
        );
        colorDiff += colorDistance / 441.67;
        const dLum = getLuminance(dr, dg, db);
        const rLum = getLuminance(rr, rg, rb);
        const lumDistance = Math.abs(dLum - rLum) / 255;
        luminanceDiff += lumDistance;
        const edgeDistance = Math.abs(drawingEdges[i] - referenceEdges[i]) / 255;
        edgeDiff += edgeDistance;
        drawingBrightnessSum += dLum;
        referenceBrightnessSum += rLum;
        drawingBrightnessSq += dLum * dLum;
        referenceBrightnessSq += rLum * rLum;
        crossSum += dLum * rLum;
    }

    scores.colorSimilarity = 1 - (colorDiff / totalPixels);
    scores.luminanceSimilarity = 1 - (luminanceDiff / totalPixels);
    scores.edgeSimilarity = 1 - (edgeDiff / totalPixels);
    const drawingMean = drawingBrightnessSum / totalPixels;
    const referenceMean = referenceBrightnessSum / totalPixels;
    const drawingVar = (drawingBrightnessSq / totalPixels) - (drawingMean * drawingMean);
    const referenceVar = (referenceBrightnessSq / totalPixels) - (referenceMean * referenceMean);
    const covariance = (crossSum / totalPixels) - (drawingMean * referenceMean);
    const c1 = 0.05 * 255;
    const c2 = 0.15 * 255;
    const numerator = (2 * drawingMean * referenceMean + c1) * (2 * covariance + c2);
    const denominator = (drawingMean * drawingMean + referenceMean * referenceMean + c1) * (drawingVar + referenceVar + c2);
    scores.structuralSimilarity = clampZeroToOne(numerator / denominator);
    
    return scores;
}

function detectEdges(imageData, width, height) {
    const edges = new Uint8Array(width * height);
    const data = imageData.data;
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            const centerLum = getLuminance(data[idx], data[idx + 1], data[idx + 2]);
            const rightIdx = ((y * width + (x + 1)) * 4);
            const rightLum = getLuminance(data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]);
            const bottomIdx = (((y + 1) * width + x) * 4);
            const bottomLum = getLuminance(data[bottomIdx], data[bottomIdx + 1], data[bottomIdx + 2]);
            const dx = Math.abs(centerLum - rightLum);
            const dy = Math.abs(centerLum - bottomLum);
            edges[y * width + x] = Math.min(255, Math.sqrt(dx * dx + dy * dy));
        }
    }
    return edges;
}

function getLetterGrade(percent) {
    if (percent >= 97) return 'A+';
    if (percent >= 93) return 'A';
    if (percent >= 90) return 'A-';
    if (percent >= 87) return 'B+';
    if (percent >= 83) return 'B';
    if (percent >= 80) return 'B-';
    if (percent >= 77) return 'C+';
    if (percent >= 73) return 'C';
    if (percent >= 70) return 'C-';
    if (percent >= 67) return 'D+';
    if (percent >= 63) return 'D';
    if (percent >= 60) return 'D-';
    return 'F';
}

function compareWithPainting() {
    if (!paintingLoaded) {
        comparisonResult.textContent = 'Loading painting...';
        return null;
    }
    comparisonResult.textContent = 'Analyzing...';
    const comparisonSize = 32;
    const drawingData = getImageDataFromCanvas(canvas, comparisonSize, comparisonSize);
    const referenceData = getImageDataFromImage(paintingImg, comparisonSize, comparisonSize);
    const scores = compareImages(drawingData, referenceData, comparisonSize, comparisonSize);
    const overallSimilarity = clampZeroToOne((0.35 * scores.colorSimilarity) + 
                    (0.45 * scores.luminanceSimilarity) + 
                    (0.10 * scores.edgeSimilarity) + 
                    (0.10 * scores.structuralSimilarity));
    const eased = 1 - Math.pow(1 - overallSimilarity, 0.5);
    const displaySimilarity = clampZeroToOne(eased + 0.05);
    const similarityPercent = Math.round(displaySimilarity * 100);
    const letterGrade = getLetterGrade(similarityPercent);

    const message = `Grade: ${letterGrade}`;
    comparisonResult.innerHTML = `${message}<br>` +
        `<small style="color: #666;">Color: ${Math.round(scores.colorSimilarity * 100)}% | ` +
        `Structure: ${Math.round(scores.structuralSimilarity * 100)}% | ` +
        `Edges: ${Math.round(scores.edgeSimilarity * 100)}%</small>`;
    return letterGrade;
}

const MEMORIZE_MS = 10000;
const DRAW_MS = 100000;
let gameActive = false;
let isPeeking = false;
let peeksLeft = 3;
let memorizeTimerId = null;
let drawTimerId = null;
let countdownIntervalId = null;
let timerStartTime = null;
let timerStarted = false;

function setInputEnabled(enabled) {
    inputEnabled = enabled;
    if (!noseModeActive && !handModeActive) {
        canvas.style.pointerEvents = enabled ? 'auto' : 'none';
    }
}

function resetCanvas() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = currentTool === 'brush' ? currentColor : '#ffffff';
    updateCanvasVisibility();
}

function updateTimerBar(progress) {
    timerBar.style.width = Math.max(0, Math.min(1, progress)) * 100 + '%';
}

function isCanvasEmpty() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        if (a > 0 && (r < 255 || g < 255 || b < 255)) {
            return false;
        }
    }
    
    return true;
}

function updateCanvasVisibility() {
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (canvasWrapper && comparisonSection && !comparisonSection.classList.contains('hidden')) {
        if (isCanvasEmpty()) {
            canvasWrapper.classList.add('hidden');
            gameBar.classList.add('hidden');
        } else {
            canvasWrapper.classList.remove('hidden');
            gameBar.classList.remove('hidden');
        }
    }
}

function showReference(show) {
    paintingImg.classList.toggle('hidden', !show);
    referenceWrapper.classList.toggle('hidden', !show);
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (canvasWrapper) {
        canvasWrapper.classList.toggle('hidden', show);
    }
    const paintingNumber = currentPaintingIndex + 1;
    const hasFacts = paintingNumber === 1 && show;
    if (!hasFacts) {
        comparisonSection.classList.toggle('single', !show);
    } else {
        comparisonSection.classList.remove('single');
    }
}

function setResultsBarVisible(visible) {
    resultsBar.classList.toggle('hidden', !visible);
}

function enterIdle() {
    console.log('Entering idle state');
    gameActive = false;
    isPeeking = false;
    setInputEnabled(false);
    showReference(false);
    gameBar.classList.remove('hidden');
    gameBar.classList.remove('active-game');
    toolsBar.classList.add('hidden');
    referenceTitle.textContent = paintings[currentPaintingIndex]?.title || 'Reference';
    setResultsBarVisible(false);
    comparisonSection.classList.add('hidden');
    const loreText = document.getElementById('loreText');
    const loreTextContent = document.getElementById('loreTextContent');
    const webcamImage = document.getElementById('webcamImage');
    const mouseImage = document.getElementById('mouseImage');
    loreText.classList.remove('hidden');
    const paintingNumber = currentPaintingIndex + 1;
    if (paintingNumber === 1) {
        if (webcamImage) webcamImage.classList.add('hidden');
        if (mouseImage) mouseImage.classList.remove('hidden');
        loreTextContent.textContent = 'You will be painting with your cursor... for now!';
    } else if (paintingNumber === 2) {
        if (webcamImage) webcamImage.classList.remove('hidden');
        if (mouseImage) mouseImage.classList.add('hidden');
        loreTextContent.textContent = 'When prompted, please allow access to your webcam, since part of the twists in this game involves computer vision. Thank you!';
    } else if (paintingNumber === 3) {
        if (webcamImage) webcamImage.classList.remove('hidden');
        if (mouseImage) mouseImage.classList.add('hidden');
        loreTextContent.textContent = 'When prompted, please allow access to your webcam, since part of the twists in this game involves computer vision. Thank you!';
    } else {
        if (webcamImage) webcamImage.classList.add('hidden');
        if (mouseImage) mouseImage.classList.add('hidden');
        loreTextContent.textContent = 'Draw with your cursor.';
    }
    peekBtn.classList.add('hidden');
    finishBtn.classList.add('hidden');
    document.getElementById('timerGroup').classList.add('hidden');
    if (mouseDrawingImage) {
        mouseDrawingImage.classList.add('hidden');
    }
    startGameBtn.disabled = false;
    startGameBtn.textContent = 'Start Challenge';
    startGameBtn.style.display = '';
    startGameBtn.classList.remove('hidden');
    console.log('Idle state - button visible, comparison hidden');
}

function enterGameReady() {
    console.log('Entering game ready state');
    isPeeking = false;
    peeksLeft = 3;
    phaseLabel.textContent = 'Ready';
    countdownLabel.textContent = '';
    document.getElementById('peeksLeft').textContent = String(peeksLeft);
    updateTimerBar(0);
    showReference(false);
    gameBar.classList.add('hidden');
    gameBar.classList.remove('active-game');
    referenceTitle.textContent = 'Reference';
    setResultsBarVisible(false);
    peekBtn.disabled = true;
    finishBtn.disabled = true;
    peekBtn.classList.add('hidden');
    finishBtn.classList.add('hidden');
    document.getElementById('timerGroup').classList.add('hidden');
    toolsBar.classList.add('hidden');
    timerStarted = false;
    timerStartTime = null;
    comparisonSection.classList.add('hidden');
    document.getElementById('loreText').classList.add('hidden');
    startGameBtn.classList.add('hidden');
    console.log('Game ready - buttons hidden until needed');
}

function startTeasingPhase() {
    console.log('Starting teasing phase');
    const teasingText = document.getElementById('teasingText');
    const teasingContent = document.getElementById('teasingContent');
    const loreText = document.getElementById('loreText');
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    const gameBar = document.getElementById('gameBar');
    const comparisonSection = document.getElementById('comparisonSection');
    
    if (loreText) loreText.classList.add('hidden');
    if (teasingText) teasingText.classList.remove('hidden');
    if (canvasWrapper) canvasWrapper.classList.add('hidden');
    if (gameBar) gameBar.classList.add('hidden');
    if (comparisonSection) comparisonSection.classList.add('hidden');
    
    const paintingNumber = currentPaintingIndex + 1;
    let teasingLines = [];
    
    if (paintingNumber === 1) {
        // Mona Lisa
        teasingLines = [
            'I have been stolen before...',
            'I am the best in our collection...',
            'I am...'
        ];
    } else if (paintingNumber === 2) {
        // The Starry Night
        teasingLines = [
            'I was painted in a single night...',
            'I swirl with emotions and dreams...',
            'I am...'
        ];
    } else if (paintingNumber === 3) {
        // The Scream
        teasingLines = [
            'I capture a moment of pure emotion...',
            'I have been stolen multiple times...',
            'I am...'
        ];
    } else if (paintingNumber === 4) {
        // Girl with a Pearl Earring
        teasingLines = [
            'I am known as the Dutch Mona Lisa...',
            'My identity remains a mystery...',
            'I am...'
        ];
    }
    
    let currentLine = 0;
    
    function showNextLine() {
        if (currentLine < teasingLines.length && teasingContent) {
            teasingContent.textContent = teasingLines[currentLine];
            currentLine++;
            if (currentLine < teasingLines.length) {
                setTimeout(showNextLine, 2000);
            } else {
                setTimeout(() => {
                    if (teasingText) teasingText.classList.add('hidden');
                    startMemorizePhase();
                }, 2000);
            }
        }
    }
    
    showNextLine();
}

function startMemorizePhase() {
    console.log('Starting memorize phase');
    resetCanvas();
    setInputEnabled(false);
    phaseLabel.textContent = 'Memorize';
    
    if (paintingLoaded && desiredAspectRatio && desiredAspectRatio > 0) {
        const maxDisplayWidth = 150;
        const maxDisplayHeight = 225;
        
        let displayWidth = maxDisplayWidth;
        let displayHeight = displayWidth / desiredAspectRatio;
        
        if (displayHeight > maxDisplayHeight) {
            displayHeight = maxDisplayHeight;
            displayWidth = displayHeight * desiredAspectRatio;
        }
        
        displayWidth = Math.max(100, Math.floor(displayWidth));
        displayHeight = Math.max(100, Math.floor(displayHeight));
        
        paintingImg.style.width = displayWidth + 'px';
        paintingImg.style.height = 'auto';
        console.log('Reference painting resized for memorize phase:', displayWidth, 'x', displayHeight);
    }
    
    showReference(true);
    
    showPaintingFacts();
    
    gameBar.classList.remove('hidden');
    gameBar.classList.add('active-game');
    document.getElementById('timerGroup').classList.remove('hidden');
    peekBtn.classList.add('hidden');
    finishBtn.classList.add('hidden');
    comparisonSection.classList.remove('hidden');
    
    countdownLabel.textContent = '5s';
    console.log('Reference should be visible, paintingImg hidden:', paintingImg.classList.contains('hidden'));
    console.log('Reference wrapper hidden:', referenceWrapper.classList.contains('hidden'));

    const start = Date.now();
    updateTimerBar(0);
    
    if (countdownIntervalId) {
        clearInterval(countdownIntervalId);
        countdownIntervalId = null;
    }
    
    countdownIntervalId = setInterval(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, MEMORIZE_MS - elapsed);
        countdownLabel.textContent = Math.ceil(remaining / 1000) + 's';
        updateTimerBar(elapsed / MEMORIZE_MS);
        if (remaining <= 0) {
            clearInterval(countdownIntervalId);
            countdownIntervalId = null;
        }
    }, 100);

    if (memorizeTimerId) {
        clearTimeout(memorizeTimerId);
        memorizeTimerId = null;
    }
    
    memorizeTimerId = setTimeout(() => {
        console.log('Memorize phase complete, starting draw phase');
        if (countdownIntervalId) {
            clearInterval(countdownIntervalId);
            countdownIntervalId = null;
        }
        hidePaintingFacts();
        showReference(false);
        startDrawPhase();
    }, MEMORIZE_MS);
}

function showPaintingFacts() {
    const factsSection = document.getElementById('paintingFacts');
    const factsTitle = document.getElementById('factsTitle');
    const factsContent = document.getElementById('factsContent');
    const comparisonSection = document.getElementById('comparisonSection');
    const paintingNumber = currentPaintingIndex + 1;
    
    if (!factsSection || !factsTitle || !factsContent || !comparisonSection) return;
    
    let title = '';
    let factsHTML = '';
    
    if (paintingNumber === 1) {
        // Mona Lisa
        title = 'Mona Lisa';
        factsHTML = `
            <p><strong>Artist:</strong> Leonardo da Vinci</p>
            <p><strong>Year:</strong> 1503-1519</p>
            <p><strong>Location:</strong> Louvre Museum, Paris</p>
            <p><strong>Famous for:</strong> Her enigmatic smile and mysterious identity</p>
            <p><strong>Fun fact:</strong> Stolen in 1911 by Vincenzo Peruggia, recovered in 1913</p>
            <p><strong>Value:</strong> Estimated at over $850 million (if it were ever sold)</p>
        `;
    } else if (paintingNumber === 2) {
        // The Starry Night
        title = 'The Starry Night';
        factsHTML = `
            <p><strong>Artist:</strong> Vincent van Gogh</p>
            <p><strong>Year:</strong> 1889</p>
            <p><strong>Location:</strong> Museum of Modern Art, New York</p>
            <p><strong>Famous for:</strong> Its swirling sky and emotional intensity</p>
            <p><strong>Fun fact:</strong> Painted from memory while van Gogh was in an asylum in Saint-Rémy</p>
            <p><strong>Value:</strong> Estimated at over $100 million (if it were ever sold)</p>
        `;
    } else if (paintingNumber === 3) {
        // The Scream
        title = 'The Scream';
        factsHTML = `
            <p><strong>Artist:</strong> Edvard Munch</p>
            <p><strong>Year:</strong> 1893</p>
            <p><strong>Location:</strong> National Gallery, Oslo</p>
            <p><strong>Famous for:</strong> Its expression of anxiety and existential dread</p>
            <p><strong>Fun fact:</strong> Stolen twice (1994 and 2004) and recovered both times</p>
            <p><strong>Value:</strong> Sold for $119.9 million in 2012 (one of four versions)</p>
        `;
    } else if (paintingNumber === 4) {
        // Girl with a Pearl Earring
        title = 'Girl with a Pearl Earring';
        factsHTML = `
            <p><strong>Artist:</strong> Johannes Vermeer</p>
            <p><strong>Year:</strong> 1665</p>
            <p><strong>Location:</strong> Mauritshuis, The Hague</p>
            <p><strong>Famous for:</strong> Being called "the Dutch Mona Lisa"</p>
            <p><strong>Fun fact:</strong> The subject's identity is unknown, and the "pearl" is likely a glass bead</p>
            <p><strong>Value:</strong> Priceless - considered a national treasure of the Netherlands</p>
        `;
    }
    
    if (title && factsHTML) {
        factsTitle.textContent = title;
        factsContent.innerHTML = factsHTML;
        factsSection.classList.remove('hidden');
        comparisonSection.classList.add('with-facts');
        referenceWrapper.classList.remove('hidden');
        paintingImg.classList.remove('hidden');
    }
}

function hidePaintingFacts() {
    const factsSection = document.getElementById('paintingFacts');
    const comparisonSection = document.getElementById('comparisonSection');
    
    if (factsSection) {
        factsSection.classList.add('hidden');
    }
    if (comparisonSection) {
        comparisonSection.classList.remove('with-facts');
    }
}

async function startDrawPhase() {
    console.log('Starting draw phase, painting:', currentPaintingIndex + 1);
    
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (canvasWrapper) {
        canvasWrapper.classList.remove('hidden');
    }
    
    const paintingNumber = currentPaintingIndex + 1;
    
    if (paintingNumber === 1) {
        phaseLabel.textContent = 'Draw with cursor!';
        stopNoseMode();
        stopHandMode();
        setInputEnabled(true);
        canvas.style.pointerEvents = 'auto';
        canvas.style.cursor = 'crosshair';
        console.log('Painting 1 - cursor mode, canvas pointer events:', canvas.style.pointerEvents, 'inputEnabled:', inputEnabled);
        if (mouseDrawingImage) {
            mouseDrawingImage.classList.remove('hidden');
        }
    } else if (paintingNumber === 2) {
        phaseLabel.textContent = 'Draw with your hand!';
        stopNoseMode();
        if (mouseDrawingImage) {
            mouseDrawingImage.classList.add('hidden');
        }
        canvas.style.pointerEvents = 'none';
        setInputEnabled(true);
        await startHandMode();
    } else if (paintingNumber === 3) {
        phaseLabel.textContent = 'Draw with your nose!';
        stopHandMode();
        if (mouseDrawingImage) {
            mouseDrawingImage.classList.add('hidden');
        }
        canvas.style.pointerEvents = 'none';
        setInputEnabled(true);
        await startNoseMode();
    } else {
        phaseLabel.textContent = 'Draw!';
        stopNoseMode();
        stopHandMode();
        setInputEnabled(true);
        canvas.style.pointerEvents = 'auto';
        canvas.style.cursor = 'crosshair';
    }
    
    peekBtn.classList.remove('hidden');
    finishBtn.classList.remove('hidden');
    peekBtn.disabled = false;
    finishBtn.disabled = false;
    toolsBar.classList.remove('hidden');
    showReference(false);
    timerStarted = false;
    timerStartTime = null;
    countdownLabel.textContent = Math.ceil(DRAW_MS / 1000) + 's';
    updateTimerBar(0);

    if (drawTimerId) {
        clearTimeout(drawTimerId);
        drawTimerId = null;
    }
    if (countdownIntervalId) {
        clearInterval(countdownIntervalId);
        countdownIntervalId = null;
    }
}

function startTimer() {
    if (timerStarted) return;

    timerStarted = true;
    timerStartTime = Date.now();
    countdownLabel.textContent = Math.ceil(DRAW_MS / 1000) + 's';
    updateTimerBar(0);

    countdownIntervalId = setInterval(() => {
        const elapsed = Date.now() - timerStartTime;
        const remaining = Math.max(0, DRAW_MS - elapsed);
        countdownLabel.textContent = Math.ceil(remaining / 1000) + 's';
        updateTimerBar(elapsed / DRAW_MS);
        if (remaining <= 0) {
            clearInterval(countdownIntervalId);
        }
    }, 100);

    drawTimerId = setTimeout(() => {
        finishGame();
    }, DRAW_MS);
}

function doPeek() {
    if (peeksLeft <= 0 || isPeeking) return;
    isPeeking = true;
    peeksLeft -= 1;
    document.getElementById('peeksLeft').textContent = String(peeksLeft);
    showReference(true);
    peekBtn.classList.add('flash');
    setTimeout(() => peekBtn.classList.remove('flash'), 350);
    setTimeout(() => {
        showReference(false);
        isPeeking = false;
        if (peeksLeft <= 0) peekBtn.disabled = true;
    }, 2000);
}

function finishGame() {
    if (!gameActive) return;
    clearTimeout(memorizeTimerId);
    clearTimeout(drawTimerId);
    clearInterval(countdownIntervalId);
    timerStarted = false;
    timerStartTime = null;
    peekBtn.disabled = true;
    finishBtn.disabled = true;
    peekBtn.classList.add('hidden');
    finishBtn.classList.add('hidden');
    setInputEnabled(false);
    stopNoseMode();
    stopHandMode();
    showReference(true);
    phaseLabel.textContent = 'Results';
    countdownLabel.textContent = '';
    updateTimerBar(1);
    toolsBar.classList.add('hidden');

    const grade = compareWithPainting();
    if (grade !== null) {
        currentPaintingIndex = (currentPaintingIndex + 1) % paintings.length;
        phaseLabel.textContent = 'Painting cleared! Next painting...';
        setTimeout(() => {
            setResultsBarVisible(false);
            phaseLabel.textContent = 'Loading next...';
            loadCurrentPainting();
            const waitForLoad = setInterval(() => {
                if (paintingLoaded) {
                    clearInterval(waitForLoad);
                    startGameBtn.disabled = true;
                    startGameBtn.classList.add('hidden');
                    enterGameReady();
                    startTeasingPhase();
                }
            }, 100);
        }, 1000);
    } else {
        startGameBtn.textContent = 'Start Challenge';
        startGameBtn.disabled = false;
        setResultsBarVisible(true);
        enterIdle();
    }
}

startGameBtn.addEventListener('click', async () => {
    console.log('Start button clicked, paintingLoaded:', paintingLoaded);
    if (!paintingLoaded) {
        phaseLabel.textContent = 'Loading reference...';
        console.log('Painting not loaded yet');
        return;
    }
    
    if (!checkHardwareAcceleration()) {
        showHardwareAccelerationModal();
        return;
    }
    
    console.log('Starting game...');
    startGameBtn.classList.add('hidden');
    gameActive = true;
    enterGameReady();
    
    startTeasingPhase();
});

peekBtn.addEventListener('click', doPeek);
finishBtn.addEventListener('click', finishGame);

const SMOOTHING_FACTOR = 0.9;
const MIN_DISTANCE_THRESHOLD = 0.05;
let faceMesh = null;
let hands = null;
let camera = null;
let handModeActive = false;
let lastNoseX = 0;
let lastNoseY = 0;
let lastHandX = 0;
let lastHandY = 0;
let handDrawing = false;
let noseDrawing = false;
let smoothedNoseX = 0;
let smoothedNoseY = 0;
let smoothedHandX = 0;
let smoothedHandY = 0;
let firstNoseDetection = true;
let firstHandDetection = true;
let extractedColors = [];
let orderedPalette = [];
let paletteIndex = 0;

function extractPrimaryColors(img) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.min(img.naturalWidth, 200);
    tempCanvas.height = Math.min(img.naturalHeight, 200);

    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);

    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const pixels = imageData.data;
    const colorMap = new Map();
    const sampleStep = 8;

    for (let i = 0; i < pixels.length; i += sampleStep * 4) {
        const r = Math.floor(pixels[i] / 32) * 32;
        const g = Math.floor(pixels[i + 1] / 32) * 32;
        const b = Math.floor(pixels[i + 2] / 32) * 32;
        const a = pixels[i + 3];

        if (a < 128) continue;

        const colorKey = `${r},${g},${b}`;
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }

    const colors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([rgb]) => {
            const [r, g, b] = rgb.split(',').map(Number);
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        });

    return colors.length > 0 ? colors : ['#000000', '#FFFFFF'];
}

function getBrightness(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
}

function createOrderedPalette(colors) {
    if (colors.length === 0) return [];

    const sortedByBrightness = [...colors].sort((a, b) => getBrightness(a) - getBrightness(b));
    const ordered = [];
    const length = sortedByBrightness.length;

    for (let i = 0; i < Math.ceil(length / 2); i++) {
        ordered.push(sortedByBrightness[i]);
        if (i < length - 1 - i) {
            ordered.push(sortedByBrightness[length - 1 - i]);
        }
    }

    return ordered;
}


function drawFaceWireframe(landmarks) {
    if (!handWireframeCtx || handWireframeCanvas.classList.contains('hidden')) return;
    
    handWireframeCtx.clearRect(0, 0, handWireframeCanvas.width, handWireframeCanvas.height);
    handWireframeCtx.strokeStyle = '#00ff00';
    handWireframeCtx.lineWidth = 1;
    
    const faceConnections = [
        [10, 338], [151, 337], [9, 10], [10, 151],
        [151, 9], [9, 107], [107, 55], [55, 65],
        [65, 52], [52, 53], [53, 46], [46, 1],
        [1, 2], [2, 3], [3, 4], [4, 5],
        [5, 6], [6, 7], [7, 8], [8, 9],
        [10, 151], [151, 337], [337, 299], [299, 333],
        [333, 298], [298, 301], [301, 368], [368, 264],
        [264, 447], [447, 366], [366, 401], [401, 435],
        [435, 410], [410, 454], [454, 323], [323, 361],
        [361, 288], [288, 397], [397, 365], [365, 379],
        [379, 378], [378, 400], [400, 377], [377, 152],
        [152, 148], [148, 176], [176, 149], [149, 150],
        [150, 136], [136, 172], [172, 58], [58, 132],
        [132, 93], [93, 234], [234, 127], [127, 162],
        [162, 21], [21, 54], [54, 103], [103, 67],
        [67, 109], [109, 10]
    ];
    
    faceConnections.forEach(([start, end]) => {
        if (landmarks[start] && landmarks[end]) {
            handWireframeCtx.beginPath();
            handWireframeCtx.moveTo(
                landmarks[start].x * handWireframeCanvas.width,
                landmarks[start].y * handWireframeCanvas.height
            );
            handWireframeCtx.lineTo(
                landmarks[end].x * handWireframeCanvas.width,
                landmarks[end].y * handWireframeCanvas.height
            );
            handWireframeCtx.stroke();
        }
    });
    
    if (landmarks[1]) {
        handWireframeCtx.fillStyle = '#ff0000';
        handWireframeCtx.beginPath();
        handWireframeCtx.arc(
            landmarks[1].x * handWireframeCanvas.width,
            landmarks[1].y * handWireframeCanvas.height,
            5,
            0,
            2 * Math.PI
        );
        handWireframeCtx.fill();
    }
}

function drawNoseDot(noseTip) {
    if (!handWireframeCtx || handWireframeCanvas.classList.contains('hidden') || !noseTip) return;
    
    handWireframeCtx.clearRect(0, 0, handWireframeCanvas.width, handWireframeCanvas.height);
    handWireframeCtx.fillStyle = '#ff0000';
    handWireframeCtx.beginPath();
    handWireframeCtx.arc(
        noseTip.x * handWireframeCanvas.width,
        noseTip.y * handWireframeCanvas.height,
        8,
        0,
        2 * Math.PI
    );
    handWireframeCtx.fill();
}

function onFaceMeshResults(results) {
    if (!noseModeActive || !inputEnabled) return;

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        
        drawNoseDot(landmarks[1]);
        const noseTip = landmarks[1];
        
        if (noseTip) {
            let noseX = noseTip.x;
            let noseY = noseTip.y;
            
            noseX = Math.max(0, Math.min(1, noseX));
            noseY = Math.max(0, Math.min(1, noseY));
            
            if (firstNoseDetection) {
                smoothedNoseX = noseX;
                smoothedNoseY = noseY;
                firstNoseDetection = false;
            } else {
                smoothedNoseX = smoothedNoseX + SMOOTHING_FACTOR * (noseX - smoothedNoseX);
                smoothedNoseY = smoothedNoseY + SMOOTHING_FACTOR * (noseY - smoothedNoseY);
            }
            
            const videoWidth = video.videoWidth || video.clientWidth || 640;
            const videoHeight = video.videoHeight || video.clientHeight || 480;
            const videoAspect = videoWidth / videoHeight;
            const canvasAspect = canvas.width / canvas.height;
            
            let mappedX = smoothedNoseX;
            let mappedY = smoothedNoseY;
            
            if (videoAspect > canvasAspect) {
                const scale = canvasAspect / videoAspect;
                const offset = (1 - scale) / 2;
                mappedX = (smoothedNoseX - offset) / scale;
                mappedY = smoothedNoseY;
            } else {
                const scale = videoAspect / canvasAspect;
                const offset = (1 - scale) / 2;
                mappedX = smoothedNoseX;
                mappedY = (smoothedNoseY - offset) / scale;
            }

            mappedX = Math.max(0, Math.min(1, mappedX));
            mappedY = Math.max(0, Math.min(1, mappedY));

            const canvasX = mappedX * canvas.width;
            const canvasY = mappedY * canvas.height;
            const constrainedX = Math.max(0, Math.min(canvas.width, canvasX));
            const constrainedY = Math.max(0, Math.min(canvas.height, canvasY));

            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (currentTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = currentColor;
                ctx.fillStyle = currentColor;
            }

            const distance = Math.sqrt(
                Math.pow(constrainedX - lastNoseX, 2) + 
                Math.pow(constrainedY - lastNoseY, 2)
            );

            if (!noseDrawing) {
                if (lastNoseX === 0 && lastNoseY === 0) {
                    lastNoseX = constrainedX;
                    lastNoseY = constrainedY;
                } else if (distance > MIN_DISTANCE_THRESHOLD * Math.min(canvas.width, canvas.height)) {
                    noseDrawing = true;
                    startTimer();
                    ctx.beginPath();
                    ctx.moveTo(constrainedX, constrainedY);
                    lastNoseX = constrainedX;
                    lastNoseY = constrainedY;
                }
            } else {
                if (distance > 1) {
                    ctx.lineTo(constrainedX, constrainedY);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(constrainedX, constrainedY);

                    lastNoseX = constrainedX;
                    lastNoseY = constrainedY;
                    updateCanvasVisibility();
                }
            }

            if (currentTool === 'eraser') {
                ctx.globalCompositeOperation = 'source-over';
            }

            updateNoseCursor(constrainedX, constrainedY);
        }
    } else {
        noseDrawing = false;
        noseCursor.classList.add('hidden');
        if (handWireframeCtx) {
            handWireframeCtx.clearRect(0, 0, handWireframeCanvas.width, handWireframeCanvas.height);
        }
    }
}


function initializeFaceMesh() {
    if (typeof FaceMesh === 'undefined') {
        throw new Error('MediaPipe Face Mesh library not loaded. Please check the script tags.');
    }

    faceMesh = new FaceMesh({
        locateFile: (file) => {
            if (file.includes('face_detection_short_range')) {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
            }
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
    });

    faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        selfieMode: true
    });

    faceMesh.onResults(onFaceMeshResults);
}

async function startNoseMode() {
    console.log('startNoseMode called, gameActive:', gameActive);
    if (noseModeActive) {
        console.log('Nose mode already active, returning');
        return;
    }

    if (!gameActive) {
        console.log('Game not active, not starting nose mode');
        return;
    }

    noseModeActive = true;

    try {
        if (typeof Camera === 'undefined') {
            alert('MediaPipe libraries are loading. Please wait a moment and try again.');
            noseModeActive = false;
            return;
        }

        if (!faceMesh) {
            initializeFaceMesh();
        }

        const canvasAspect = canvas.width / canvas.height;
        let camWidth = 640;
        let camHeight = 480;
        if (canvasAspect > (640 / 480)) {
            camHeight = Math.round(640 / canvasAspect);
        } else {
            camWidth = Math.round(480 * canvasAspect);
        }

        await showWebcamModal();
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'user',
                width: { ideal: camWidth },
                height: { ideal: camHeight }
            } 
        });

        video.srcObject = stream;
        await video.play();
        video.classList.remove('hidden');
        
        if (handWireframeCanvas) {
            handWireframeCanvas.classList.remove('hidden');
            handWireframeCanvas.width = 200;
            handWireframeCanvas.height = 150;
        }

        setTimeout(() => {
            updateVideoSize();
        }, 100);

        let lastFaceSend = 0;
        const FACE_SEND_THROTTLE = 33;
        
        camera = new Camera(video, {
            onFrame: async () => {
                if (noseModeActive && faceMesh) {
                    const now = Date.now();
                    if (now - lastFaceSend >= FACE_SEND_THROTTLE) {
                        lastFaceSend = now;
                        try {
                            await faceMesh.send({ image: video });
                        } catch (error) {
                            console.error('Error sending to face mesh:', error);
                        }
                    }
                }
            },
            width: camWidth,
            height: camHeight
        });

        camera.start();
        canvas.style.pointerEvents = 'none';

        noseDrawing = false;
        smoothedNoseX = 0;
        smoothedNoseY = 0;
        lastNoseX = 0;
        lastNoseY = 0;
        firstNoseDetection = true;

        window.DEBUG_NOSE = true;
        console.log('Nose mode started. Debug enabled. Type DEBUG_NOSE=false to disable.');
        console.log('Camera dimensions:', { camWidth, camHeight });
        console.log('Canvas dimensions:', { width: canvas.width, height: canvas.height });
    } catch (err) {
        noseModeActive = false;
        console.error('Error accessing camera:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            alert('Camera access denied. Please allow camera permissions in your browser settings and try again.');
        } else {
            alert('Could not access camera: ' + err.message);
        }
    }
}

function stopNoseMode() {
    noseModeActive = false;
    noseDrawing = false;

    if (camera) {
        camera.stop();
        camera = null;
    }

    if (video.srcObject) {
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
    }

    video.classList.add('hidden');
    if (handWireframeCanvas) {
        handWireframeCanvas.classList.add('hidden');
        if (handWireframeCtx) {
            handWireframeCtx.clearRect(0, 0, handWireframeCanvas.width, handWireframeCanvas.height);
        }
    }
    noseCursor.classList.add('hidden');
    canvas.style.pointerEvents = inputEnabled ? 'auto' : 'none';
}

function initializeHands() {
    if (typeof Hands === 'undefined') {
        throw new Error('MediaPipe Hands library not loaded. Please check the script tags.');
    }

    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onHandResults);
}

function onHandResults(results) {
    if (!handModeActive || !inputEnabled) return;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const indexFinger = landmarks[8];
        
        if (indexFinger) {
            let handX = indexFinger.x;
            let handY = indexFinger.y;
            
            handX = Math.max(0, Math.min(1, handX));
            handY = Math.max(0, Math.min(1, handY));
            
            if (firstHandDetection) {
                smoothedHandX = handX;
                smoothedHandY = handY;
                firstHandDetection = false;
            } else {
                smoothedHandX = smoothedHandX + SMOOTHING_FACTOR * (handX - smoothedHandX);
                smoothedHandY = smoothedHandY + SMOOTHING_FACTOR * (handY - smoothedHandY);
            }
            
            const canvasX = smoothedHandX * canvas.width;
            const canvasY = smoothedHandY * canvas.height;
            const constrainedX = Math.max(0, Math.min(canvas.width, canvasX));
            const constrainedY = Math.max(0, Math.min(canvas.height, canvasY));
            
            updateNoseCursor(constrainedX, constrainedY);
            
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (currentTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = currentColor;
                ctx.fillStyle = currentColor;
            }
            
            const distance = Math.sqrt(
                Math.pow(constrainedX - lastHandX, 2) + 
                Math.pow(constrainedY - lastHandY, 2)
            );
            
            if (!handDrawing) {
                if (lastHandX === 0 && lastHandY === 0) {
                    lastHandX = constrainedX;
                    lastHandY = constrainedY;
                } else if (distance > MIN_DISTANCE_THRESHOLD * Math.min(canvas.width, canvas.height)) {
                    handDrawing = true;
                    startTimer();
                    ctx.beginPath();
                    ctx.moveTo(constrainedX, constrainedY);
                    lastHandX = constrainedX;
                    lastHandY = constrainedY;
                }
            } else {
                if (distance > 1) {
                    ctx.lineTo(constrainedX, constrainedY);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(constrainedX, constrainedY);
                    
                    lastHandX = constrainedX;
                    lastHandY = constrainedY;
                    updateCanvasVisibility();
                }
            }
            
            if (currentTool === 'eraser') {
                ctx.globalCompositeOperation = 'source-over';
            }
        }
    } else {
        handDrawing = false;
        noseCursor.classList.add('hidden');
    }
}

async function startHandMode() {
    if (handModeActive) return;
    
    if (!gameActive) return;
    
    handModeActive = true;
    
    try {
        if (typeof Camera === 'undefined') {
            alert('MediaPipe libraries are loading. Please wait a moment and try again.');
            handModeActive = false;
            return;
        }
        
        if (!hands) {
            initializeHands();
        }
        
        if (!camera) {
            const canvasAspect = canvas.width / canvas.height;
            let camWidth = 640;
            let camHeight = 480;
            if (canvasAspect > (640 / 480)) {
                camHeight = Math.round(640 / canvasAspect);
            } else {
                camWidth = Math.round(480 * canvasAspect);
            }
            
            await showWebcamModal();
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: camWidth },
                    height: { ideal: camHeight }
                } 
            });
            
            video.srcObject = stream;
            await video.play();
            video.classList.remove('hidden');
            
            if (handWireframeCanvas) {
                handWireframeCanvas.classList.remove('hidden');
                handWireframeCanvas.width = 200;
                handWireframeCanvas.height = 150;
            }
            
            setTimeout(() => {
                updateVideoSize();
            }, 100);
            
            let lastHandSend = 0;
            const HAND_SEND_THROTTLE = 33;
            
            camera = new Camera(video, {
                onFrame: async () => {
                    if (handModeActive && hands) {
                        const now = Date.now();
                        if (now - lastHandSend >= HAND_SEND_THROTTLE) {
                            lastHandSend = now;
                            try {
                                await hands.send({ image: video });
                            } catch (error) {
                                console.error('Error sending to hands:', error);
                            }
                        }
                    }
                },
                width: camWidth,
                height: camHeight
            });
            
            camera.start();
        }
        
        handDrawing = false;
        smoothedHandX = 0;
        smoothedHandY = 0;
        lastHandX = 0;
        lastHandY = 0;
        firstHandDetection = true;
    } catch (err) {
        handModeActive = false;
        console.error('Error accessing camera:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            alert('Camera access denied. Please allow camera permissions in your browser settings and try again.');
        } else {
            alert('Could not access camera: ' + err.message);
        }
    }
}

function stopHandMode() {
    handModeActive = false;
    handDrawing = false;
    
    if (camera && !noseModeActive) {
        camera.stop();
        camera = null;
        
        if (video.srcObject) {
            const stream = video.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        }
        
        video.classList.add('hidden');
        if (handWireframeCanvas) {
            handWireframeCanvas.classList.add('hidden');
            if (handWireframeCtx) {
                handWireframeCtx.clearRect(0, 0, handWireframeCanvas.width, handWireframeCanvas.height);
            }
        }
    }
    
    noseCursor.classList.add('hidden');
    canvas.style.pointerEvents = inputEnabled ? 'auto' : 'none';
}

const originalSetInputEnabled = setInputEnabled;
let autoStartingNoseMode = false;

setInputEnabled = function(enabled) {
    console.log('setInputEnabled called:', enabled, 'gameActive:', gameActive, 'noseModeActive:', noseModeActive, 'handModeActive:', handModeActive);
    originalSetInputEnabled(enabled);
    if (!enabled && noseModeActive && !gameActive) {
        console.log('Stopping nose mode (game not active)');
        stopNoseMode();
    }
    if (!enabled && handModeActive && !gameActive) {
        console.log('Stopping hand mode (game not active)');
        stopHandMode();
    }
};

const storyModal = document.getElementById('storyModal');
const storyNextBtn = document.getElementById('storyNextBtn');
const storyTitle = document.getElementById('storyTitle');
const storyParagraph = document.getElementById('storyParagraph');

const dialogueScript = [
    { title: 'The Grand Museum Heist', text: 'Our museum was robbed!', image: 'images/museum1.png' },
    { title: '', text: 'While we\'re figuring out how to recover our jewels...', image: 'images/museum2.png' },
    { title: '', text: '...you will be forced to make our masterpieces (with a few twists)!', image: 'images/museum3.png' },
    { title: '', html: '(by the way, did you know the <a href="https://news.ycombinator.com/item?id=45803302" target="_blank" class="story-link">louvre\'s system password was "louvre"</a>?)' },
    { title: '', text: 'Begin your quest, brave artist!', image: 'images/museum6.png' }
];

let currentDialogueIndex = 0;
let isTyping = false;
let typewriterSpeed = 30;
let activeTypewriters = [];

function typeWriter(element, text, callback) {
    element.textContent = '';
    element.classList.remove('complete');
    storyNextBtn.classList.add('hidden');

    let charIndex = 0;
    let typeInterval = setInterval(() => {
        if (charIndex < text.length) {
            element.textContent += text.charAt(charIndex);
            charIndex++;
        } else {
            clearInterval(typeInterval);
            activeTypewriters = activeTypewriters.filter(t => t !== typeInterval);
            element.classList.add('complete');
            if (activeTypewriters.length === 0) {
                isTyping = false;
                storyNextBtn.classList.remove('hidden');
            }
            if (callback) callback();
        }
    }, typewriterSpeed);

    activeTypewriters.push(typeInterval);
}

function skipTyping() {
    activeTypewriters.forEach(interval => clearInterval(interval));
    activeTypewriters = [];

    const dialogue = dialogueScript[currentDialogueIndex];
    if (dialogue.image) {
        storyImage.src = dialogue.image;
        storyImage.classList.remove('hidden');
    } else {
        storyImage.classList.add('hidden');
    }

    if (dialogue.title) {
        storyTitle.style.display = '';
        storyTitle.textContent = dialogue.title;
    } else {
        storyTitle.textContent = '';
        storyTitle.style.display = 'none';
    }
    if (dialogue.html) {
        storyParagraph.innerHTML = dialogue.html;
    } else {
        storyParagraph.textContent = dialogue.text;
    }
    storyTitle.classList.add('complete');
    storyParagraph.classList.add('complete');
    
    isTyping = false;
    storyNextBtn.classList.remove('hidden');
}

const container = document.getElementById('container');

function showDialogue(index) {
    if (index >= dialogueScript.length) {
        storyModal.classList.add('hidden');
        container.classList.add('visible');
        return;
    }
    
    const dialogue = dialogueScript[index];
    isTyping = true;
    
    if (dialogue.image) {
        storyImage.src = dialogue.image;
        storyImage.classList.remove('hidden');
    } else {
        storyImage.classList.add('hidden');
    }
    
    if (dialogue.title) {
        storyTitle.style.display = '';
        typeWriter(storyTitle, dialogue.title, () => {
            if (dialogue.html) {
                storyParagraph.innerHTML = dialogue.html;
                storyParagraph.classList.add('complete');
                if (activeTypewriters.length === 0) {
                    isTyping = false;
                    storyNextBtn.classList.remove('hidden');
                }
            } else {
                typeWriter(storyParagraph, dialogue.text, null);
            }
        });
    } else {
        storyTitle.textContent = '';
        storyTitle.style.display = 'none';
        if (dialogue.html) {
            storyParagraph.innerHTML = dialogue.html;
            storyParagraph.classList.add('complete');
            isTyping = false;
            storyNextBtn.classList.remove('hidden');
        } else {
            typeWriter(storyParagraph, dialogue.text, null);
        }
    }
}

storyNextBtn.addEventListener('click', () => {
    if (isTyping) {
        skipTyping();
        return;
    }
    
    currentDialogueIndex++;
    showDialogue(currentDialogueIndex);
});

storyModal.addEventListener('click', (e) => {
    if (e.target === storyModal || e.target === storyModal.querySelector('.story-content')) {
        if (isTyping) {
            skipTyping();
        } else if (!storyNextBtn.classList.contains('hidden')) {
            currentDialogueIndex++;
            showDialogue(currentDialogueIndex);
        }
    }
});

function checkHardwareAcceleration() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            return false;
        }
        
        let renderer = null;
        let vendor = null;
        
        try {
            renderer = gl.getParameter(gl.RENDERER);
            vendor = gl.getParameter(gl.VENDOR);
        } catch (e) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                try {
                    renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                } catch (e2) {
                    return true;
                }
            }
        }
        
        if (renderer) {
            const rendererLower = renderer.toLowerCase();
            const vendorLower = vendor ? vendor.toLowerCase() : '';
            const isSoftware = rendererLower.includes('software') || 
                               rendererLower.includes('swiftshader') ||
                               rendererLower.includes('mesa') ||
                               vendorLower.includes('software');
            
            return !isSoftware;
        }
        
        return true;
    } catch (e) {
        return true;
    }
}

function showHardwareAccelerationModal() {
    const hwAccelModal = document.getElementById('hwAccelModal');
    const hwAccelCloseBtn = document.getElementById('hwAccelCloseBtn');
    
    if (hwAccelModal && hwAccelCloseBtn) {
        hwAccelModal.style.display = 'flex';
        
        hwAccelCloseBtn.onclick = () => {
            hwAccelModal.style.display = 'none';
        };
    }
}

function showWebcamModal() {
    return new Promise((resolve) => {
        const webcamModal = document.getElementById('webcamModal');
        const webcamModalBtn = document.getElementById('webcamModalBtn');
        
        if (webcamModal && webcamModalBtn) {
            webcamModal.style.display = 'flex';
            
            const handleClick = () => {
                webcamModal.style.display = 'none';
                webcamModalBtn.removeEventListener('click', handleClick);
                resolve();
            };
            
            webcamModalBtn.addEventListener('click', handleClick);
        } else {
            resolve();
        }
    });
}

storyModal.classList.remove('hidden');
showDialogue(0);

loadCurrentPainting();
enterIdle();

setTimeout(() => {
    console.log('After load - paintingLoaded:', paintingLoaded);
    console.log('Button text:', startGameBtn.textContent);
    console.log('Button hidden:', startGameBtn.classList.contains('hidden'));
    console.log('Button display:', startGameBtn.style.display);
}, 1000);