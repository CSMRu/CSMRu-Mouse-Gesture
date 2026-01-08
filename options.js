


const defaultActions = {
    "L": "go_back",
    "R": "go_forward",
    "LR": "reload",
    "RL": "reload_bypass_cache",
    "LURDL": "restore_tab"
};

const defaultVisuals = {
    "lineColor": "#3b82f6",
    "lineWidth": 4,
    "fontSize": 16,
    "theme": "system"
};

const actionLabels = {
    "go_back": "Go Back",
    "go_forward": "Go Forward",
    "new_tab": "Open New Tab",
    "restore_tab": "Reopen Closed Tab",
    "reload": "Reload Page",
    "reload_bypass_cache": "Reload (Bypass Cache)",
    "close_tab": "Close Current Tab",
    "scroll_top": "Scroll to Top",
    "scroll_bottom": "Scroll to Bottom",
    "scroll_up": "Scroll Up (Page)",
    "scroll_down": "Scroll Down (Page)"
};


let currentActions = {};
let currentVisuals = {};


const els = {
    detectedInput: document.getElementById('detected-gesture'),
    actionSelect: document.getElementById('action-select'),
    addButton: document.getElementById('add-gesture'),
    msgDiv: document.getElementById('message'),
    colorInput: document.getElementById('line-color'),
    widthInput: document.getElementById('line-width'),
    widthVal: document.getElementById('width-val'),
    fontSizeInput: document.getElementById('font-size'),
    fontSizeVal: document.getElementById('font-size-val'),
    saveVisualsBtn: document.getElementById('save-visuals'),
    btnLight: document.getElementById('btn-light'),
    btnDark: document.getElementById('btn-dark'),
    resetAllBtn: document.getElementById('reset-all-settings'),
    gestureListBody: document.querySelector('#gesture-list tbody'),
    emptyMsg: document.getElementById('empty-msg')
};



document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    attachEventListeners();
    initFullscreenRecording();
});


function loadSettings() {
    chrome.storage.sync.get(null, (items) => {
        // First run initialization
        if (Object.keys(items).length === 0) {
            items = { ...defaultActions, ...defaultVisuals };
            chrome.storage.sync.set(items);
        }

        currentActions = {};
        currentVisuals = {};

        // Separate Settings
        for (let key in items) {
            if (key in defaultVisuals) {
                currentVisuals[key] = items[key];
            } else {
                currentActions[key] = items[key];
            }
        }

        updateUI();
    });
}


function updateUI() {
    // Update Visual Inputs
    if (els.colorInput && currentVisuals.lineColor) {
        els.colorInput.value = currentVisuals.lineColor;
        if (els.colorInput.parentElement) {
            els.colorInput.parentElement.style.backgroundColor = currentVisuals.lineColor;
        }
    }

    if (els.widthInput && currentVisuals.lineWidth) {
        els.widthInput.value = currentVisuals.lineWidth;
        els.widthVal.textContent = currentVisuals.lineWidth;
    }

    if (els.fontSizeInput && currentVisuals.fontSize) {
        els.fontSizeInput.value = currentVisuals.fontSize;
        els.fontSizeVal.textContent = currentVisuals.fontSize;
    }

    // Apply Theme
    applyTheme(currentVisuals.theme || 'system');

    // Render List
    renderGestureList();
}


