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
    const windowWidth = window.innerWidth || 1200;
    const windowHeight = window.innerHeight || 800;
    
    let availableWidth = 1000;
    if (comparisonSection && !comparisonSection.classList.contains('hidden')) {
        const sectionWidth = comparisonSection.clientWidth || windowWidth;
        availableWidth = Math.min(1000, sectionWidth - 80);
    } else {
        availableWidth = Math.min(1000, windowWidth - 80);
    }
    
    const availableHeight = Math.min(900, windowHeight - 200);
    const limitWidth = Math.max(500, availableWidth);
    const limitHeight = Math.max(500, availableHeight);
    
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
    } else {
        newWidth = limitWidth;
        newHeight = limitHeight;
    }

    if (newWidth <= 0 || newHeight <= 0) {
        newWidth = 1000;
        newHeight = 750;
    }

    if (newWidth === canvas.width && newHeight === canvas.height) {
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
    
    const canvasContainer = canvas.parentElement;
    if (canvasContainer && canvasContainer.classList.contains('canvas-container')) {
        canvasContainer.style.minWidth = newWidth + 'px';
        canvasContainer.style.minHeight = newHeight + 'px';
    }
    
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

function updateCursor(canvasX, canvasY) {
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

function drawHandWireframe(landmarks, isFistDetected = false) {
    if (!handWireframeCtx || handWireframeCanvas.classList.contains('hidden')) return;
    
    handWireframeCtx.clearRect(0, 0, handWireframeCanvas.width, handWireframeCanvas.height);
    handWireframeCtx.strokeStyle = '#00ff00';
    handWireframeCtx.lineWidth = 2;
    
    const handConnections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [0, 9], [9, 10], [10, 11], [11, 12],
        [0, 13], [13, 14], [14, 15], [15, 16],
        [0, 17], [17, 18], [18, 19], [19, 20],
        [5, 9], [9, 13], [13, 17]
    ];
    
    handConnections.forEach(([start, end]) => {
        if (landmarks[start] && landmarks[end]) {
            handWireframeCtx.beginPath();
            handWireframeCtx.moveTo(
                (1 - landmarks[start].x) * handWireframeCanvas.width,
                landmarks[start].y * handWireframeCanvas.height
            );
            handWireframeCtx.lineTo(
                (1 - landmarks[end].x) * handWireframeCanvas.width,
                landmarks[end].y * handWireframeCanvas.height
            );
            handWireframeCtx.stroke();
        }
    });
    
    if (landmarks[8] && !isFistDetected) {
        handWireframeCtx.fillStyle = '#ff0000';
        handWireframeCtx.beginPath();
        handWireframeCtx.arc(
            (1 - landmarks[8].x) * handWireframeCanvas.width,
            landmarks[8].y * handWireframeCanvas.height,
            6,
            0,
            2 * Math.PI
        );
        handWireframeCtx.fill();
    }
}

let isDrawing = false;
let currentTool = 'brush';
let currentColor = '#000000';
let brushSize = 3;
let lastX = 0;
let lastY = 0;
let inputEnabled = true;
let orderedPalette = [];
let noseModeActive = false;

const customColorPicker = document.getElementById('customColorPicker');
const colorPickerBtn = document.getElementById('colorPickerBtn');
const colorPickerModal = document.getElementById('colorPickerModal');
const closeColorPicker = document.getElementById('closeColorPicker');
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

function updateCustomColorPicker() {
    if (!customColorPicker) return;
    
    const allColors = ['#000000', ...(orderedPalette || []), '#FFFFFF'];
    const uniqueColors = [...new Set(allColors)];
    
    customColorPicker.innerHTML = '';
    let activeFound = false;
    
    uniqueColors.forEach(color => {
        const colorSwatch = document.createElement('div');
        colorSwatch.className = 'color-swatch';
        if (currentColor === color && !activeFound) {
            colorSwatch.classList.add('active');
            activeFound = true;
        }
        colorSwatch.style.backgroundColor = color;
        colorSwatch.title = color;
        colorSwatch.addEventListener('click', () => {
            currentColor = color;
            if (currentTool === 'brush') {
                ctx.strokeStyle = currentColor;
                ctx.fillStyle = currentColor;
            }
            updateCustomColorPicker();
            colorPickerModal?.classList.add('hidden');
        });
        customColorPicker.appendChild(colorSwatch);
    });
}

if (colorPickerBtn) {
    colorPickerBtn.addEventListener('click', () => {
        updateCustomColorPicker();
        if (colorPickerModal) {
            colorPickerModal.classList.remove('hidden');
        }
    });
}

if (closeColorPicker) {
    closeColorPicker.addEventListener('click', () => {
        if (colorPickerModal) {
            colorPickerModal.classList.add('hidden');
        }
    });
}

if (colorPickerModal) {
    colorPickerModal.addEventListener('click', (e) => {
        if (e.target === colorPickerModal) {
            colorPickerModal.classList.add('hidden');
        }
    });
}

brushSizeSlider.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value);
    brushSizeValue.textContent = brushSize;
    ctx.lineWidth = brushSize;
});

