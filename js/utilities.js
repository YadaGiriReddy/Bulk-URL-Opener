function getTabUrlsIntoTextArea() {
    chrome.tabs.query({
        currentWindow: true
    }, tabs => {
        //console.log(tabs);
        if (tabs.length > 0) {
            urlListTextarea.classList.remove("is-invalid");
            clearUrlList();
            tabs.forEach(tab => {
                var tabUrl = tab.url;
                if (isUrlValid(tabUrl))
                    urlListTextarea.value += tabUrl + "\n";
            });
        }

        urlListTextarea.value = urlListTextarea.value.replace(/(?:(?:\r\n|\r|\n)\s*){2}/gm, "");
        urlListTextarea.select();
    });
}

function saveUrlsAsList() {
    var listName = listNameTxt.value.trim();
    if (listName && listName.length > 0) {
        listNameTxt.classList.remove("is-invalid");

        // to avoid duplicate listname
        for (var i = 0; i < urlListCombo.options.length; i++) {
            if (urlListCombo.options[i].text == listName) {
                statusMessageAlert.classList.remove("alert-success");
                statusMessageAlert.classList.add("alert-danger");
                statusMessageAlert.childNodes[0].nodeValue = "List name already exists, Please provide a unique list name.";
                statusMessageAlert.removeAttribute('hidden');
                return;
            }
        }

        if (urlListTextarea.value) {
            urlListTextarea.classList.remove("is-invalid");
            var option = new Option(listName, listName.replace(" ", ""));
            urlListCombo.add(option);

            chrome.storage.sync.get("listOfUrls", function (data) {
                console.log(data.listOfUrls);

                if (data.listOfUrls === undefined) {
                    chrome.storage.sync.set({
                        listOfUrls: {
                            lists: listName,
                            urls: listName + "@@@" + urlListTextarea.value
                        }
                    }, function () {
                        console.log("List of URLs saved successfully");
                    });
                } else {
                    chrome.storage.sync.set({
                        listOfUrls: {
                            lists: data.listOfUrls.lists + "&&&" + listName,
                            urls: data.listOfUrls.urls + "&&&" + listName + "@@@" + urlListTextarea.value
                        }
                    }, function () {
                        console.log("List of URLs updated successfully");
                    });
                }
            });

            statusMessageAlert.classList.remove("alert-danger");
            statusMessageAlert.classList.add("alert-success");
            statusMessageAlert.childNodes[0].nodeValue = "List created successfully..."
            statusMessageAlert.removeAttribute('hidden');
            listNameTxt.value = "";
        } else {
            urlListTextarea.classList.add("is-invalid");
        }
    } else {
        listNameTxt.classList.add("is-invalid");
    }
}

function clearUrlList() {
    if (urlListTextarea.value) {
        urlListTextarea.value = "";
    }
}

function saveConfiguration() {
    var focus = focusTabsChk.checked;
    var waitTime = rangeSelector.value;
    var selectedListItemText = urlListCombo.options[urlListCombo.selectedIndex].text

    chrome.storage.sync.set({
        BulkUrlOpenerConfiguration: {
            focus: focus,
            waitTime: waitTime,
            selectedList: selectedListItemText
        }
    }, function () {
        alert("Configuration saved successfully");
    });
}

function isUrlValid(url) {
    if (url.length > 0 && !(url.startsWith("chrome-extension://")) && url != "chrome://newtab/")
        return true;
    else
        return false;
}

function loadSelectedUrlList(onStart) {
    if (urlListCombo.length > 1) {
        if (urlListCombo.selectedIndex == 0 && !onStart) {
            alert("Please select the list which you want to load");
            return;
        } else {
            var selectedListItemtext = urlListCombo.options[urlListCombo.selectedIndex].text;

            chrome.storage.sync.get("listOfUrls", function (data) {
                var urls = data.listOfUrls.urls;
                var urlsArr = urls.split("&&&");
                urlsArr.forEach(urlValue => {
                    var listName = urlValue.split("@@@")[0];
                    if (selectedListItemtext === listName) {
                        urlListTextarea.value = urlValue.split("@@@")[1];
                    }
                });
            });
            urlListTextarea.classList.remove("is-invalid");
        }
    } else
        alert("There are no lists available to load!!!");
}