function attachEventListeners() {

    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            // Simple toggle logic based on current state class
            const isDark = document.body.classList.contains('dark-theme');
            setTheme(isDark ? 'light' : 'dark');
        });
    }


    if (els.colorInput) {
        els.colorInput.addEventListener('input', (e) => {
            if (els.colorInput.parentElement) {
                els.colorInput.parentElement.style.backgroundColor = e.target.value;
            }
        });
    }
    if (els.widthInput) {
        els.widthInput.addEventListener('input', (e) => els.widthVal.textContent = e.target.value);
    }
    if (els.fontSizeInput) {
        els.fontSizeInput.addEventListener('input', (e) => els.fontSizeVal.textContent = e.target.value);
    }


    if (els.saveVisualsBtn) {
        els.saveVisualsBtn.addEventListener('click', () => {
            const newVisuals = {
                lineColor: els.colorInput.value,
                lineWidth: parseInt(els.widthInput.value, 10),
                fontSize: parseInt(els.fontSizeInput.value, 10),
                theme: currentVisuals.theme || 'system'
            };

            // Validate
            if (isNaN(newVisuals.lineWidth)) newVisuals.lineWidth = 4;
            if (isNaN(newVisuals.fontSize)) newVisuals.fontSize = 16;

            chrome.storage.sync.set(newVisuals, () => {
                currentVisuals = { ...currentVisuals, ...newVisuals }; // Update local state immediately
                showToast("Visual settings saved!", "success");
            });
        });
    }


    if (els.actionSelect) els.actionSelect.addEventListener('change', checkAddValidity);
    if (els.addButton) {
        els.addButton.addEventListener('click', () => {
            const gesture = els.detectedInput.dataset.code || els.detectedInput.value;
            const action = els.actionSelect.value;

            if (!gesture || !action) return;

            currentActions[gesture] = action;
            const updateObj = {};
            updateObj[gesture] = action;

            chrome.storage.sync.set(updateObj, () => {
                renderGestureList();
                showToast("Gesture added successfully!", "success");

                // Reset Form
                els.detectedInput.value = "";
                els.actionSelect.value = "";
                els.addButton.disabled = true;
            });
        });
    }


    if (els.resetAllBtn) {
        els.resetAllBtn.addEventListener('click', () => {
            if (confirm("Are you sure? This will delete all custom gestures and reset settings.")) {
                chrome.storage.sync.clear(() => {
                    chrome.storage.sync.set({ ...defaultActions, ...defaultVisuals }, () => {
                        location.reload();
                    });
                });
            }
        });
        // Manual Input Disabled
        if (els.detectedInput) {
            els.detectedInput.readOnly = true;
            els.detectedInput.placeholder = "Draw gesture to record ->";
        }
    }
}



function renderGestureList() {
    if (!els.gestureListBody) return;

    els.gestureListBody.innerHTML = '';
    const keys = Object.keys(currentActions);

    if (keys.length === 0) {
        if (els.emptyMsg) els.emptyMsg.style.display = 'block';
    } else {
        if (els.emptyMsg) els.emptyMsg.style.display = 'none';

        keys.forEach(gesture => {
            const actionKey = currentActions[gesture];
            const actionLabel = actionLabels[actionKey] || actionKey;

            const tr = document.createElement('tr');

            const tdGesture = document.createElement('td');
            const spanBadge = document.createElement('span');
            spanBadge.className = 'gesture-badge';
            spanBadge.textContent = gestureToArrows(gesture);
            tdGesture.appendChild(spanBadge);
            tr.appendChild(tdGesture);

            const tdAction = document.createElement('td');
            tdAction.textContent = actionLabel;
            tr.appendChild(tdAction);

            const tdBtn = document.createElement('td');
            tdBtn.style.textAlign = 'right';
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete';
            deleteBtn.setAttribute('data-gesture', gesture);
            deleteBtn.textContent = 'Delete';
            tdBtn.appendChild(deleteBtn);
            tr.appendChild(tdBtn);

            els.gestureListBody.appendChild(tr);
        });


        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const g = e.target.getAttribute('data-gesture');
                delete currentActions[g];

                chrome.storage.sync.remove(g, () => {
                    renderGestureList();
                    showToast("Gesture deleted", "success");
                });
            });
        });
    }
}

function checkAddValidity() {
    const gesture = els.detectedInput.dataset.code || els.detectedInput.value;
    const action = els.actionSelect.value;
    const isValid = gesture && gesture !== "..." && gesture !== "Too Short / Invalid" && action;
    els.addButton.disabled = !isValid;
}

function setTheme(theme) {
    currentVisuals.theme = theme;
    applyTheme(theme);
    chrome.storage.sync.set({ theme: theme });
}

function applyTheme(theme) {
    let effectiveTheme = theme;
    if (!effectiveTheme || effectiveTheme === 'system') {
        effectiveTheme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }

    const body = document.body;
    body.classList.remove('dark-theme');
    if (effectiveTheme === 'dark') body.classList.add('dark-theme');

    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        // Icon logic: If effective theme is dark, show Sun (to switch to light). If light, show Moon.
        const iconSpan = btn.querySelector('.icon');
        if (iconSpan) {
            iconSpan.textContent = (effectiveTheme === 'dark') ? '☀️' : '🌙';
        }
    }
}


