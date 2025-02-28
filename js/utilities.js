// -----------------------------------------------------------------------------
// URL Handling
// -----------------------------------------------------------------------------

/**
 * Opens a URL in a new tab.
 * @param {string} urlLink The URL to open.
 * @param {boolean} focus Whether to focus the new tab.
 * @returns {Promise<number|null>} A promise resolving to the tab ID or null.
 */
function openUrlInNewTab(urlLink, focus) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({
            method: "open",
            link: urlLink,
            focus: focus
        }, function (response) {
            if (response && response.tabId) {
                resolve(response.tabId);
            } else {
                resolve(null);
            }
        });
    });
}

/**
 * Checks if a URL is valid.
 * @param {string} url The URL to validate.
 * @returns {boolean} True if the URL is valid, false otherwise.
 */
function isUrlValid(url) {
    const knownInvalidUrls = ["chrome://extensions/", "chrome://newtab/", "edge://extensions/", "edge://newtab/", "about:addons", "about:newtab", "chrome://startpageshared/"];

    try {
        if (url.length === 0) {
            return false; // Empty URL is invalid
        }

        new URL(url); // Throws an error if URL is invalid

        // Check against known invalid URLs and prefixes
        return !knownInvalidUrls.includes(url) &&
            !url.startsWith("chrome-extension://") &&
            !url.startsWith("chrome://extensions") &&
            !url.startsWith("edge://extensions") &&
            !url.startsWith("extension://") &&
            !url.startsWith("about:debugging") &&
            !url.startsWith("about:devtools") &&
            !url.startsWith("moz-extension");

    } catch (_) {
        return false; // URL is invalid
    }
}

// -----------------------------------------------------------------------------
// UI Element Interaction
// -----------------------------------------------------------------------------

/**
 * Disables interactive controls on the page.
 */
function disableTheControls() {
    focusTabsToggle.setAttribute("disabled", true);
    urlListTextarea.setAttribute("disabled", true);
    openDelayRangeSelector.setAttribute("disabled", true);
    getTabUrlListBtn.setAttribute("disabled", true);
    clearUrlListBtn.setAttribute("disabled", true);
    saveConfigurationBtn.setAttribute("disabled", true);
    advancedSettingsBtn.setAttribute("disabled", true);
    urlListCombo.setAttribute("disabled", true);
    loadListBtn.setAttribute("disabled", true);
    editListBtn.setAttribute("disabled", true);
    updateListBtn.setAttribute("disabled", true);
    deleteListBtn.setAttribute("disabled", true);
    listNameTxt.setAttribute("disabled", true);
    saveListBtn.setAttribute("disabled", true);
}

/**
 * Enables interactive controls on the page.
 */
function enableTheControls() {
    focusTabsToggle.removeAttribute("disabled");
    urlListTextarea.removeAttribute("disabled");
    openDelayRangeSelector.removeAttribute("disabled");
    openUrlListBtn.removeAttribute("disabled");
    getTabUrlListBtn.removeAttribute("disabled");
    clearUrlListBtn.removeAttribute("disabled");
    saveConfigurationBtn.removeAttribute("disabled");
    advancedSettingsBtn.removeAttribute("disabled");
    urlListCombo.removeAttribute("disabled");
    loadListBtn.removeAttribute("disabled");
    editListBtn.removeAttribute("disabled");
    updateListBtn.removeAttribute("disabled");
    deleteListBtn.removeAttribute("disabled");
    listNameTxt.removeAttribute("disabled");
    saveListBtn.removeAttribute("disabled");
}

/**
 * Shows the stop button and hides the open button.
 */
function showStopButton() {
    stopUrlListBtn.classList.remove("d-none");
    openUrlListBtn.classList.add("d-none");
}

/**
 * Hides the stop button and shows the open button.
 */
function hideStopButton() {
    stopUrlListBtn.classList.add("d-none");
    openUrlListBtn.classList.remove("d-none");
}

