


chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "close_tab") {
        chrome.tabs.remove(sender.tab.id);
    } else if (request.action === "new_tab") {
        chrome.tabs.create({});
    } else if (request.action === "go_back") {
        chrome.tabs.goBack(sender.tab.id).catch(() => { /* Ignore if no history */ });
    } else if (request.action === "go_forward") {
        chrome.tabs.goForward(sender.tab.id).catch(() => { /* Ignore if no history */ });
    } else if (request.action === "restore_tab") {
        chrome.sessions.restore();
    } else if (request.action === "reload") {
        chrome.tabs.reload(sender.tab.id);
    } else if (request.action === "reload_bypass_cache") {
        chrome.tabs.reload(sender.tab.id, { bypassCache: true });
    } else if (request.action === "activate_left_tab") {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
            const activeTab = tabs.find(t => t.active);
            if (!activeTab) return;
            let newIndex = activeTab.index - 1;
            if (newIndex < 0) newIndex = tabs.length - 1; // Wrap around
            const target = tabs.find(t => t.index === newIndex);
            if (target) chrome.tabs.update(target.id, { active: true });
        });
    } else if (request.action === "activate_right_tab") {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
            const activeTab = tabs.find(t => t.active);
            if (!activeTab) return;
            let newIndex = activeTab.index + 1;
            if (newIndex >= tabs.length) newIndex = 0; // Wrap around
            const target = tabs.find(t => t.index === newIndex);
            if (target) chrome.tabs.update(target.id, { active: true });
        });
    }
});