function showToast(text, type) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    const icon = type === 'success' ? '✅' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${text}</span>`;

    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}




function initFullscreenRecording() {
    const startRecBtn = document.getElementById('start-recording-btn');
    const overlay = document.getElementById('recording-overlay');
    const fullCanvas = document.getElementById('fullscreen-canvas');
    if (!startRecBtn || !overlay || !fullCanvas) return;

    const fullCtx = fullCanvas.getContext('2d');
    const overlayResult = document.getElementById('overlay-result');
    const confirmBtn = document.getElementById('confirm-recording');
    const cancelBtn = document.getElementById('cancel-recording');
    const resetBtn = document.getElementById('reset-recording');

    let isRecDrawing = false;
    let recPath = [];


    function resizeFullCanvas() {
        fullCanvas.width = window.innerWidth;
        fullCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeFullCanvas);


    startRecBtn.addEventListener('click', () => {
        overlay.classList.remove('hidden');
        resizeFullCanvas();
        resetOverlay();
    });


    cancelBtn.addEventListener('click', () => overlay.classList.add('hidden'));


    resetBtn.addEventListener('click', resetOverlay);
    function resetOverlay() {
        fullCtx.clearRect(0, 0, fullCanvas.width, fullCanvas.height);
        overlayResult.textContent = "...";
        recPath = [];
        confirmBtn.disabled = true;
    }


    window.addEventListener('mousedown', (e) => {
        if (overlay.classList.contains('hidden')) return;
        if (e.button === 2) { // Right Click
            isRecDrawing = true;
            recPath = [{ x: e.clientX, y: e.clientY }];

            fullCtx.clearRect(0, 0, fullCanvas.width, fullCanvas.height);
            fullCtx.beginPath();
            fullCtx.moveTo(e.clientX, e.clientY);
            fullCtx.lineWidth = currentVisuals.lineWidth || 4;
            fullCtx.strokeStyle = currentVisuals.lineColor || '#3b82f6';
            fullCtx.lineCap = 'round';

            overlayResult.textContent = "Drawing...";
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isRecDrawing) return;
        fullCtx.lineTo(e.clientX, e.clientY);
        fullCtx.stroke();
        recPath.push({ x: e.clientX, y: e.clientY });
    });

    window.addEventListener('mouseup', (e) => {
        if (!isRecDrawing) return;
        if (e.button === 2) {
            isRecDrawing = false;

            // Analyze
            const gesture = analyzeGesture(recPath);
            if (gesture) {
                overlayResult.textContent = gestureToArrows(gesture);
                overlayResult.dataset.code = gesture;
                confirmBtn.disabled = false;
            } else {
                overlayResult.textContent = "Too Short / Invalid";
                confirmBtn.disabled = true;
            }
        }
    });


    window.addEventListener('contextmenu', (e) => {
        if (!overlay.classList.contains('hidden')) {
            e.preventDefault();
        }
    });


    confirmBtn.addEventListener('click', () => {
        const rawCode = overlayResult.dataset.code;
        if (rawCode && !confirmBtn.disabled) {
            els.detectedInput.value = gestureToArrows(rawCode);
            els.detectedInput.dataset.code = rawCode;
            checkAddValidity();
            overlay.classList.add('hidden');
        }
    });
}


function analyzeGesture(points) {
    let minGestureLength = 20;
    if (points.length < 2) return null;

    let totalDist = 0;
    for (let i = 1; i < points.length; i++) {
        totalDist += Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y);
    }
    if (totalDist < minGestureLength) return null;

    const SUSTAIN_pixels = 10;
    let simplified = [];
    let currentDir = "";
    let currentLen = 0;

    for (let i = 1; i < points.length; i++) {
        let dx = points[i].x - points[i - 1].x;
        let dy = points[i].y - points[i - 1].y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        let dir = "";
        if (Math.abs(dx) > Math.abs(dy)) dir = dx > 0 ? "R" : "L";
        else dir = dy > 0 ? "D" : "U";

        if (dir === currentDir) {
            currentLen += dist;
        } else {
            if (currentLen > SUSTAIN_pixels) {
                if (simplified.length === 0 || simplified[simplified.length - 1] !== currentDir) {
                    simplified.push(currentDir);
                }
            }
            currentDir = dir;
            currentLen = 0;
        }
    }
    if (currentLen > SUSTAIN_pixels) {
        if (simplified.length === 0 || simplified[simplified.length - 1] !== currentDir) {
            simplified.push(currentDir);
        }
    }

    return simplified.join("");
}


function gestureToArrows(gesture) {
    if (!gesture) return "";
    return gesture
        .replace(/L/g, "⬅️")
        .replace(/R/g, "➡️")
        .replace(/U/g, "⬆️")
        .replace(/D/g, "⬇️");
}


function arrowsToGesture(input) {
    if (!input) return "";
    return input
        .replace(/⬅️/g, "L")
        .replace(/➡️/g, "R")
        .replace(/⬆️/g, "U")
        .replace(/⬇️/g, "D")
        .replace(/[^LRUD]/gi, "") // Remove anything else
        .toUpperCase();
}
