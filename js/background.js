/**
 * Listens for clicks on the extension's icon and opens the app.html page in a new tab.
 * @param {chrome.tabs.Tab} tab The tab that was active when the extension icon was clicked.
 */
chrome.action.onClicked.addListener(function (tab) {
    chrome.tabs.create({ url: "app.html" });
});

/**
 * Listens for the extension's installation and opens a GitHub page in a new tab.
 * @param {chrome.runtime.InstalledDetails} details Details about the installation.
 */
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        chrome.tabs.create({ url: "https://github.com/YadaGiriReddy/Bulk-URL-Opener" });
    }
});

/**
 * Listens for messages from other parts of the extension and handles them.
 * Specifically, it handles the "open" method to open a URL in a new tab.
 * @param {any} request The message request object.
 * @param {chrome.runtime.MessageSender} sender Information about the sender of the message.
 * @param {function} sendResponse Function to send a response back to the sender.
 * @returns {boolean} Returns true to indicate that the response will be sent asynchronously.
 */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.method === "open") {
        const link = request.link;
        const focus = request.focus;

        /**
         * Creates a new tab with the specified URL and focus, and sends a response with the tab ID or error.
         */
        chrome.tabs.create({ url: link, active: focus }, function (tab) {
            if (chrome.runtime.lastError) {
                console.error("Error opening tab:", chrome.runtime.lastError);
                sendResponse({ error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ tabId: tab.id });
            }
        });
        // Indicate that the response will be sent asynchronously.
        return true;
    } else {
        // Indicate that the response will be sent asynchronously.
        return true;
    }
});