function deleteSelectedUrlList() {
    if (urlListCombo.length > 1) {
        if (urlListCombo.selectedIndex == 0) {
            alert("Please select the list which you want to delete");
            return;
        } else {
            if (confirm("Are you sure, you want to delete the list?")) {
                var selectedListName = urlListCombo[urlListCombo.selectedIndex].text;
                urlListCombo.remove(urlListCombo.selectedIndex);
                chrome.storage.sync.get("listOfUrls", function (data) {
                    var selectedIndex = 0;
                    var urlsText = "";
                    var listsText = "";

                    // remove the selected listname
                    var listsArr = data.listOfUrls.lists.split("&&&");
                    for (let index = 0; index < listsArr.length; index++) {
                        if (listsArr[index] == selectedListName) {
                            selectedIndex = index;
                            break;
                        }
                    }
                    listsArr.splice(selectedIndex, 1);
                    for (let index = 0; index < listsArr.length; index++) {
                        if (index == 0)
                            listsText = listsArr[index];
                        else
                            listsText = listsText + "&&&" + listsArr[index];
                    }

                    // remove the selected list of urls
                    selectedIndex = 0;
                    var urlsArr = data.listOfUrls.urls.split("&&&");
                    for (let index = 0; index < urlsArr.length; index++) {
                        var listName = urlsArr[index].split("@@@")[0];
                        if (listName === selectedListName) {
                            selectedIndex = index;
                            break;
                        }
                    }
                    urlsArr.splice(selectedIndex, 1);
                    for (let index = 0; index < urlsArr.length; index++) {
                        if (index == 0)
                            urlsText = urlsArr[index];
                        else
                            urlsText = urlsText + "&&&" + urlsArr[index];
                    }

                    //Update the existing list
                    chrome.storage.sync.set({
                        listOfUrls: {
                            lists: listsText,
                            urls: urlsText
                        }
                    }, function () {
                        console.log("List of URLs updated successfully after deletion");
                    });
                });
                urlListTextarea.value = "";
                statusMessageAlert.classList.remove("alert-danger");
                statusMessageAlert.classList.add("alert-success");
                statusMessageAlert.childNodes[0].nodeValue = "List deleted successfully..."
                statusMessageAlert.removeAttribute('hidden');
            }
        }
    } else
        alert("There are no lists available to delete!!!");
}

function editSelectedUrlList() {
    if (urlListCombo.length > 1) {
        if (urlListCombo.selectedIndex == 0) {
            alert("Please select the list which you want to edit");
            return;
        } else {
            if (confirm("Are you sure, you want to edit the list?")) {
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
            }
        }
    } else
        alert("There are no lists available to edit!!!");
}

function updateSelectedUrlList() {
    if (urlListTextarea.value.trim().length > 0) {
        var selectedListName = urlListCombo[urlListCombo.selectedIndex].text;
        chrome.storage.sync.get("listOfUrls", function (data) {
            var urlsText = "";
            var listsText = data.listOfUrls.lists;

            // update the selected list of urls
            var urlsArr = data.listOfUrls.urls.split("&&&");
            for (let index = 0; index < urlsArr.length; index++) {
                var listName = urlsArr[index].split("@@@")[0];
                if (listName === selectedListName) {
                    urlsArr[index] = selectedListName + "@@@" + urlListTextarea.value.trim();
                    break;
                }
            }

            for (let index = 0; index < urlsArr.length; index++) {
                if (index == 0)
                    urlsText = urlsArr[index];
                else
                    urlsText = urlsText + "&&&" + urlsArr[index];
            }

            //Update the existing list
            chrome.storage.sync.set({
                listOfUrls: {
                    lists: listsText,
                    urls: urlsText
                }
            }, function () {
                console.log("List of URLs updated successfully");
            });
        });
        statusMessageAlert.classList.remove("alert-danger");
        statusMessageAlert.classList.add("alert-success");
        statusMessageAlert.childNodes[0].nodeValue = "List updated successfully..."
        statusMessageAlert.removeAttribute('hidden');

        editListBtn.classList.remove("d-none");
        updateListBtn.classList.add("d-none");
        saveConfigurationBtn.removeAttribute("disabled");
        advancedSettingsBtn.removeAttribute("disabled");
        urlListCombo.removeAttribute("disabled");
        loadListBtn.removeAttribute("disabled");
        deleteListBtn.removeAttribute("disabled");
        listNameTxt.removeAttribute("disabled");
        saveListBtn.removeAttribute("disabled");
    } else
        alert("Add atleast one URL to update the list");
}

function percentage(x, y) {
    return (y / x) * 100;
}

function disableTheControls() {
    focusTabsChk.setAttribute("disabled", true);
    urlListTextarea.setAttribute("disabled", true);
    rangeSelector.setAttribute("disabled", true);
    openUrlListBtn.setAttribute("disabled", true);
    getTabUrlListBtn.setAttribute("disabled", true);
    clearUrlListBtn.setAttribute("disabled", true);
    saveConfigurationBtn.setAttribute("disabled", true);
    advancedSettingsBtn.setAttribute("disabled", true);
}

function enableTheControls() {
    focusTabsChk.removeAttribute("disabled", true);
    urlListTextarea.removeAttribute("disabled", true);
    rangeSelector.removeAttribute("disabled", true);
    openUrlListBtn.removeAttribute("disabled", true);
    getTabUrlListBtn.removeAttribute("disabled", true);
    clearUrlListBtn.removeAttribute("disabled", true);
    saveConfigurationBtn.removeAttribute("disabled", true);
    advancedSettingsBtn.removeAttribute("disabled", true);
}

function openUrlInNewTab(urlLink, focus) {
    chrome.runtime.sendMessage({
        method: "open",
        link  : urlLink,
        focus : focus
    }, function (response) {});
}