// -----------------------------------------------------------------------------
// URL List Management
// -----------------------------------------------------------------------------

/**
 * Gets URLs from currently open tabs and populates the textarea.
 */
function getTabUrlsIntoTextArea() {
    try {
        chrome.tabs.query({ currentWindow: true }, tabs => {
            if (tabs.length > 0) {
                urlListTextarea.classList.remove("is-invalid");
                clearUrlList();
                tabs.forEach(tab => {
                    const tabUrl = tab.url;
                    if (isUrlValid(tabUrl)) {
                        urlListTextarea.value += tabUrl + "\n";
                    }
                });
            }
            urlListTextarea.value = urlListTextarea.value.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, "");
            urlListTextarea.select();
        });
    } catch (error) {
        console.error("Error getting tab URLs:", error);
        displayAlertOnWebPage("An error occurred while getting tab URLs.", "danger", urlListStatusCont);
    }
}

/**
 * Saves the URLs in the textarea as a named list.
 */
function saveUrlsAsList() {
    var listName = listNameTxt.value.trim();
    if (listName && listName.length > 0) {
        listNameTxt.classList.remove("is-invalid");

        chrome.storage.sync.get("listOfUrls", function (data) {
            let lists = data.listOfUrls && data.listOfUrls.lists ? JSON.parse(data.listOfUrls.lists) : {};

            if (lists[listName]) {
                displayAlertOnWebPage(`List name already exists, Please provide a unique list name.`, "danger", urlListStatusCont);
                return;
            }

            if (urlListTextarea.value) {
                urlListTextarea.classList.remove("is-invalid");
                lists[listName] = urlListTextarea.value.split("\n").filter(url => url.trim() !== "");

                chrome.storage.sync.set({ listOfUrls: { lists: JSON.stringify(lists) } }, function () {
                    var option = new Option(listName, listName.replace(" ", ""));
                    urlListCombo.add(option);
                    listNameTxt.value = "";
                    displayAlertOnWebPage(`List created successfully...`, "success", urlListStatusCont);
                });
            } else {
                urlListTextarea.classList.add("is-invalid");
            }
        });
    } else {
        listNameTxt.classList.add("is-invalid");
    }
}

/**
 * Extracts URLs from a textarea, trims them, and filters out empty lines.
 * @returns {string[]} An array of URLs.
 */
function getUrlsFromTextArea() {
    return urlListTextarea.value
        .split("\n")
        .map(url => url.trim())
        .filter(url => url.length > 0);
}

/**
 * Clears the URL list textarea.
 */
function clearUrlList() {
    if (urlListTextarea.value) {
        urlListTextarea.value = "";
    }
}

/**
 * Loads the selected URL list into the textarea.
 * @param {boolean} onStart Indicates if the function is called on page load.
 */
function loadSelectedUrlList(onStart) {
    if (urlListCombo.length > 1) {
        if (urlListCombo.selectedIndex == 0 && !onStart) {
            showGenericModal("Please select the list that you want to load", urlListCombo);
            return;
        } else {
            urlListStatusCont.innerHTML = '';
            var selectedListName = urlListCombo.options[urlListCombo.selectedIndex].text;

            chrome.storage.sync.get("listOfUrls", function (data) {
                if (data.listOfUrls && data.listOfUrls.lists) {
                    const lists = JSON.parse(data.listOfUrls.lists);
                    if (lists[selectedListName]) {
                        urlListTextarea.value = lists[selectedListName].join("\n");
                        urlListTextarea.classList.remove("is-invalid");
                    }
                }
            });
        }
    } else {
        showGenericModal("There are no lists available to load!", urlListCombo);
    }
}

/**
 * Deletes the selected URL list.
 */
