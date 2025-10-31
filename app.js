const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let desiredAspectRatio = null; // width / height from current painting

function clamp01(value) {
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

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

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

colorPicker.addEventListener('change', (e) => {
    currentColor = e.target.value;
    if (currentTool === 'brush') {
        ctx.strokeStyle = currentColor;
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
    ctx.globalCompositeOperation = 'source-over';
});

function startDrawing(e) {
    if (!inputEnabled) return;
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    
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

const monaLisaImg = document.getElementById('monaLisaImg');
const compareBtn = document.getElementById('compareBtn');
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
let monaLisaLoaded = false;

const paintings = [
    { title: 'Mona Lisa', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/402px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg' },
    { title: 'The Starry Night', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Vincent_van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/480px-Vincent_van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg' },
    { title: 'The Scream', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/The_Scream.jpg/480px-The_Scream.jpg' },
    { title: 'Girl with a Pearl Earring', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Meisje_met_de_parel.jpg/480px-Meisje_met_de_parel.jpg' }
];
let currentPaintingIndex = 0;

function loadCurrentPainting() {
    monaLisaLoaded = false;
    const { title, src } = paintings[currentPaintingIndex];
    referenceTitle.textContent = title;
    monaLisaImg.style.width = '';
    monaLisaImg.style.height = '';
    monaLisaImg.src = src;
}

monaLisaImg.onload = () => {
    monaLisaLoaded = true;
    const imgAspect = monaLisaImg.naturalWidth / monaLisaImg.naturalHeight;
    desiredAspectRatio = imgAspect;
    resizeCanvas();
    monaLisaImg.style.width = canvas.width + 'px';
    monaLisaImg.style.height = 'auto';
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
    // SSIM-like metric for structure
    const drawingMean = drawingBrightnessSum / totalPixels;
    const referenceMean = referenceBrightnessSum / totalPixels;
    const drawingVar = (drawingBrightnessSq / totalPixels) - (drawingMean * drawingMean);
    const referenceVar = (referenceBrightnessSq / totalPixels) - (referenceMean * referenceMean);
    const covariance = (crossSum / totalPixels) - (drawingMean * referenceMean);
    
    const c1 = 0.05 * 255;
    const c2 = 0.15 * 255;
    const numerator = (2 * drawingMean * referenceMean + c1) * (2 * covariance + c2);
    const denominator = (drawingMean * drawingMean + referenceMean * referenceMean + c1) * (drawingVar + referenceVar + c2);
    scores.structuralSimilarity = clamp01(numerator / denominator);
    
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

function compareWithMonaLisa() {
    if (!monaLisaLoaded) {
        comparisonResult.textContent = 'Loading Mona Lisa...';
        return null;
    }
    comparisonResult.textContent = 'Analyzing...';
    const comparisonSize = 32;
    const drawingData = getImageDataFromCanvas(canvas, comparisonSize, comparisonSize);
    const referenceData = getImageDataFromImage(monaLisaImg, comparisonSize, comparisonSize);
    const scores = compareImages(drawingData, referenceData, comparisonSize, comparisonSize);
    // Weighted average emphasizes structure and edges
    const overallSimilarity = clamp01((0.35 * scores.colorSimilarity) + 
                    (0.45 * scores.luminanceSimilarity) + 
                    (0.10 * scores.edgeSimilarity) + 
                    (0.10 * scores.structuralSimilarity));
    const eased = 1 - Math.pow(1 - overallSimilarity, 0.5);
    const displaySimilarity = clamp01(eased + 0.05);
    const similarityPercent = Math.round(displaySimilarity * 100);
    let message = `Similarity: ${similarityPercent}%`;
    if (similarityPercent >= 80) {
        message += ' - Masterpiece!';
    } else if (similarityPercent >= 60) {
        message += ' - Impressive!';
    } else if (similarityPercent >= 40) {
        message += ' - Not bad!';
    } else if (similarityPercent >= 20) {
        message += ' - Keep trying!';
    } else {
        message += ' - Abstract art!';
    }
    comparisonResult.innerHTML = `${message}<br>` +
        `<small style="color: #666;">Color: ${Math.round(scores.colorSimilarity * 100)}% | ` +
        `Structure: ${Math.round(scores.structuralSimilarity * 100)}% | ` +
        `Edges: ${Math.round(scores.edgeSimilarity * 100)}%</small>`;
    return similarityPercent;
}

compareBtn.addEventListener('click', compareWithMonaLisa);

let gameActive = false;
let isPeeking = false;
let peeksLeft = 3;
const MEMORIZE_MS = 5000;
const DRAW_MS = 30000;
let memorizeTimerId = null;
let drawTimerId = null;
let countdownIntervalId = null;

function setInputEnabled(enabled) {
    inputEnabled = enabled;
    canvas.style.pointerEvents = enabled ? 'auto' : 'none';
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
    monaLisaImg.classList.toggle('hidden', !show);
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
    compareBtn.classList.remove('hidden');
    referenceTitle.textContent = 'Mona Lisa';
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
    compareBtn.classList.add('hidden');
    referenceTitle.textContent = 'Reference (Hidden)';
    setResultsBarVisible(false);
    peekBtn.disabled = true;
    finishBtn.disabled = true;
    toolsBar.classList.add('hidden');
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
    const start = Date.now();
    countdownLabel.textContent = Math.ceil(DRAW_MS / 1000) + 's';
    updateTimerBar(0);
    countdownIntervalId = setInterval(() => {
        const elapsed = Date.now() - start;
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
    peekBtn.disabled = true;
    finishBtn.disabled = true;
    setInputEnabled(false);
    showReference(true);
    phaseLabel.textContent = 'Results';
    countdownLabel.textContent = '';
    updateTimerBar(1);
    toolsBar.classList.add('hidden');
    const similarity = compareWithMonaLisa();
    if (similarity !== null && similarity >= 50) {
        phaseLabel.textContent = 'Round cleared!';
        setTimeout(() => {
            currentPaintingIndex = (currentPaintingIndex + 1) % paintings.length;
            setResultsBarVisible(false);
            phaseLabel.textContent = 'Loading next...';
            loadCurrentPainting();
            const waitForLoad = setInterval(() => {
                if (monaLisaLoaded) {
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
    if (!monaLisaLoaded) {
        phaseLabel.textContent = 'Loading reference...';
        return;
    }
    startGameBtn.disabled = true;
    startGameBtn.textContent = 'Running...';
    enterGameReady();
    startMemorizePhase();
});

peekBtn.addEventListener('click', doPeek);
finishBtn.addEventListener('click', finishGame);

loadCurrentPainting();
enterIdle();