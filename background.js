


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
    }
});