function deleteSelectedUrlList() {
    if (urlListCombo.length > 1) {
        if (urlListCombo.selectedIndex === 0) {
            showGenericModal("Please select the list that you want to delete", urlListCombo);
            return;
        } else {
            showConfirmationModal("Are you sure you want to delete the list?", () => {
                const selectedListName = urlListCombo[urlListCombo.selectedIndex].text;
                urlListCombo.remove(urlListCombo.selectedIndex);

                chrome.storage.sync.get("listOfUrls", function (data) {
                    if (data.listOfUrls && data.listOfUrls.lists) {
                        const lists = JSON.parse(data.listOfUrls.lists);
                        delete lists[selectedListName];

                        chrome.storage.sync.set({ listOfUrls: { lists: JSON.stringify(lists) } }, function () {
                            urlListTextarea.value = "";
                            displayAlertOnWebPage(`List deleted successfully...`, "success", urlListStatusCont);
                        });
                    }
                });
            });
        }
    } else {
        showGenericModal("There are no lists available to delete!", urlListCombo);
    }
}

/**
 * Enables editing of the selected URL list.
 */
function editSelectedUrlList() {
    if (urlListCombo.length > 1) {
        if (urlListCombo.selectedIndex == 0) {
            showGenericModal("Please select the list that you want to edit", urlListCombo);
            return;
        } else {
            showConfirmationModal("Are you sure you want to edit the selected list?", () => {
                loadSelectedUrlList(false);
                editListBtn.classList.add("d-none");
                updateListBtn.classList.remove("d-none");
                saveConfigurationBtn.setAttribute("disabled", true);
                advancedSettingsBtn.setAttribute("disabled", true);
                urlListCombo.setAttribute("disabled", true);
                loadListBtn.setAttribute("disabled", true);
                deleteListBtn.setAttribute("disabled", true);
                listNameTxt.setAttribute("disabled", true);
                saveListBtn.setAttribute("disabled", true);
                openUrlListBtn.setAttribute("disabled", true);
                focusTabsToggle.setAttribute("disabled", true);
                openDelayRangeSelector.setAttribute("disabled", true);
            });
        }
    } else
        showGenericModal("There are no lists available to edit!", urlListCombo);
}

/**
 * Updates the selected URL list with the contents of the textarea.
 */
function updateSelectedUrlList() {
    if (urlListTextarea.value.trim().length > 0) {
        const selectedListName = urlListCombo[urlListCombo.selectedIndex].text;

        chrome.storage.sync.get("listOfUrls", function (data) {
            if (data.listOfUrls && data.listOfUrls.lists) {
                const lists = JSON.parse(data.listOfUrls.lists);

                if (lists[selectedListName]) {
                    lists[selectedListName] = urlListTextarea.value.trim().split("\n").filter(url => url.trim() !== "");

                    chrome.storage.sync.set({ listOfUrls: { lists: JSON.stringify(lists) } }, function () {
                        displayAlertOnWebPage(`List updated successfully...`, "success", urlListStatusCont);

                        editListBtn.classList.remove("d-none");
                        updateListBtn.classList.add("d-none");
                        saveConfigurationBtn.removeAttribute("disabled");
                        advancedSettingsBtn.removeAttribute("disabled");
                        urlListCombo.removeAttribute("disabled");
                        loadListBtn.removeAttribute("disabled");
                        deleteListBtn.removeAttribute("disabled");
                        listNameTxt.removeAttribute("disabled");
                        saveListBtn.removeAttribute("disabled");
                        openUrlListBtn.removeAttribute("disabled");
                        focusTabsToggle.removeAttribute("disabled");
                        openDelayRangeSelector.removeAttribute("disabled");
                    });
                } else {
                    showGenericModal("List not found", urlListTextarea);
                }
            }
        });
    } else {
        showGenericModal("Add at least one URL to update the list", urlListTextarea);
    }
}

// -----------------------------------------------------------------------------
// Configuration Management
// -----------------------------------------------------------------------------

/**
 * Saves the current configuration of the extension.
 */
