const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let desiredAspectRatio = null;

function clampZeroToOne(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(1, value));
}

function resizeCanvas() {
    const container = canvas.parentElement;
    const limitWidth = Math.min(800, container.clientWidth - 40);
    const limitHeight = Math.min(600, window.innerHeight - 300);
    let newWidth = limitWidth;
    let newHeight = limitHeight;

    if (desiredAspectRatio && desiredAspectRatio > 0) {
        const containerAspect = limitWidth / limitHeight;
        if (containerAspect > desiredAspectRatio) {
            newHeight = limitHeight;
            newWidth = Math.floor(newHeight * desiredAspectRatio);
        } else {
            newWidth = limitWidth;
            newHeight = Math.floor(newWidth / desiredAspectRatio);
        }
    }

    if (newWidth === canvas.width && newHeight === canvas.height) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (canvas.width && canvas.height) {
        tempCtx.drawImage(canvas, 0, 0);
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (tempCanvas.width && tempCanvas.height) {
        ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
    }
}

function updateVideoSize() {
    if (noseModeActive && !video.classList.contains('hidden')) {
        const canvasRect = canvas.getBoundingClientRect();
        const containerRect = canvas.parentElement.getBoundingClientRect();
        const relativeLeft = canvasRect.left - containerRect.left;
        const relativeTop = canvasRect.top - containerRect.top;

        video.style.position = 'absolute';
        video.style.width = canvasRect.width + 'px';
        video.style.height = canvasRect.height + 'px';
        video.style.left = relativeLeft + 'px';
        video.style.top = relativeTop + 'px';
        video.style.right = 'auto';
        video.style.bottom = 'auto';
    }
}

resizeCanvas();
window.addEventListener('resize', () => {
    resizeCanvas();
    if (noseModeActive && video.classList.contains('hidden') === false) {
        setTimeout(updateVideoSize, 100);
    }
});

function updateNoseCursor(x, y) {
    if (!noseModeActive) return;

    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = canvas.parentElement.getBoundingClientRect();

    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;
    const brushSizeScaled = brushSize * Math.max(scaleX, scaleY) * 2.5;

    noseCursor.style.left = (canvasRect.left - containerRect.left + x * scaleX) + 'px';
    noseCursor.style.top = (canvasRect.top - containerRect.top + y * scaleY) + 'px';
    noseCursor.style.width = brushSizeScaled + 'px';
    noseCursor.style.height = brushSizeScaled + 'px';
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
const brushBtn = document.getElementById('brushBtn');
const video = document.getElementById('video');
const noseCursor = document.getElementById('noseCursor');

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
});

eraserBtn.addEventListener('click', () => {
    currentTool = 'eraser';
    eraserBtn.classList.add('active');
    brushBtn.classList.remove('active');
    ctx.strokeStyle = '#ffffff';
    ctx.globalCompositeOperation = 'destination-out';
});

brushBtn.addEventListener('click', () => {
    currentTool = 'brush';
    brushBtn.classList.add('active');
    eraserBtn.classList.remove('active');
    ctx.strokeStyle = currentColor;
    ctx.fillStyle = currentColor;
    ctx.globalCompositeOperation = 'source-over';
});

function startDrawing(e) {
    if (!inputEnabled) return;
    startTimer();
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    lastX = (e.clientX - rect.left) * scaleX;
    lastY = (e.clientY - rect.top) * scaleY;
}

function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;
    const radius = ctx.lineWidth / 2;

    ctx.beginPath();
    ctx.arc(currentX, currentY, radius, 0, Math.PI * 2);

    if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = currentColor;
    } else {
        ctx.fill();
    }

    lastX = currentX;
    lastY = currentY;
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

const paintingImg = document.getElementById('monaLisaImg');
const comparisonResult = document.getElementById('comparisonResult');
const gameBar = document.getElementById('gameBar');
const toolsBar = document.getElementById('toolsBar');
const startGameBtn = document.getElementById('startGameBtn');
const peekBtn = document.getElementById('peekBtn');
const finishBtn = document.getElementById('finishBtn');
const phaseLabel = document.getElementById('phaseLabel');
const countdownLabel = document.getElementById('countdownLabel');
const timerBar = document.getElementById('timerBar');
const referenceTitle = document.getElementById('referenceTitle');
const referenceWrapper = document.getElementById('referenceWrapper');
const comparisonSection = document.getElementById('comparisonSection');
const resultsBar = document.getElementById('resultsBar');

