


let minGestureLength = 20; // Sensitivity threshold for gesture detection

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

const defaultVisuals = {
    "lineColor": "#3b82f6",
    "lineWidth": 4,
    "fontSize": 16
};


let isGesturing = false;
let startX, startY;
let path = [];
let actions = {};
let visuals = { ...defaultVisuals };


let canvas, ctx;
let previewEl;




function loadSettings() {
    chrome.storage.sync.get(null, (items) => {
        visuals = { ...defaultVisuals }; // Reset to defaults first
        actions = {};

        for (let key in items) {
            if (key === 'lineColor' || key === 'lineWidth' || key === 'fontSize' || key === 'theme') {
                visuals[key] = items[key];
            } else {
                // Assume it's a gesture action
                actions[key] = items[key];
            }
        }
    });
}


loadSettings();


chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let key in changes) {
        const newVal = changes[key].newValue;

        if (key === 'lineColor' || key === 'lineWidth' || key === 'fontSize') {
            visuals[key] = newVal;
            if (key === 'fontSize' && previewEl) {
                previewEl.style.fontSize = newVal + 'px';
            }
        } else if (key === 'theme') {
            // Theme doesn't affect content script much usually, but store it
            visuals.theme = newVal;
        } else {
            // It's an action
            if (newVal) {
                actions[key] = newVal;
            } else {
                delete actions[key];
            }
        }
    }
});




function initCanvas() {
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'gesture-canvas';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');
    }
    // Always resize on start to match current window
    resizeCanvas();

    // Set styles once after resize (which resets context)
    if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineWidth = visuals.lineWidth || 4;
        ctx.strokeStyle = visuals.lineColor || '#3b82f6';
    }

    canvas.style.display = 'block';

    // Init Preview Element
    if (!previewEl) {
        previewEl = document.createElement('div');
        previewEl.id = 'gesture-preview';
        previewEl.style.position = 'fixed';
        previewEl.style.transform = 'translate(-50%, -50%)';
        previewEl.style.padding = '8px 16px';
        previewEl.style.background = 'rgba(0, 0, 0, 0.7)';
        previewEl.style.color = 'white';
        previewEl.style.borderRadius = '20px';
        previewEl.style.fontSize = (visuals.fontSize || 16) + 'px'; // Dynamic font size
        previewEl.style.fontWeight = 'bold'; // Bold font
        previewEl.style.pointerEvents = 'none';
        previewEl.style.zIndex = '2147483648'; // Above canvas
        previewEl.style.display = 'none';
        previewEl.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        document.body.appendChild(previewEl);
    }
}


function resizeCanvas() {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}


function clearCanvas() {
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (canvas) {
        canvas.style.display = 'none';
        // Free GPU memory by shrinking canvas buffer. 
        // Keeping it at 0x0 or 1x1 releases the backing store.
        canvas.width = 1;
        canvas.height = 1;
    }
    if (previewEl) {
        previewEl.style.display = 'none';
        previewEl.innerText = "";
    }
}


function drawLine(p1, p2) {
    if (!ctx) return;
    ctx.beginPath();
    // Context styles are already set in initCanvas
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
}


function updatePreview(currentX, currentY) {
    if (!previewEl) return;

    // Position preview near mouse but slightly offset
    previewEl.style.left = currentX + 'px'; // Center horizontally on mouse
    previewEl.style.top = (currentY - 50) + 'px'; // Above mouse

    // Analyze current path
    const gestureString = analyzeGesture(path);
    if (gestureString) {
        const actionKey = actions[gestureString];
        if (actionKey) {
            const label = actionLabels[actionKey] || actionKey;
            previewEl.innerText = label;
            previewEl.style.opacity = '1';
        } else {
            previewEl.innerText = "No action";
            previewEl.style.opacity = '0.8';
            previewEl.style.color = '#ccc';
        }
        previewEl.style.display = 'block';
        previewEl.style.borderColor = visuals.lineColor || 'transparent'; // Optional hint
    } else {
        previewEl.style.display = 'none';
    }
}




document.addEventListener('mousedown', (e) => {
    if (e.button === 2) { // Right click
        isGesturing = true;
        startX = e.clientX;
        startY = e.clientY;
        path = [{ x: startX, y: startY }];
        initCanvas();
    }
});


let animationFrameId;

document.addEventListener('mousemove', (e) => {
    if (!isGesturing) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    // Always record high-precision path for accuracy
    path.push({ x: currentX, y: currentY });

    // Request a frame if not already requested
    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(() => {
            if (!isGesturing) {
                animationFrameId = null;
                return;
            }
            // Update preview only on animation frames to save CPU
            updatePreview(currentX, currentY);
            animationFrameId = null;
        });
    }

    // Immediate drawing for minimized input lag (zero-latency feel)
    if (path.length > 1) {
        drawLine(path[path.length - 2], { x: currentX, y: currentY });
    }
});


let blockContextMenu = false;


document.addEventListener('mouseup', (e) => {
    if (!isGesturing) return;
    if (e.button === 2) {
        isGesturing = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        const gestureString = analyzeGesture(path);
        clearCanvas();

        if (gestureString) {
            // Valid gesture shape drawn
            blockContextMenu = true;

            // Trigger action logic
            const actionKey = actions[gestureString];
            if (actionKey) {
                console.log("Detected gesture:", gestureToArrows(gestureString), actionKey);
                triggerAction(gestureString);
            } else {
                console.log("Unregistered gesture:", gestureToArrows(gestureString));
            }

            // Reset flag after short delay to be safe
            setTimeout(() => { blockContextMenu = false; }, 100);
        } else if (path.length > 10) {
            // Not a valid gesture but moved enough to be intentional drag
            blockContextMenu = true;
            setTimeout(() => { blockContextMenu = false; }, 100);
        }
    }
});


document.addEventListener('contextmenu', (e) => {
    if (isGesturing || blockContextMenu) {
        e.preventDefault();
        blockContextMenu = false; // Consume flag
    }
});




function triggerAction(gesture) {
    let action = actions[gesture];
    if (action) {
        if (action === "scroll_top") {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (action === "scroll_bottom") {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        } else if (action === "scroll_up") {
            window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
        } else if (action === "scroll_down") {
            window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
        } else {
            chrome.runtime.sendMessage({ action: action });
        }
    }
}


function analyzeGesture(points) {
    if (points.length < 2) return null;

    let totalDist = 0;
    for (let i = 1; i < points.length; i++) {
        totalDist += Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y);
    }
    if (totalDist < minGestureLength) return null;

    const SUSTAIN_pixels = 10; // Match options.js sensitivity
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
    // Flush last
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