function saveConfiguration() {
    try {
        const darkMode = darkModeToggle.checked;
        const focusTabs = focusTabsToggle.checked;
        const delay = openDelayRangeSelector.value;
        const selectedListItemText = urlListCombo.options[urlListCombo.selectedIndex].text;

        chrome.storage.sync.set({
            BulkUrlOpenerConfiguration: {
                darkMode,
                focusTabs,
                delay,
                selectedList: selectedListItemText
            }
        }, () => {
            displayAlertOnWebPage("Configuration saved successfully...", "success", urlOpenStatusCont);
        });
    } catch (error) {
        console.error("Error saving configuration:", error);
        displayAlertOnWebPage("An error occurred while saving configuration.", "danger", urlOpenStatusCont);
    }
}

// -----------------------------------------------------------------------------
// UI Feedback and Modals
// -----------------------------------------------------------------------------

/**
 * Calculates a percentage.
 * @param {number} x Total value.
 * @param {number} y Current value.
 * @returns {number} The calculated percentage.
 */
function percentage(x, y) {
    return (y / x) * 100;
}

/**
 * Creates an alert element.
 * @param {string} message The alert message.
 * @param {string} type The alert type (e.g., "success", "danger").
 * @returns {Element} The alert element.
 */
const appendAlert = (message, type) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible" role="alert">`,
        `  <div>${message}</div>`,
        '  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
    ].join('');
    return wrapper.firstChild;
};

/**
 * Displays an alert on the webpage.
 * @param {string} message The alert message.
 * @param {string} type The alert type.
 * @param {Element} alertContainer The container to append the alert to.
 */
function displayAlertOnWebPage(message, type, alertContainer) {
    const alertElement = appendAlert(message, type);
    if (alertContainer) {
        alertContainer.innerHTML = '';
        alertContainer.appendChild(alertElement);
    } else {
        console.error("Alert container not found!");
    }
}

/**
 * Shows the results of the URL opening process.
 * @param {number} openedUrlsCount The number of URLs opened.
 * @param {number} actualUrlsCount The total number of URLs.
 */
function showResults(openedUrlsCount, actualUrlsCount) {
    if (openedUrlsCount == actualUrlsCount)
        displayAlertOnWebPage(`All ${actualUrlsCount} URLs Opened Successfully.`, "success", urlOpenStatusCont);
    else
        displayAlertOnWebPage(`Only ${openedUrlsCount} out of ${actualUrlsCount} URLs Opened.`, "warning", urlOpenStatusCont);
}

/**
 * Hides the results display.
 */
function hideResults() {
    if (urlOpenStatusCont) {
        urlOpenStatusCont.innerHTML = '';
    }
}

/**
 * Shows a confirmation modal.
 * @param {string} message The modal message.
 * @param {Function} yesCallback The callback function for the "Yes" button.
 */
function showConfirmationModal(message, yesCallback) {
    const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    document.getElementById('confirmationModalMessage').textContent = message;

    const confirmYesButton = document.getElementById('confirmYesButton');
    confirmYesButton.replaceWith(confirmYesButton.cloneNode(true));

    document.getElementById('confirmYesButton').addEventListener('click', () => {
        yesCallback();
        confirmationModal.hide();
    });

    const confirmNoButton = document.getElementById('confirmNoButton');
    if (confirmNoButton) {
        confirmNoButton.addEventListener('click', () => {
            confirmationModal.hide();
        });
    }

    confirmationModal.show();
}

/**
 * Shows a generic modal.
 * @param {string} message The modal message.
 * @param {Element} focusElement The element to focus after the modal is closed.
 */
function showGenericModal(message, focusElement) {
    const genericModal = new bootstrap.Modal(document.getElementById('genericModal'));
    document.getElementById('genericModalMessage').textContent = message;

    genericModal.show();

    const modalElement = document.getElementById('genericModal');
    modalElement.addEventListener('hidden.bs.modal', () => {
        if (focusElement && focusElement instanceof Element) {
            focusElement.focus();
        }
    });
}