let paintingLoaded = false;
let noseModeActive = false;

const paintings = [
    { title: 'Mona Lisa', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/402px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg' },
    { title: 'The Starry Night', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Vincent_van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/480px-Vincent_van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg' },
    { title: 'The Scream', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/The_Scream.jpg/480px-The_Scream.jpg' },
    { title: 'Girl with a Pearl Earring', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Meisje_met_de_parel.jpg/480px-Meisje_met_de_parel.jpg' }
];
let currentPaintingIndex = 0;

function loadCurrentPainting() {
    paintingLoaded = false;
    const { title, src } = paintings[currentPaintingIndex];
    referenceTitle.textContent = title;
    paintingImg.style.width = '';
    paintingImg.style.height = '';
    paintingImg.src = src;
}

paintingImg.onload = () => {
    paintingLoaded = true;
    const imgAspect = paintingImg.naturalWidth / paintingImg.naturalHeight;
    desiredAspectRatio = imgAspect;
    resizeCanvas();
    paintingImg.style.width = canvas.width + 'px';
    paintingImg.style.height = 'auto';
    paintingImg.classList.remove('hidden');
    
    extractedColors = extractPrimaryColors(paintingImg);
    orderedPalette = createOrderedPalette(extractedColors);
    paletteIndex = 0;
    
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


let gameActive = false;
let isPeeking = false;
let peeksLeft = 3;
const MEMORIZE_MS = 5000;
const DRAW_MS = 100000;
let memorizeTimerId = null;
let drawTimerId = null;
let countdownIntervalId = null;
let timerStartTime = null;
let timerStarted = false;

function setInputEnabled(enabled) {
    inputEnabled = enabled;
    if (!noseModeActive) {
        canvas.style.pointerEvents = enabled ? 'auto' : 'none';
    }
}

function resetCanvas() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = currentTool === 'brush' ? currentColor : '#ffffff';
}

function updateTimerBar(progress) {
    timerBar.style.width = Math.max(0, Math.min(1, progress)) * 100 + '%';
}

function showReference(show) {
    paintingImg.classList.toggle('hidden', !show);
    referenceWrapper.classList.toggle('hidden', !show);
    comparisonSection.classList.toggle('single', !show);
}

function setResultsBarVisible(visible) {
    resultsBar.classList.toggle('hidden', !visible);
}

function enterIdle() {
    gameActive = false;
    isPeeking = false;
    setInputEnabled(false);
    showReference(false);
    gameBar.classList.remove('hidden');
    toolsBar.classList.add('hidden');
    referenceTitle.textContent = paintings[currentPaintingIndex]?.title || 'Reference';
    setResultsBarVisible(false);
}

function enterGameReady() {
    gameActive = true;
    isPeeking = false;
    peeksLeft = 3;
    phaseLabel.textContent = 'Ready';
    countdownLabel.textContent = '';
    document.getElementById('peeksLeft').textContent = String(peeksLeft);
    updateTimerBar(0);
    showReference(false);
    gameBar.classList.remove('hidden');
    referenceTitle.textContent = 'Reference (Hidden)';
    setResultsBarVisible(false);
    peekBtn.disabled = true;
    finishBtn.disabled = true;
    toolsBar.classList.add('hidden');
    timerStarted = false;
    timerStartTime = null;
}

function startMemorizePhase() {
    resetCanvas();
    setInputEnabled(false);
    phaseLabel.textContent = 'Memorize';
    showReference(true);
    countdownLabel.textContent = '5s';

    const start = Date.now();
    updateTimerBar(0);
    countdownIntervalId = setInterval(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, MEMORIZE_MS - elapsed);
        countdownLabel.textContent = Math.ceil(remaining / 1000) + 's';
        updateTimerBar(elapsed / MEMORIZE_MS);
        if (remaining <= 0) {
            clearInterval(countdownIntervalId);
        }
    }, 100);

    memorizeTimerId = setTimeout(() => {
        showReference(false);
        startDrawPhase();
    }, MEMORIZE_MS);
}

function startDrawPhase() {
    phaseLabel.textContent = 'Draw!';
    setInputEnabled(true);
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
    setInputEnabled(false);
    showReference(true);
    phaseLabel.textContent = 'Results';
    countdownLabel.textContent = '';
    updateTimerBar(1);
    toolsBar.classList.add('hidden');
    const grade = compareWithPainting();
    if (grade !== null) {
        phaseLabel.textContent = 'Round cleared!';
        setTimeout(() => {
            currentPaintingIndex = (currentPaintingIndex + 1) % paintings.length;
            setResultsBarVisible(false);
            phaseLabel.textContent = 'Loading next...';
            loadCurrentPainting();
            const waitForLoad = setInterval(() => {
                if (paintingLoaded) {
                    clearInterval(waitForLoad);
                    startGameBtn.disabled = true;
                    startGameBtn.textContent = 'Running...';
                    enterGameReady();
                    startMemorizePhase();
                }
            }, 100);
        }, 1000);
    } else {
        startGameBtn.textContent = 'Play Again';
        startGameBtn.disabled = false;
        setResultsBarVisible(true);
    }
}

startGameBtn.addEventListener('click', () => {
    if (!paintingLoaded) {
        phaseLabel.textContent = 'Loading reference...';
        return;
    }
    
    if (!checkHardwareAcceleration()) {
        showHardwareAccelerationModal();
        return;
    }
    
    startGameBtn.disabled = true;
    startGameBtn.textContent = 'Running...';
    enterGameReady();
    startMemorizePhase();
});

peekBtn.addEventListener('click', doPeek);
finishBtn.addEventListener('click', finishGame);

let faceMesh = null;
let camera = null;
let lastNoseX = 0;
let lastNoseY = 0;
let noseDrawing = false;
let smoothedNoseX = 0;
let smoothedNoseY = 0;
let firstNoseDetection = true;
const SMOOTHING_FACTOR = 0.9;
const MIN_DISTANCE_THRESHOLD = 0.05;

let hands = null;
let lastFistClosedTime = 0;
const FIST_CLOSED_COOLDOWN = 800;
let fistWasClosed = false;
let extractedColors = [];
let orderedPalette = [];
let paletteIndex = 0;

function extractPrimaryColors(img) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.min(img.naturalWidth, 300);
    tempCanvas.height = Math.min(img.naturalHeight, 300);

    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const pixels = imageData.data;

    const colorMap = new Map();
    const sampleStep = 4;

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

function changeColorOnFistClosed() {
    const now = Date.now();
    if (now - lastFistClosedTime < FIST_CLOSED_COOLDOWN) return;
    lastFistClosedTime = now;

    if (orderedPalette.length > 0) {
        currentColor = orderedPalette[paletteIndex];
        paletteIndex = (paletteIndex + 1) % orderedPalette.length;
    } else {
        currentColor = '#000000';
    }

    if (colorPicker) {
        colorPicker.value = currentColor;
    }

    if (currentTool === 'brush') {
        ctx.strokeStyle = currentColor;
        ctx.fillStyle = currentColor;
    }
}

function isFistClosed(landmarks) {
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    const thumbMcp = landmarks[2];
    const indexMcp = landmarks[5];
    const middleMcp = landmarks[9];
    const ringMcp = landmarks[13];
    const pinkyMcp = landmarks[17];

    const thumbClosed = thumbTip.y > thumbMcp.y;
    const indexClosed = indexTip.y > indexMcp.y;
    const middleClosed = middleTip.y > middleMcp.y;
    const ringClosed = ringTip.y > ringMcp.y;
    const pinkyClosed = pinkyTip.y > pinkyMcp.y;

    return thumbClosed && indexClosed && middleClosed && ringClosed && pinkyClosed;
}

function onHandResults(results) {
    if (!noseModeActive || !inputEnabled) return;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
            const isClosed = isFistClosed(landmarks);
            if (isClosed && !fistWasClosed) {
                changeColorOnFistClosed();
                fistWasClosed = true;
            } else if (!isClosed) {
                fistWasClosed = false;
            }
        }
    } else {
        fistWasClosed = false;
    }
}

