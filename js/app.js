// DOM Elements
const extensionContainer = document.querySelector("#extension-container");
const focusTabsToggle = document.querySelector("#focusTabs");
const urlListTextarea = document.querySelector("#urlList");
const progressBar = document.querySelector(".progress-bar");
const openDelayValueLbl = document.querySelector("#openDelayValue");
const openDelayRangeSelector = document.querySelector("#openDelayRange");
const openUrlListBtn = document.querySelector("#openUrlList");
const stopUrlListBtn = document.querySelector("#stopUrlList");
const getTabUrlListBtn = document.querySelector("#getTabUrlList");
const clearUrlListBtn = document.querySelector("#clearUrlList");
const saveConfigurationBtn = document.querySelector("#saveConfiguration");
const advancedSettingsBtn = document.querySelector("#advancedSettings");
const urlListCombo = document.querySelector("#urlListCombo");
const loadListBtn = document.querySelector("#loadList");
const editListBtn = document.querySelector("#editList");
const updateListBtn = document.querySelector("#updateList");
const deleteListBtn = document.querySelector("#deleteList");
const listNameTxt = document.querySelector("#listName");
const saveListBtn = document.querySelector("#saveList");
const alertCloseBtn = document.querySelector("#alertClose");
const urlOpenStatusCont = document.querySelector("#urlOpenStatusContainer");
const urlListStatusCont = document.querySelector("#urlListStatusContainer");

// Global Variables
let timeouts = [];
let actualUrlsCount = 0;
let openedUrlsCount = 0;

// -----------------------------------------------------------------------------
// Event Listeners
// -----------------------------------------------------------------------------

/**
 * Listens for changes to the dark mode toggle checkbox and updates the theme accordingly.
 * When the toggle state changes, the 'toggleDarkMode' function is invoked to apply or remove the dark theme.
 */
darkModeToggle.addEventListener('change', () => {
    toggleDarkMode();
});

/**
 * Updates the open delay value label when the range selector is changed.
 */
openDelayRangeSelector.addEventListener('input', () => {
    openDelayValueLbl.innerHTML = openDelayRangeSelector.value;
});

/**
 * Retrieves URLs from open tabs and populates the URL list textarea.
 */
getTabUrlListBtn.addEventListener('click', () => {
    getTabUrlsIntoTextArea();
});

/**
 * Clears the URL list textarea.
 */
clearUrlListBtn.addEventListener('click', () => {
    clearUrlList();
});

/**
 * Saves the current configuration settings.
 */
saveConfigurationBtn.addEventListener('click', () => {
    saveConfiguration();
});

/**
 * Loads the selected URL list into the textarea.
 */
loadListBtn.addEventListener('click', () => {
    loadSelectedUrlList();
});

/**
 * Enables editing of the selected URL list.
 */
editListBtn.addEventListener('click', () => {
    editSelectedUrlList();
});

/**
 * Updates the selected URL list with the contents of the textarea.
 */
updateListBtn.addEventListener('click', () => {
    updateSelectedUrlList();
});

/**
 * Deletes the selected URL list.
 */
deleteListBtn.addEventListener('click', () => {
    deleteSelectedUrlList();
});

/**
 * Saves the URLs in the textarea as a new list.
 */
saveListBtn.addEventListener('click', () => {
    saveUrlsAsList();
});

/**
 * Starts the process of opening URLs from the list.
 */
openUrlListBtn.addEventListener('click', () => {
    if (urlListTextarea.value.trim().length > 0) {
        startUrlOpeningProcess();
    } else {
        urlListTextarea.classList.add("is-invalid");
        progressBar.parentElement.setAttribute("hidden", true);
        hideResults();
    }
}, false);

/**
 * Stops the URL opening process, clearing timeouts and resetting UI elements.
 */
stopUrlListBtn.addEventListener('click', () => {
    timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    timeouts = [];
    enableTheControls();
    hideStopButton();
    progressBar.parentElement.setAttribute("hidden", true);
    showResults(openedUrlsCount, actualUrlsCount);
}, false);

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------


/**
 * Starts the process of opening URLs from the list.
 * Resets global variables, updates UI elements, and initiates the URL opening sequence.
 */
function startUrlOpeningProcess() {
    // Reset global variables and hide previous results.
    timeouts = [];
    openedUrlsCount = 0;
    actualUrlsCount = 0;
    hideResults();

    // Reset UI elements for the new process.
    urlListTextarea.classList.remove("is-invalid");
    progressBar.parentElement.removeAttribute("hidden");
    disableTheControls();
    showStopButton();

    // Retrieve settings and URLs for the opening process.
    const urlWaitTime = openDelayRangeSelector.value * 1000;
    const isFocusEnabled = focusTabsToggle.checked;
    const urlsArr = getUrlsFromTextArea();

    // Set up and start the URL opening process if there are URLs.
    actualUrlsCount = urlsArr.length;
    if (actualUrlsCount > 0) {
        setupProgressBar(actualUrlsCount);
        openUrlsSequentially(urlsArr, urlWaitTime, isFocusEnabled);
    }
}

