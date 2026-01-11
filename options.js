


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
    "activate_left_tab": "Go to Left Tab",
    "activate_right_tab": "Go to Right Tab",
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
            const gesture = els.detectedInput.dataset.code;
            const action = els.actionSelect.value;

            if (!gesture || !action) return;

            currentActions[gesture] = action;
            const updateObj = {};
            updateObj[gesture] = action;

            chrome.storage.sync.set(updateObj, () => {
                renderGestureList();
                showToast("Gesture added successfully!", "success");

                // Reset Form
                els.detectedInput.innerHTML = "";
                delete els.detectedInput.dataset.code;
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
            // Read-only logic is now handled by the div nature
            els.detectedInput.dataset.placeholder = "Draw gesture to record ->";
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

        const fragment = document.createDocumentFragment();

        keys.forEach(gesture => {
            const actionKey = currentActions[gesture];
            const actionLabel = actionLabels[actionKey] || actionKey;

            const tr = document.createElement('tr');

            const tdGesture = document.createElement('td');
            const spanBadge = document.createElement('span');
            spanBadge.className = 'gesture-badge';
            spanBadge.innerHTML = gestureToIconsHTML(gesture);
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
            deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>';
            tdBtn.appendChild(deleteBtn);
            tr.appendChild(tdBtn);

            fragment.appendChild(tr);
        });

        els.gestureListBody.appendChild(fragment);

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const g = e.currentTarget.getAttribute('data-gesture'); // Use currentTarget to get the button element consistently
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
    const gesture = els.detectedInput.dataset.code;
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
            // Icon logic: If effective theme is dark, show Sun (to switch to light). If light, show Moon.
            const sunIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
            const moonIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';

            iconSpan.innerHTML = (effectiveTheme === 'dark') ? sunIcon : moonIcon;
            iconSpan.style.display = 'flex'; // Ensure alignment
        }
    }
}


function showToast(text, type) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    const icon = type === 'success'
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
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
                overlayResult.innerHTML = gestureToIconsHTML(gesture);
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
            els.detectedInput.innerHTML = gestureToIconsHTML(rawCode);
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


const ICONS = {
    L: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="gesture-icon"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>',
    R: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="gesture-icon"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
    U: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="gesture-icon"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>',
    D: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="gesture-icon"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>'
};

function gestureToIconsHTML(gesture) {
    if (!gesture) return "";
    return gesture.split('').map(char => {
        // Only allow predefined icons (L, R, U, D) to be inserted as HTML.
        // Everything else is ignored to prevent XSS and ensure clean UI.
        return ICONS[char] || "";
    }).join('');
}