function initializeHands() {
    if (typeof Hands === 'undefined') {
        return;
    }

    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onHandResults);
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

function onFaceMeshResults(results) {
    if (!noseModeActive || !inputEnabled) {
        if (window.DEBUG_NOSE) console.log('Nose tracking skipped:', { noseModeActive, inputEnabled });
        return;
    }

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        const noseTip = landmarks[4];

        if (!noseTip) {
            if (window.DEBUG_NOSE) console.log('No nose tip found in landmarks');
            return;
        }

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasAspect = canvasWidth / canvasHeight;
        const videoWidth = video.videoWidth || video.clientWidth || 640;
        const videoHeight = video.videoHeight || video.clientHeight || 480;
        const videoAspect = videoWidth / videoHeight;

        let noseX = noseTip.x;
        let noseY = noseTip.y;
        let mappedX = noseX;
        let mappedY = noseY;

        mappedX = Math.max(0, Math.min(1, mappedX));
        mappedY = Math.max(0, Math.min(1, mappedY));
        
        const canvasX = mappedX * canvas.width;
        const canvasY = mappedY * canvas.height;
        
        updateNoseCursor(canvasX, canvasY);
        noseCursor.classList.remove('hidden');
    } else {
        noseCursor.classList.add('hidden');
        if (window.DEBUG_NOSE) console.log('No face detected');
    }
}