/**
 * Sets up the progress bar's attributes based on the total number of URLs.
 * @param {number} totalUrls The total number of URLs to be opened.
 */
function setupProgressBar(totalUrls) {
    progressBar.setAttribute("aria-valuemin", 0);
    progressBar.setAttribute("aria-valuemax", totalUrls);
}

/**
 * Opens URLs sequentially with a delay, handling errors and updating the progress.
 * @param {string[]} urls An array of URLs to be opened.
 * @param {number} waitTime The delay between opening URLs in milliseconds.
 * @param {boolean} focusEnabled Whether to focus the new tabs.
 */
async function openUrlsSequentially(urls, waitTime, focusEnabled) {
    // Iterate through the URLs and open them with a delay.
    for (let index = 0; index < urls.length; index++) {
        const url = urls[index];
        const timeoutId = setTimeout(async () => {
            try {
                // Attempt to open the URL in a new tab.
                await openUrlInNewTab(url, focusEnabled);
                openedUrlsCount++;
                updateProgressBar(index + 1, urls.length);

                // Finish if all URLs are processed.
                if (index === urls.length - 1) {
                    finishUrlOpeningProcess(urls.length);
                }
            } catch (error) {
                // Handle errors during URL opening (e.g., network issues, invalid URLs).
                console.error(`Error opening URL: ${url}`, error);

                openedUrlsCount++;
                updateProgressBar(index + 1, urls.length);
                if (index === urls.length - 1) {
                    finishUrlOpeningProcess(urls.length);
                }
            }
        }, index * waitTime);
        timeouts.push(timeoutId);
    }
}

/**
 * Updates the progress bar's visual state.
 * @param {number} current The current number of URLs processed.
 * @param {number} total The total number of URLs to be processed.
 */
function updateProgressBar(current, total) {
    progressBar.setAttribute("aria-valuenow", current);
    progressBar.setAttribute("style", `width: ${percentage(total, current)}%`);
}

/**
 * Cleans up after all URLs have been processed, enabling controls and showing results.
 * @param {number} totalUrls The total number of URLs processed.
 */
function finishUrlOpeningProcess(totalUrls) {
    enableTheControls();
    hideStopButton();
    progressBar.parentElement.setAttribute("hidden", true);
    showResults(openedUrlsCount, totalUrls);
}

/**
 * Stops the URL opening process, clearing timeouts and resetting UI elements.
 */
stopUrlListBtn.addEventListener('click', () => {
    // Clear timeouts and reset UI when the stop button is clicked.
    timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    timeouts = [];
    enableTheControls();
    hideStopButton();
    progressBar.parentElement.setAttribute("hidden", true);

    // Show alert with the number of URLs opened.
    showResults(openedUrlsCount, actualUrlsCount);
}, false);

/**
 * Loads URL lists and configuration settings from storage on page load.
 */
window.onload = function () {
    try {
        loadUrlListsFromStorage();
        loadConfigurationFromStorage();
    } catch (error) {
        console.error("Error during window.onload:", error);
        displayAlertOnWebPage("An error occurred during page load.", "danger", urlOpenStatusCont);
    }
};

/**
 * Loads URL lists from chrome.storage.sync and populates the URL list combo box.
 */
function loadUrlListsFromStorage() {
    chrome.storage.sync.get("listOfUrls", function (data) {
        if (data.listOfUrls && data.listOfUrls.lists) {
            const lists = JSON.parse(data.listOfUrls.lists);
            for (const listName in lists) {
                if (lists.hasOwnProperty(listName)) {
                    const option = new Option(listName, listName.replace(" ", ""));
                    document.querySelector("#urlListCombo").add(option);
                }
            }
        }
    });
}

/**
 * Loads configuration settings from chrome.storage.sync and updates the UI elements.
 */
function loadConfigurationFromStorage() {
    chrome.storage.sync.get("BulkUrlOpenerConfiguration", function (data) {
        if (data.BulkUrlOpenerConfiguration !== undefined) {
            darkModeToggle.checked = data.BulkUrlOpenerConfiguration.darkMode;
            focusTabsToggle.checked = data.BulkUrlOpenerConfiguration.focusTabs;
            openDelayRangeSelector.value = data.BulkUrlOpenerConfiguration.delay;
            openDelayValueLbl.innerHTML = data.BulkUrlOpenerConfiguration.delay;
            const selectedOptionText = data.BulkUrlOpenerConfiguration.selectedList;

            darkModeToggle.checked ? enableDarkMode() : disableDarkMode();

            if (selectedOptionText !== "Select URL List") {
                for (let i = 0; i < urlListCombo.options.length; i++) {
                    if (urlListCombo.options[i].text === selectedOptionText) {
                        urlListCombo.selectedIndex = i;
                        loadSelectedUrlList(true);
                        break;
                    }
                }
            }
        }
    });
}