clearBtn.addEventListener('click', () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    if (handDrawing) handDrawing = false;
    if (noseDrawing) noseDrawing = false;
    if (eyeDrawing) eyeDrawing = false;
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
    if (!inputEnabled || currentPaintingIndex !== 0) return;
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
    if (!isDrawing || !inputEnabled || currentPaintingIndex !== 0) return;

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
    isDrawing = false;
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

updateCustomColorPicker();

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
const faceDrawingImage = document.getElementById('faceDrawingImage');
const eyeDrawingImage = document.getElementById('eyeDrawingImage');
const yourDrawingTitle = document.getElementById('yourDrawingTitle');
const referenceTitle = document.getElementById('referenceTitle');
const referenceWrapper = document.getElementById('referenceWrapper');
const comparisonSection = document.getElementById('comparisonSection');
const resultsBar = document.getElementById('resultsBar');
const peekOverlay = document.getElementById('peekOverlay');
const peekOverlayImg = document.getElementById('peekOverlayImg');
const transitionOverlay = document.getElementById('transitionOverlay');
const referenceCanvas = document.getElementById('referenceCanvas');
const gradeDisplay = document.getElementById('gradeDisplay');
const gradeWrapper = document.getElementById('gradeWrapper');
const detectionWaitOverlay = document.getElementById('detectionWaitOverlay');
const finalResultsModal = document.getElementById('finalResultsModal');
const gpaDisplay = document.getElementById('gpaDisplay');
const paintingGallery = document.getElementById('paintingGallery');
const restartGameBtn = document.getElementById('restartGameBtn');

const paintings = [
    { title: 'Mona Lisa', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/500px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg' },
    { title: 'Girl with a Pearl Earring', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Meisje_met_de_parel.jpg/960px-Meisje_met_de_parel.jpg' },
    { title: 'Broadway Boogie Woogie', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Piet_Mondrian%2C_1942_-_Broadway_Boogie_Woogie.jpg/960px-Piet_Mondrian%2C_1942_-_Broadway_Boogie_Woogie.jpg' },
    { title: 'Black Square', src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Kazimir_Malevich%2C_1915%2C_Black_Suprematic_Square%2C_oil_on_linen_canvas%2C_79.5_x_79.5_cm%2C_Tretyakov_Gallery%2C_Moscow.jpg/960px-Kazimir_Malevich%2C_1915%2C_Black_Suprematic_Square%2C_oil_on_linen_canvas%2C_79.5_x_79.5_cm%2C_Tretyakov_Gallery%2C_Moscow.jpg' }
];

let currentPaintingIndex = 0;
let completedPaintings = [];
let allGrades = [];

function loadCurrentPainting() {
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

function calculateDisplaySize(aspectRatio, maxWidth = 200, maxHeight = 300) {
    let displayWidth = maxWidth;
    let displayHeight = displayWidth / aspectRatio;
    
    if (displayHeight > maxHeight) {
        displayHeight = maxHeight;
        displayWidth = displayHeight * aspectRatio;
    }
    
    return { width: Math.floor(displayWidth), height: Math.floor(displayHeight) };
}

paintingImg.onload = () => {
    paintingLoaded = true;
    desiredAspectRatio = paintingImg.naturalWidth / paintingImg.naturalHeight;
    resizeCanvas();
    
    const { width, height } = calculateDisplaySize(desiredAspectRatio);
    paintingImg.style.width = width + 'px';
    paintingImg.style.height = 'auto';
    resizeCanvas();

    extractedColors = extractPrimaryColors(paintingImg);
    orderedPalette = createOrderedPalette(extractedColors);
    updateCustomColorPicker();

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

    const totalPixels = width * height;
    let colorDiff = 0;
    let luminanceDiff = 0;
    let edgeDiff = 0;
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
    const grades = [
        [97, 'A+'], [93, 'A'], [90, 'A-'],
        [87, 'B+'], [83, 'B'], [80, 'B-'],
        [77, 'C+'], [73, 'C'], [70, 'C-'],
        [67, 'D+'], [63, 'D'], [60, 'D-']
    ];
    for (const [threshold, grade] of grades) {
        if (percent >= threshold) return grade;
    }
    return 'F';
}

function gradeToGPA(grade) {
    const gpaMap = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'D-': 0.7,
        'F': 0.0
    };
    return gpaMap[grade] || 0.0;
}

function calculateGPA() {
    if (allGrades.length === 0) return 0.0;
    const totalGPA = allGrades.reduce((sum, grade) => sum + gradeToGPA(grade), 0);
    return (totalGPA / allGrades.length).toFixed(2);
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

    comparisonResult.textContent = '';
    return { grade: letterGrade, scores };
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
        if (data[i + 3] > 0 && (data[i] < 255 || data[i + 1] < 255 || data[i + 2] < 255)) {
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
    if (comparisonSection) {
        if (visible) {
            comparisonSection.classList.add('with-grade');
        } else {
            comparisonSection.classList.remove('with-grade');
        }
    }
}

function enterIdle() {
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
    if (faceDrawingImage) {
        faceDrawingImage.classList.add('hidden');
    }
    if (yourDrawingTitle) {
        yourDrawingTitle.textContent = 'Your Drawing';
    }
    startGameBtn.disabled = false;
    startGameBtn.textContent = 'Start Challenge';
    startGameBtn.style.display = '';
    startGameBtn.classList.remove('hidden');
}

function enterGameReady() {
    isPeeking = false;
    peeksLeft = 3;
    phaseLabel.textContent = 'Ready';
    countdownLabel.textContent = '';
    document.getElementById('peeksLeft').textContent = String(peeksLeft);
    updateTimerBar(0);
    showReference(false);
    gameBar.classList.add('hidden');
    gameBar.classList.remove('active-game');
    referenceTitle.textContent = paintings[currentPaintingIndex]?.title || 'Reference';
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
    if (yourDrawingTitle) {
        yourDrawingTitle.textContent = 'Your Drawing';
    }
}

function startTeasingPhase() {
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
        teasingLines = [
            'I have been stolen before...',
            'I am the best in our collection...',
            'I am...'
        ];
    } else if (paintingNumber === 2) {
        teasingLines = [
            'I am known as the Dutch Mona Lisa...',
            'My identity remains a mystery...',
            'I am...'
        ];
    } else if (paintingNumber === 3) {
        teasingLines = [
            'I capture the rhythm of the city...',
            'I am geometric perfection...',
            'I am...'
        ];
    } else if (paintingNumber === 4) {
        teasingLines = [
            'I am abstract...',
            'I am the zero point of painting...',
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
    resetCanvas();
    setInputEnabled(false);
    phaseLabel.textContent = 'Memorize';
    
    if (paintingLoaded && desiredAspectRatio && desiredAspectRatio > 0) {
        const { width, height } = calculateDisplaySize(desiredAspectRatio, 200, 300);
        paintingImg.style.width = Math.max(100, width) + 'px';
        paintingImg.style.height = 'auto';
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
        title = 'Mona Lisa';
        factsHTML = `
            <p><strong>Artist:</strong> Leonardo da Vinci</p>
            <p><strong>Year:</strong> 1503-1519</p>
            <p><strong>Location:</strong> Louvre Museum, Paris</p>
            <p><strong>Famous for:</strong> I really don't know why she's famous</p>
            <p><strong>Fun fact:</strong> Stolen in 1911 by an Italian who wanted the painting back in Italy, recovered in 1913</p>
            <p><strong>Value:</strong> Estimated at over 8 billion stardust</p>
        `;
    } else if (paintingNumber === 2) {
        title = 'Girl with a Pearl Earring';
        factsHTML = `
            <p><strong>Artist:</strong> Johannes Vermeer</p>
            <p><strong>Year:</strong> 1665</p>
            <p><strong>Location:</strong> Mauritshuis, The Hague</p>
            <p><strong>Famous for:</strong> Being called "the Dutch Mona Lisa"</p>
            <p><strong>Fun fact:</strong> The subject's identity is unknown, and the "pearl" is likely a glass bead</p>
            <p><strong>Value:</strong> Priceless - considered a national treasure of the Netherlands</p>
        `;
    } else if (paintingNumber === 3) {
        title = 'Broadway Boogie Woogie';
        factsHTML = `
            <p><strong>Artist:</strong> Piet Mondrian</p>
            <p><strong>Year:</strong> 1942-1943</p>
            <p><strong>Location:</strong> Museum of Modern Art, New York</p>
            <p><strong>Famous for:</strong> Capturing the rhythm and energy of New York City</p>
            <p><strong>Fun fact:</strong> Mondrian's last completed painting before his death - inspired by jazz and city life</p>
            <p><strong>Value:</strong> Estimated at over 50 million stardust - geometric perfection!</p>
        `;
    } else if (paintingNumber === 4) {
        title = 'Black Square';
        factsHTML = `
            <p><strong>Artist:</strong> Kazimir Malevich</p>
            <p><strong>Year:</strong> 1915</p>
            <p><strong>Location:</strong> Tretyakov Gallery, Moscow</p>
            <p><strong>Famous for:</strong> Being literally just a black square - the ultimate simplicity</p>
            <p><strong>Fun fact:</strong> Considered the "zero point of painting" - the most radical simplification possible</p>
            <p><strong>Value:</strong> Priceless - a foundational work of abstract art!</p>
        `;
    }
    
    if (title && factsHTML) {
        referenceTitle.textContent = title;
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
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (canvasWrapper) {
        canvasWrapper.classList.remove('hidden');
    }
    
    const paintingNumber = currentPaintingIndex + 1;
    
    if (paintingNumber === 1) {
        phaseLabel.textContent = '';
        if (yourDrawingTitle) {
            yourDrawingTitle.textContent = 'Draw with your mouse';
        }
        stopNoseMode();
        stopHandMode();
        setInputEnabled(true);
        canvas.style.pointerEvents = 'auto';
        canvas.style.cursor = 'crosshair';
        if (mouseDrawingImage) {
            mouseDrawingImage.classList.remove('hidden');
        }
        if (faceDrawingImage) {
            faceDrawingImage.classList.add('hidden');
        }
    } else if (paintingNumber === 2) {
        phaseLabel.textContent = '';
        if (yourDrawingTitle) {
            yourDrawingTitle.textContent = 'Draw with your hand, make a fist to stop drawing';
        }
        stopNoseMode();
        if (mouseDrawingImage) {
            mouseDrawingImage.classList.add('hidden');
        }
        if (faceDrawingImage) {
            faceDrawingImage.classList.remove('hidden');
        }
        if (eyeDrawingImage) {
            eyeDrawingImage.classList.add('hidden');
        }
        canvas.style.pointerEvents = 'none';
        setInputEnabled(true);
        await startHandMode();
    } else if (paintingNumber === 3) {
        phaseLabel.textContent = '';
        if (yourDrawingTitle) {
            yourDrawingTitle.textContent = 'Draw with your nose, cover it to stop drawing';
        }
        stopHandMode();
        if (mouseDrawingImage) {
            mouseDrawingImage.classList.add('hidden');
        }
        if (faceDrawingImage) {
            faceDrawingImage.classList.remove('hidden');
        }
        if (eyeDrawingImage) {
            eyeDrawingImage.classList.add('hidden');
        }
        canvas.style.pointerEvents = 'none';
        setInputEnabled(true);
        await startNoseMode();
    } else if (paintingNumber === 4) {
        phaseLabel.textContent = '';
        if (yourDrawingTitle) {
            yourDrawingTitle.textContent = 'Draw with your eyes, close one eye to draw with one brush';
        }
        stopNoseMode();
        stopHandMode();
        if (mouseDrawingImage) {
            mouseDrawingImage.classList.add('hidden');
        }
        if (faceDrawingImage) {
            faceDrawingImage.classList.add('hidden');
        }
        if (eyeDrawingImage) {
            eyeDrawingImage.classList.remove('hidden');
        }
        canvas.style.pointerEvents = 'none';
        setInputEnabled(true);
        await startEyeMode();
    } else {
        phaseLabel.textContent = '';
        if (yourDrawingTitle) {
            yourDrawingTitle.textContent = 'Your Drawing';
        }
        stopNoseMode();
        stopHandMode();
        stopEyeMode();
        if (mouseDrawingImage) {
            mouseDrawingImage.classList.add('hidden');
        }
        if (faceDrawingImage) {
            faceDrawingImage.classList.add('hidden');
        }
        if (eyeDrawingImage) {
            eyeDrawingImage.classList.add('hidden');
        }
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

function updatePeekOverlayPosition() {
    if (!peekOverlay || peekOverlay.classList.contains('hidden')) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    const canvasAspect = canvas.width / canvas.height;
    const imgAspect = paintingImg.naturalWidth / paintingImg.naturalHeight;
    
    let overlayWidth = canvasRect.width;
    let overlayHeight = canvasRect.height;
    
    if (imgAspect > canvasAspect) {
        overlayHeight = overlayWidth / imgAspect;
    } else {
        overlayWidth = overlayHeight * imgAspect;
    }
    
    peekOverlay.style.width = overlayWidth + 'px';
    peekOverlay.style.height = overlayHeight + 'px';
    peekOverlay.style.left = canvasRect.left + (canvasRect.width - overlayWidth) / 2 + 'px';
    peekOverlay.style.top = canvasRect.top + (canvasRect.height - overlayHeight) / 2 + 'px';
}

function doPeek() {
    if (peeksLeft <= 0 || isPeeking) return;
    isPeeking = true;
    peeksLeft -= 1;
    document.getElementById('peeksLeft').textContent = String(peeksLeft);
    
    peekBtn.classList.add('flash');
    setTimeout(() => peekBtn.classList.remove('flash'), 350);
    
    if (peekOverlay && peekOverlayImg && paintingLoaded) {
        peekOverlayImg.src = paintingImg.src;
        
        updatePeekOverlayPosition();
        peekOverlay.classList.remove('hidden');
        
        const positionInterval = setInterval(() => {
            if (peekOverlay.classList.contains('hidden')) {
                clearInterval(positionInterval);
                return;
            }
            updatePeekOverlayPosition();
        }, 100);
        
        setTimeout(() => {
            peekOverlay.classList.add('hidden');
            clearInterval(positionInterval);
            isPeeking = false;
            if (peeksLeft <= 0) peekBtn.disabled = true;
        }, 5000);
    } else {
        setTimeout(() => {
            isPeeking = false;
            if (peeksLeft <= 0) peekBtn.disabled = true;
        }, 5000);
    }
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
    stopEyeMode();
    toolsBar.classList.add('hidden');
    phaseLabel.textContent = '';
    countdownLabel.textContent = '';
    updateTimerBar(1);
    
    if (gradeDisplay) {
        gradeDisplay.classList.add('hidden');
    }
    if (transitionOverlay) {
        transitionOverlay.classList.add('hidden');
    }
    
    referenceWrapper.classList.add('hidden');
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (canvasWrapper) {
        canvasWrapper.classList.remove('hidden');
    }
    
    if (gameBar) {
        gameBar.classList.add('hidden');
    }
    
    canvas.classList.add('hidden');
    
    const drawingIndicator = document.querySelector('.drawing-indicator');
    if (drawingIndicator) {
        drawingIndicator.classList.add('hidden');
    }
    if (yourDrawingTitle) {
        yourDrawingTitle.classList.add('hidden');
    }
    
    const canvasContainer = canvas.parentElement;
    let transitionImg = null;
    
    if (paintingImg && paintingImg.complete && canvasContainer) {
        const wasHidden = canvas.classList.contains('hidden');
        if (wasHidden) {
            canvas.classList.remove('hidden');
            canvas.style.visibility = 'hidden';
        }
        
        const canvasRect = canvas.getBoundingClientRect();
        const containerRect = canvasContainer.getBoundingClientRect();
        
        if (wasHidden) {
            canvas.style.visibility = '';
            canvas.classList.add('hidden');
        }
        
        transitionImg = document.createElement('img');
        transitionImg.src = paintingImg.src;
        transitionImg.style.position = 'absolute';
        transitionImg.style.top = (canvasRect.top - containerRect.top) + 'px';
        transitionImg.style.left = (canvasRect.left - containerRect.left) + 'px';
        transitionImg.style.width = canvasRect.width + 'px';
        transitionImg.style.height = canvasRect.height + 'px';
        transitionImg.style.objectFit = 'contain';
        transitionImg.style.border = '2px solid #ddd';
        transitionImg.style.borderRadius = '4px';
        transitionImg.style.background = 'white';
        transitionImg.style.zIndex = '100';
        transitionImg.style.opacity = '1';
        transitionImg.style.transition = 'opacity 1.5s ease-in-out';
        transitionImg.style.boxSizing = 'border-box';
        canvasContainer.appendChild(transitionImg);
    }
    
    setTimeout(() => {
        canvas.style.opacity = '0';
        canvas.classList.remove('hidden');
        canvas.style.transition = 'opacity 1.5s ease-in-out';
        
        requestAnimationFrame(() => {
            if (transitionImg) {
                transitionImg.style.opacity = '0';
            }
            canvas.style.opacity = '1';
        });
        
        setTimeout(() => {
            if (transitionImg && transitionImg.parentElement) {
                transitionImg.parentElement.removeChild(transitionImg);
            }
            canvas.style.transition = '';
            canvas.style.opacity = '';
            if (transitionOverlay) {
                transitionOverlay.classList.add('hidden');
            }
            
            if (drawingIndicator) {
                drawingIndicator.classList.add('hidden');
            }
            if (yourDrawingTitle) {
                yourDrawingTitle.classList.remove('hidden');
                yourDrawingTitle.textContent = 'Your Drawing';
            }
            
            comparisonSection.classList.remove('hidden');
            comparisonSection.classList.remove('single');
            resizeCanvas();
            
            const canvasContainerCheck = canvas.parentElement;
            if (canvasContainerCheck && canvas.width && canvas.height) {
                canvasContainerCheck.style.minWidth = canvas.width + 'px';
                canvasContainerCheck.style.minHeight = canvas.height + 'px';
                canvasContainerCheck.style.width = 'auto';
                canvasContainerCheck.style.height = 'auto';
            }
            
            const result = compareWithPainting();
            if (gradeDisplay && result && result.grade) {
                gradeDisplay.innerHTML = `Grade: ${result.grade}<br>` +
                    `<small style="color: #666; font-size: 0.3em; font-weight: normal; display: block; margin-top: 10px;">` +
                    `Color: ${Math.round(result.scores.colorSimilarity * 100)}% | ` +
                    `Structure: ${Math.round(result.scores.structuralSimilarity * 100)}% | ` +
                    `Edges: ${Math.round(result.scores.edgeSimilarity * 100)}%</small>`;
                gradeDisplay.classList.remove('grade-F', 'grade-Dminus', 'grade-D', 'grade-Dplus', 
                                               'grade-Cminus', 'grade-C', 'grade-Cplus',
                                               'grade-Bminus', 'grade-B', 'grade-Bplus',
                                               'grade-Aminus', 'grade-A', 'grade-Aplus');
                if (!gradeDisplay.classList.contains('grade-display')) {
                    gradeDisplay.classList.add('grade-display');
                }
                const gradeClass = `grade-${result.grade.replace('+', 'plus').replace('-', 'minus')}`;
                gradeDisplay.classList.add(gradeClass);
                gradeDisplay.classList.remove('hidden');
                if (gradeWrapper) {
                    gradeWrapper.classList.remove('hidden');
                }
                setResultsBarVisible(false);
            }
            phaseLabel.textContent = 'Results';
            
            if (result && result.grade !== null) {
                const paintingData = {
                    index: currentPaintingIndex,
                    title: paintings[currentPaintingIndex].title,
                    grade: result.grade,
                    canvasData: canvas.toDataURL()
                };
                
                completedPaintings.push(paintingData);
                allGrades.push(result.grade);
                const nextIndex = (currentPaintingIndex + 1) % paintings.length;
                const isGameComplete = nextIndex === 0 && completedPaintings.length === paintings.length;
                
                if (isGameComplete) {
                    setTimeout(() => {
                        showFinalResults();
                    }, 5000);
                } else {
                    const completedPaintingIndex = currentPaintingIndex;
                    currentPaintingIndex = nextIndex;
                    setTimeout(() => {
                        phaseLabel.textContent = 'Painting cleared! Next painting...';
                        setTimeout(() => {
                            if (gradeDisplay) {
                                gradeDisplay.classList.add('hidden');
                            }
                            setResultsBarVisible(false);
                            phaseLabel.textContent = 'Loading next...';
                            loadCurrentPainting();
                            const waitForLoad = setInterval(() => {
                                if (paintingLoaded) {
                                    clearInterval(waitForLoad);
                                    const continueToNext = () => {
                                        startGameBtn.disabled = true;
                                        startGameBtn.classList.add('hidden');
                                        enterGameReady();
                                        startTeasingPhase();
                                    };
                                    
                                    if (completedPaintingIndex === 0) {
                                        showHandStory(continueToNext);
                                    } else if (completedPaintingIndex === 1) {
                                        showNoseStory(continueToNext);
                                    } else if (completedPaintingIndex === 2) {
                                        showEyesStory(continueToNext);
                                    } else {
                                        continueToNext();
                                    }
                                }
                            }, 100);
                        }, 2000);
                    }, 5000);
                }
            } else {
                startGameBtn.textContent = 'Start Challenge';
                startGameBtn.disabled = false;
                enterIdle();
            }
        }, 1500);
    }, 2000);
}

function showFinalResults() {
    if (!finalResultsModal || !gpaDisplay || !paintingGallery) return;
    
    const gpa = calculateGPA();
    gpaDisplay.innerHTML = `<div class="gpa-value">${gpa}</div><div class="gpa-label">GPA</div>`;
    
    paintingGallery.innerHTML = '';
    completedPaintings.forEach((painting, index) => {
        const paintingCard = document.createElement('div');
        paintingCard.className = 'painting-card';
        const originalSrc = paintings[painting.index].src;
        paintingCard.innerHTML = `
            <div class="painting-thumbnail-container">
                <img src="${painting.canvasData}" alt="${painting.title}" class="painting-thumbnail">
                <img src="${originalSrc}" alt="${painting.title} (Original)" class="painting-original">
            </div>
            <div class="painting-info">
                <h4>${painting.title}</h4>
                <div class="painting-grade">Grade: ${painting.grade}</div>
            </div>
        `;
        paintingGallery.appendChild(paintingCard);
    });
    
    comparisonSection.classList.add('hidden');
    setResultsBarVisible(false);
    if (gradeDisplay) {
        gradeDisplay.classList.add('hidden');
    }
    finalResultsModal.classList.remove('hidden');
    gameActive = false;
}

function resetGame() {
    completedPaintings = [];
    allGrades = [];
    currentPaintingIndex = 0;
    if (finalResultsModal) {
        finalResultsModal.classList.add('hidden');
    }
    enterIdle();
}

if (restartGameBtn) {
    restartGameBtn.addEventListener('click', () => {
        resetGame();
    });
}

startGameBtn.addEventListener('click', async () => {
    if (!paintingLoaded) {
        phaseLabel.textContent = 'Loading reference...';
        return;
    }
    
    if (!checkHardwareAcceleration()) {
        showHardwareAccelerationModal();
        return;
    }
    
    startGameBtn.classList.add('hidden');
    gameActive = true;
    enterGameReady();
    
    startTeasingPhase();
});

peekBtn.addEventListener('click', doPeek);
finishBtn.addEventListener('click', finishGame);

const SMOOTHING_FACTOR = 0.9;
const MIN_DISTANCE_THRESHOLD = 0.05;
const HAND_SMOOTHING_FACTOR = 0.7;
const HAND_MIN_DISTANCE_THRESHOLD = 0.02;
const EYE_SMOOTHING_FACTOR = 0.8;
const EYE_MIN_DISTANCE_THRESHOLD = 0.03;
let faceMesh = null;
let hands = null;
let camera = null;
let handModeActive = false;
let eyeModeActive = false;
let lastNoseX = 0;
let lastNoseY = 0;
let lastHandX = 0;
let lastHandY = 0;
let lastEyeX = 0;
let lastEyeY = 0;
let handDrawing = false;
let noseDrawing = false;
let eyeDrawing = false;
let smoothedNoseX = 0;
let smoothedNoseY = 0;
let smoothedHandX = 0;
let smoothedHandY = 0;
let smoothedEyeX = 0;
let smoothedEyeY = 0;
let firstNoseDetection = true;
let firstEyeDetection = true;
let firstHandDetection = true;
let fistCooldownUntil = 0;
let extractedColors = [];

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
        .slice(0, 24)
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

function drawEyeDot(eyeX, eyeY) {
    if (!handWireframeCtx || handWireframeCanvas.classList.contains('hidden')) return;
    
    if (!noseModeActive) {
        handWireframeCtx.clearRect(0, 0, handWireframeCanvas.width, handWireframeCanvas.height);
    }
    handWireframeCtx.fillStyle = '#00ff00';
    handWireframeCtx.beginPath();
    handWireframeCtx.arc(
        eyeX * handWireframeCanvas.width,
        eyeY * handWireframeCanvas.height,
        6,
        0,
        2 * Math.PI
    );
    handWireframeCtx.fill();
}

function onFaceMeshResults(results) {
    if ((!noseModeActive && !eyeModeActive) || !inputEnabled) return;

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        
        if (noseModeActive) {
            drawNoseDot(landmarks[1]);
            const noseTip = landmarks[1];
        
            if (noseTip) {
            let noseX = noseTip.x;
            let noseY = noseTip.y;
            
            if (lastHandResults && lastHandResults.multiHandLandmarks && lastHandResults.multiHandLandmarks.length > 0) {
                const handLandmarks = lastHandResults.multiHandLandmarks[0];
                if (isHandCoveringNose(handLandmarks, noseX, noseY)) {
                    if (noseDrawing) {
                        ctx.beginPath();
                        noseDrawing = false;
                    }
                    return;
                }
            }
            
            noseX = Math.max(0, Math.min(1, noseX));
            noseY = Math.max(0, Math.min(1, noseY));
            
            if (firstNoseDetection) {
                smoothedNoseX = noseX;
                smoothedNoseY = noseY;
                firstNoseDetection = false;
                if (detectionWaitOverlay) {
                    detectionWaitOverlay.classList.add('hidden');
                }
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

            if (noseModeActive) updateCursor(constrainedX, constrainedY);
            }
        }
        
        if (eyeModeActive) {
            const leftEyeTop = landmarks[159];
            const leftEyeBottom = landmarks[145];
            const leftEyeOuter = landmarks[33];
            const leftEyeInner = landmarks[133];
            
            const rightEyeTop = landmarks[386];
            const rightEyeBottom = landmarks[374];
            const rightEyeOuter = landmarks[263];
            const rightEyeInner = landmarks[362];
            
            function calculateEAR(top, bottom, outer, inner) {
                const vertical1 = Math.sqrt(Math.pow(top.x - bottom.x, 2) + Math.pow(top.y - bottom.y, 2));
                const vertical2 = Math.sqrt(Math.pow(outer.x - inner.x, 2) + Math.pow(outer.y - inner.y, 2));
                const horizontal = Math.sqrt(Math.pow(outer.x - inner.x, 2) + Math.pow(outer.y - inner.y, 2));
                if (horizontal === 0) return 1;
                return (vertical1 + vertical2) / (2 * horizontal);
            }
            
            const leftEAR = calculateEAR(leftEyeTop, leftEyeBottom, leftEyeOuter, leftEyeInner);
            const rightEAR = calculateEAR(rightEyeTop, rightEyeBottom, rightEyeOuter, rightEyeInner);
            
            const EAR_THRESHOLD = 0.25;
            const leftEyeClosed = leftEAR < EAR_THRESHOLD;
            const rightEyeClosed = rightEAR < EAR_THRESHOLD;
            
            if (leftEyeClosed || rightEyeClosed) {
                if (eyeDrawing) {
                    ctx.beginPath();
                    eyeDrawing = false;
                }
                return;
            }
            
            const leftIris = landmarks[468];
            const rightIris = landmarks[473];
            
            let eyeX, eyeY;
            
            if (leftIris && rightIris) {
                eyeX = (leftIris.x + rightIris.x) / 2;
                eyeY = (leftIris.y + rightIris.y) / 2;
            } else if (leftEyeOuter && leftEyeInner && rightEyeOuter && rightEyeInner) {
                const leftEyeCenterX = (leftEyeOuter.x + leftEyeInner.x) / 2;
                const leftEyeCenterY = (leftEyeOuter.y + leftEyeInner.y) / 2;
                const rightEyeCenterX = (rightEyeOuter.x + rightEyeInner.x) / 2;
                const rightEyeCenterY = (rightEyeOuter.y + rightEyeInner.y) / 2;
                eyeX = (leftEyeCenterX + rightEyeCenterX) / 2;
                eyeY = (leftEyeCenterY + rightEyeCenterY) / 2;
            } else {
                return;
            }
            
            if (eyeX !== undefined && eyeY !== undefined) {
                drawEyeDot(eyeX, eyeY);
                
                let normalizedEyeX = Math.max(0, Math.min(1, eyeX));
                let normalizedEyeY = Math.max(0, Math.min(1, eyeY));
                
                if (firstEyeDetection) {
                    smoothedEyeX = normalizedEyeX;
                    smoothedEyeY = normalizedEyeY;
                    firstEyeDetection = false;
                    if (detectionWaitOverlay) {
                        detectionWaitOverlay.classList.add('hidden');
                    }
                } else {
                    smoothedEyeX = smoothedEyeX + EYE_SMOOTHING_FACTOR * (normalizedEyeX - smoothedEyeX);
                    smoothedEyeY = smoothedEyeY + EYE_SMOOTHING_FACTOR * (normalizedEyeY - smoothedEyeY);
                }
                
                const canvasAspect = canvas.width / canvas.height;
                const videoAspect = video.videoWidth / video.videoHeight;
                let mappedX = smoothedEyeX;
                let mappedY = smoothedEyeY;
                
                if (canvasAspect > videoAspect) {
                    const scale = videoAspect / canvasAspect;
                    const offset = (1 - scale) / 2;
                    mappedX = (smoothedEyeX - offset) / scale;
                    mappedY = smoothedEyeY;
                } else {
                    const scale = canvasAspect / videoAspect;
                    const offset = (1 - scale) / 2;
                    mappedX = smoothedEyeX;
                    mappedY = (smoothedEyeY - offset) / scale;
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
                    Math.pow(constrainedX - lastEyeX, 2) + 
                    Math.pow(constrainedY - lastEyeY, 2)
                );
                
                if (!eyeDrawing) {
                    if (lastEyeX === 0 && lastEyeY === 0) {
                        lastEyeX = constrainedX;
                        lastEyeY = constrainedY;
                    } else if (distance > EYE_MIN_DISTANCE_THRESHOLD * Math.min(canvas.width, canvas.height)) {
                        eyeDrawing = true;
                        startTimer();
                        ctx.beginPath();
                        ctx.moveTo(constrainedX, constrainedY);
                        lastEyeX = constrainedX;
                        lastEyeY = constrainedY;
                    }
                } else {
                    if (distance > 0.5) {
                        ctx.lineTo(constrainedX, constrainedY);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(constrainedX, constrainedY);
                        
                        lastEyeX = constrainedX;
                        lastEyeY = constrainedY;
                        updateCanvasVisibility();
                    }
                }
                
                if (currentTool === 'eraser') {
                    ctx.globalCompositeOperation = 'source-over';
                }
                
                if (eyeModeActive) updateCursor(constrainedX, constrainedY);
            }
        }
    } else {
        if (noseModeActive) {
            noseDrawing = false;
        }
        if (eyeModeActive) {
            eyeDrawing = false;
        }
        noseCursor.classList.add('hidden');
        if (handWireframeCtx) {
            handWireframeCtx.clearRect(0, 0, handWireframeCanvas.width, handWireframeCanvas.height);
        }
    }
}


function calculateCameraSize() {
    const canvasAspect = canvas.width / canvas.height;
    let camWidth = 640;
    let camHeight = 480;
    if (canvasAspect > (640 / 480)) {
        camHeight = Math.round(640 / canvasAspect);
    } else {
        camWidth = Math.round(480 * canvasAspect);
    }
    return { camWidth, camHeight };
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
        refineLandmarks: true,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3,
        selfieMode: true
    });

    faceMesh.onResults(onFaceMeshResults);
}

async function startNoseMode() {
    if (noseModeActive || !gameActive) return;

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

        const { camWidth, camHeight } = calculateCameraSize();
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

        if (!hands) {
            try {
                initializeHands();
            } catch (err) {
                console.warn('Could not initialize hands for nose mode:', err);
            }
        }
        
        let lastFaceSend = 0;
        let lastHandSend = 0;
        const FACE_SEND_THROTTLE = 33;
        const HAND_SEND_THROTTLE = 33;
        
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
                if (noseModeActive && hands) {
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
        canvas.style.pointerEvents = 'none';

        noseDrawing = false;
        smoothedNoseX = 0;
        smoothedNoseY = 0;
        lastNoseX = 0;
        lastNoseY = 0;
        firstNoseDetection = true;
        if (detectionWaitOverlay) {
            detectionWaitOverlay.classList.remove('hidden');
        }
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
    if (detectionWaitOverlay) {
        detectionWaitOverlay.classList.add('hidden');
    }
    if (eyeModeActive) return;

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

async function startEyeMode() {
    if (eyeModeActive || !gameActive) return;

    eyeModeActive = true;

    try {
        if (typeof Camera === 'undefined') {
            alert('MediaPipe libraries are loading. Please wait a moment and try again.');
            eyeModeActive = false;
            return;
        }

        if (!faceMesh) {
            initializeFaceMesh();
        }

        const { camWidth, camHeight } = calculateCameraSize();
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
                if (eyeModeActive && faceMesh) {
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

        eyeDrawing = false;
        smoothedEyeX = 0;
        smoothedEyeY = 0;
        lastEyeX = 0;
        lastEyeY = 0;
        firstEyeDetection = true;
        if (detectionWaitOverlay) {
            detectionWaitOverlay.classList.remove('hidden');
        }
    } catch (err) {
        eyeModeActive = false;
        console.error('Error accessing camera:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            alert('Camera access denied. Please allow camera permissions in your browser settings and try again.');
        } else {
            alert('Could not access camera: ' + err.message);
        }
    }
}

function stopEyeMode() {
    eyeModeActive = false;
    eyeDrawing = false;
    if (detectionWaitOverlay) {
        detectionWaitOverlay.classList.add('hidden');
    }
    if (noseModeActive) return;

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
    }
    noseCursor.classList.add('hidden');
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

let lastHandResults = null;

function isHandCoveringNose(handLandmarks, noseX, noseY) {
    if (!handLandmarks || handLandmarks.length < 21) return false;
    
    const COVERAGE_THRESHOLD = 0.15;
    
    for (let i = 0; i < handLandmarks.length; i++) {
        const landmark = handLandmarks[i];
        const distance = Math.sqrt(
            Math.pow(landmark.x - noseX, 2) + 
            Math.pow(landmark.y - noseY, 2)
        );
        if (distance < COVERAGE_THRESHOLD) {
            return true;
        }
    }
    return false;
}

function isFist(landmarks) {
    if (!landmarks || landmarks.length < 21) return false;
    
    const wrist = landmarks[0];
    const indexBase = landmarks[5];
    const pinkyBase = landmarks[17];
    const palmCenterX = (wrist.x + indexBase.x + pinkyBase.x) / 3;
    const palmCenterY = (wrist.y + indexBase.y + pinkyBase.y) / 3;
    
    const FIST_THRESHOLD = 0.15;
    
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    
    const thumbDist = Math.sqrt(Math.pow(thumbTip.x - palmCenterX, 2) + Math.pow(thumbTip.y - palmCenterY, 2));
    const indexDist = Math.sqrt(Math.pow(indexTip.x - palmCenterX, 2) + Math.pow(indexTip.y - palmCenterY, 2));
    const middleDist = Math.sqrt(Math.pow(middleTip.x - palmCenterX, 2) + Math.pow(middleTip.y - palmCenterY, 2));
    const ringDist = Math.sqrt(Math.pow(ringTip.x - palmCenterX, 2) + Math.pow(ringTip.y - palmCenterY, 2));
    const pinkyDist = Math.sqrt(Math.pow(pinkyTip.x - palmCenterX, 2) + Math.pow(pinkyTip.y - palmCenterY, 2));
    
    const thumbClosed = landmarks[4].y > landmarks[3].y || thumbDist < FIST_THRESHOLD;
    const indexClosed = landmarks[8].y > landmarks[6].y || indexDist < FIST_THRESHOLD;
    const middleClosed = landmarks[12].y > landmarks[10].y || middleDist < FIST_THRESHOLD;
    const ringClosed = landmarks[16].y > landmarks[14].y || ringDist < FIST_THRESHOLD;
    const pinkyClosed = landmarks[20].y > landmarks[18].y || pinkyDist < FIST_THRESHOLD;
    
    const closedCount = [thumbClosed, indexClosed, middleClosed, ringClosed, pinkyClosed].filter(Boolean).length;
    return closedCount >= 4;
}

function onHandResults(results) {
    lastHandResults = results;
    
    if (!handModeActive || !inputEnabled) return;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const indexFinger = landmarks[8];
        const fistDetected = isFist(landmarks);
        
        drawHandWireframe(landmarks, fistDetected);
        
        const now = Date.now();
        if (fistDetected) {
            if (handDrawing) {
                ctx.beginPath();
                handDrawing = false;
            }
            fistCooldownUntil = now + 2000;
            return;
        }
        
        if (now < fistCooldownUntil) {
            if (handDrawing) {
                ctx.beginPath();
                handDrawing = false;
            }
            return;
        }
        
        if (indexFinger) {
            let handX = 1 - indexFinger.x;
            let handY = indexFinger.y;
            
            handX = Math.max(0, Math.min(1, handX));
            handY = Math.max(0, Math.min(1, handY));
            
            if (firstHandDetection) {
                smoothedHandX = handX;
                smoothedHandY = handY;
                firstHandDetection = false;
                if (detectionWaitOverlay) {
                    detectionWaitOverlay.classList.add('hidden');
                }
            } else {
                smoothedHandX = smoothedHandX + HAND_SMOOTHING_FACTOR * (handX - smoothedHandX);
                smoothedHandY = smoothedHandY + HAND_SMOOTHING_FACTOR * (handY - smoothedHandY);
            }
            
            const canvasX = smoothedHandX * canvas.width;
            const canvasY = smoothedHandY * canvas.height;
            const constrainedX = Math.max(0, Math.min(canvas.width, canvasX));
            const constrainedY = Math.max(0, Math.min(canvas.height, canvasY));
            
            if (handModeActive) updateCursor(constrainedX, constrainedY);
            
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
                } else if (distance > HAND_MIN_DISTANCE_THRESHOLD * Math.min(canvas.width, canvas.height)) {
                    handDrawing = true;
                    startTimer();
                    ctx.beginPath();
                    ctx.moveTo(constrainedX, constrainedY);
                    lastHandX = constrainedX;
                    lastHandY = constrainedY;
                }
            } else {
                if (distance > 0.5) {
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
        if (handWireframeCtx && handWireframeCanvas) {
            handWireframeCtx.clearRect(0, 0, handWireframeCanvas.width, handWireframeCanvas.height);
        }
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
            const { camWidth, camHeight } = calculateCameraSize();
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
        if (detectionWaitOverlay) {
            detectionWaitOverlay.classList.remove('hidden');
        }
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
    if (detectionWaitOverlay && !noseModeActive && !eyeModeActive) {
        detectionWaitOverlay.classList.add('hidden');
    }
    
    if (camera && !noseModeActive && !eyeModeActive) {
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

setInputEnabled = function(enabled) {
    originalSetInputEnabled(enabled);
    if (!enabled && !gameActive) {
        if (noseModeActive) stopNoseMode();
        if (handModeActive) stopHandMode();
        if (eyeModeActive) stopEyeMode();
    }
};

const storyModal = document.getElementById('storyModal');
const storyNextBtn = document.getElementById('storyNextBtn');
const storyTitle = document.getElementById('storyTitle');
const storyParagraph = document.getElementById('storyParagraph');
const storyImage = document.getElementById('storyImage');

const dialogueScript = [
    { title: 'The Grand Museum Heist', text: 'Our museum was robbed!', image: 'images/museum1.png' },
    { title: '', text: 'While we\'re figuring out how to recover our jewels...', image: 'images/museum2.png' },
    { title: '', text: '...you will be forced to make our masterpieces (with a few twists)!', image: 'images/museum3.png' },
    { title: '', html: '(by the way, did you know the <a href="https://news.ycombinator.com/item?id=45803302" target="_blank" class="story-link">louvre\'s system password was "louvre"</a>?)' },
    { title: '', text: 'Begin your quest, brave artist!', image: 'images/museum6.png' }
];

const handStoryScript = [
    { title: '', text: 'oh no! the mighty snek ate your mouse!', image: 'images/hand1.png' },
    { title: '', text: 'I guess you are forced to use your hand now, track your index finger to move the cursor.', image: 'images/hand2.png' }
];

const noseStoryScript = [
    { title: '', text: 'the snek bit your arm!!!!', image: 'images/nose1.png' },
    { title: '', text: 'while the antivenom is being administered, you will draw with your face.', image: 'images/facetrack.png' }
];

const eyesStoryScript = [
    { title: '', text: 'got your nose!', image: 'images/eyes1.png' },
    { title: '', text: 'you will now use your eyes.', image: 'images/eyes2.png' }
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

    let dialogue = null;
    if (handStoryCallback !== null) {
        dialogue = handStoryScript[handStoryIndex];
    } else if (noseStoryCallback !== null) {
        dialogue = noseStoryScript[noseStoryIndex];
    } else if (eyesStoryCallback !== null) {
        dialogue = eyesStoryScript[eyesStoryIndex];
    } else {
        dialogue = dialogueScript[currentDialogueIndex];
    }
    
    if (!dialogue) return;
    
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
    if (handStoryCallback !== null) {
        if (isTyping) {
            skipTyping();
            return;
        }
        handStoryIndex++;
        showHandStoryDialogue(handStoryIndex);
        return;
    }
    
    if (noseStoryCallback !== null) {
        if (isTyping) {
            skipTyping();
            return;
        }
        noseStoryIndex++;
        showNoseStoryDialogue(noseStoryIndex);
        return;
    }
    
    if (eyesStoryCallback !== null) {
        if (isTyping) {
            skipTyping();
            return;
        }
        eyesStoryIndex++;
        showEyesStoryDialogue(eyesStoryIndex);
        return;
    }
    
    if (isTyping) {
        skipTyping();
        return;
    }
    
    currentDialogueIndex++;
    showDialogue(currentDialogueIndex);
});

storyModal.addEventListener('click', (e) => {
    if (e.target === storyModal || e.target === storyModal.querySelector('.story-content')) {
        if (handStoryCallback !== null) {
            if (isTyping) {
                skipTyping();
            } else if (!storyNextBtn.classList.contains('hidden')) {
                handStoryIndex++;
                showHandStoryDialogue(handStoryIndex);
            }
            return;
        }
        
        if (noseStoryCallback !== null) {
            if (isTyping) {
                skipTyping();
            } else if (!storyNextBtn.classList.contains('hidden')) {
                noseStoryIndex++;
                showNoseStoryDialogue(noseStoryIndex);
            }
            return;
        }
        
        if (eyesStoryCallback !== null) {
            if (isTyping) {
                skipTyping();
            } else if (!storyNextBtn.classList.contains('hidden')) {
                eyesStoryIndex++;
                showEyesStoryDialogue(eyesStoryIndex);
            }
            return;
        }
        
        if (isTyping) {
            skipTyping();
        } else if (!storyNextBtn.classList.contains('hidden')) {
            currentDialogueIndex++;
            showDialogue(currentDialogueIndex);
        }
    }
});

let handStoryIndex = 0;
let handStoryCallback = null;
let noseStoryIndex = 0;
let noseStoryCallback = null;
let eyesStoryIndex = 0;
let eyesStoryCallback = null;

function showHandStory(callback) {
    handStoryCallback = callback;
    handStoryIndex = 0;
    storyModal.classList.remove('hidden');
    container.classList.remove('visible');
    showHandStoryDialogue(0);
}

function showNoseStory(callback) {
    noseStoryCallback = callback;
    noseStoryIndex = 0;
    storyModal.classList.remove('hidden');
    container.classList.remove('visible');
    showNoseStoryDialogue(0);
}

function showEyesStory(callback) {
    eyesStoryCallback = callback;
    eyesStoryIndex = 0;
    storyModal.classList.remove('hidden');
    container.classList.remove('visible');
    showEyesStoryDialogue(0);
}

function showHandStoryDialogue(index) {
    if (index >= handStoryScript.length) {
        storyModal.classList.add('hidden');
        container.classList.add('visible');
        const callback = handStoryCallback;
        handStoryCallback = null;
        if (callback) {
            callback();
        }
        return;
    }
    
    const dialogue = handStoryScript[index];
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

function showNoseStoryDialogue(index) {
    if (index >= noseStoryScript.length) {
        storyModal.classList.add('hidden');
        container.classList.add('visible');
        const callback = noseStoryCallback;
        noseStoryCallback = null;
        if (callback) {
            callback();
        }
        return;
    }
    
    const dialogue = noseStoryScript[index];
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

function showEyesStoryDialogue(index) {
    if (index >= eyesStoryScript.length) {
        storyModal.classList.add('hidden');
        container.classList.add('visible');
        const callback = eyesStoryCallback;
        eyesStoryCallback = null;
        if (callback) {
            callback();
        }
        return;
    }
    
    const dialogue = eyesStoryScript[index];
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