async function startNoseMode() {
    if (noseModeActive) {
        return;
    }

    noseModeActive = true;

    try {
        if (typeof FaceMesh === 'undefined' || typeof Camera === 'undefined') {
            alert('MediaPipe libraries are loading. Please wait a moment and try again.');
            noseModeActive = false;
            return;
        }

        if (!faceMesh) {
            initializeFaceMesh();
        }

        if (!hands) {
            initializeHands();
        }

        const canvasAspect = canvas.width / canvas.height;
        let camWidth = 640;
        let camHeight = 480;
        if (canvasAspect > (640 / 480)) {
            camHeight = Math.round(640 / canvasAspect);
        } else {
            camWidth = Math.round(480 * canvasAspect);
        }

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

        setTimeout(() => {
            updateVideoSize();
        }, 100);

        camera = new Camera(video, {
            onFrame: async () => {
                if (noseModeActive) {
                    if (faceMesh) {
                        await faceMesh.send({ image: video });
                    }
                    if (hands) {
                        await hands.send({ image: video });
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
    noseCursor.classList.add('hidden');
    canvas.style.pointerEvents = inputEnabled ? 'auto' : 'none';
}


const originalSetInputEnabled = setInputEnabled;
let autoStartingNoseMode = false;

setInputEnabled = function(enabled) {
    originalSetInputEnabled(enabled);
    if (enabled && !noseModeActive && !autoStartingNoseMode) {
        autoStartingNoseMode = true;
        startNoseMode().finally(() => {
            autoStartingNoseMode = false;
        });
    } else if (!enabled && noseModeActive) {
        stopNoseMode();
    }
};

const storyModal = document.getElementById('storyModal');
const storyNextBtn = document.getElementById('storyNextBtn');
const storyTitle = document.getElementById('storyTitle');
const storyParagraph = document.getElementById('storyParagraph');

const dialogueScript = [
    { title: 'The Great Museum Heist', text: 'Our museum was robbed!', image: 'images/museum1.png' },
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
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            
            const isSoftware = renderer.toLowerCase().includes('software') || 
                               renderer.toLowerCase().includes('swiftshader') ||
                               renderer.toLowerCase().includes('mesa') ||
                               vendor.toLowerCase().includes('software');
            
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

storyModal.classList.remove('hidden');
showDialogue(0);

loadCurrentPainting();
enterIdle();