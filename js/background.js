chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.query({currentWindow: true}, function (tab) {
        chrome.tabs.create({ url: "app.html" }, function (tab) { });
    });
});

chrome.runtime.onInstalled.addListener(function (tab) {
    chrome.tabs.create({url: "https://github.com/YadaGiriReddy/Bulk-URL-Opener"}, function (tab) { });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.method == "open") {
        var link = request.link;
        var focus = request.focus;

        console.log(link);
        chrome.tabs.create({ url: link, active: focus });
    }
    return true;
});