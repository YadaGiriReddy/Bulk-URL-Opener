let focusTabsChk         = document.querySelector("#focusTabs");
let urlListTextarea      = document.querySelector("#urlList");
let progressBar          = document.querySelector(".progress-bar");
let selectedRangeLbl     = document.querySelector("#selectedRange");
let rangeSelector        = document.querySelector("#formControlRange");
let openUrlListBtn       = document.querySelector("#openUrlList");
let getTabUrlListBtn     = document.querySelector("#getTabUrlList");
let clearUrlListBtn      = document.querySelector("#clearUrlList");
let saveConfigurationBtn = document.querySelector("#saveConfiguration");
let advancedSettingsBtn  = document.querySelector("#advancedSettings");
let statusMessageAlert   = document.querySelector(".alert");
let urlListCombo         = document.querySelector("#urlListCombo");
let loadListBtn          = document.querySelector("#loadList");
let editListBtn          = document.querySelector("#editList");
let updateListBtn        = document.querySelector("#updateList");
let deleteListBtn        = document.querySelector("#deleteList");
let listNameTxt          = document.querySelector("#listName");
let saveListBtn          = document.querySelector("#saveList");
let alertCloseBtn        = document.querySelector("#alertClose");

rangeSelector.addEventListener('input', () => {
    selectedRangeLbl.innerHTML = rangeSelector.value;
});

getTabUrlListBtn.addEventListener('click', () => {
    getTabUrlsIntoTextArea();
});

clearUrlListBtn.addEventListener('click', () => {
    clearUrlList();
});

saveConfigurationBtn.addEventListener('click', () => {
    saveConfiguration();
});

loadListBtn.addEventListener('click', () => {
    loadSelectedUrlList();
});

editListBtn.addEventListener('click', () => {
    editSelectedUrlList();
});

updateListBtn.addEventListener('click', () => {
    updateSelectedUrlList();
});

deleteListBtn.addEventListener('click', () => {
    deleteSelectedUrlList();
});

saveListBtn.addEventListener('click', () => {
    saveUrlsAsList();
});

alertCloseBtn.addEventListener('click', () => {
    statusMessageAlert.setAttribute("hidden", true);
});

openUrlListBtn.addEventListener('click', () => {
    if (urlListTextarea.value.trim().length > 0) {
        urlListTextarea.classList.remove("is-invalid");
        progressBar.parentElement.removeAttribute("hidden");
        disableTheControls();

        var urlWaitTime = rangeSelector.value * 1000;
        var focus = focusTabsChk.checked;
        var tempLinksArr = urlListTextarea.value.split("\n");
        var linksArr = [];
        tempLinksArr.forEach(linkUrl => {
            if (linkUrl.trim().length > 0)
                linksArr.push(linkUrl);
        });

        var noOfLinks = linksArr.length;
        if (noOfLinks > 0) {
            progressBar.setAttribute("aria-valuemin", 0);
            progressBar.setAttribute("aria-valuemax", noOfLinks);
            for (let index = 0; index < noOfLinks; index++) {
                const linkUrl = linksArr[index];
                setTimeout(() => {
                    openUrlInNewTab(linkUrl, focus);
                    progressBar.setAttribute("aria-valuenow", index + 1);
                    progressBar.setAttribute("style", "width:" + percentage(noOfLinks, index + 1) + "%");
                    if (index == noOfLinks - 1)
                        enableTheControls();
                }, index * urlWaitTime);
            }
            console.log("done");
        }
    } else {
        urlListTextarea.classList.add("is-invalid");
        progressBar.parentElement.setAttribute("hidden", true);
    }
}, false);

window.onload = function () {
    chrome.storage.sync.get("listOfUrls", function (data) {
        if (data.listOfUrls !== undefined) {
            var lists = data.listOfUrls.lists;
            if (lists.trim().length > 0) {
                var listsArr = lists.split("&&&");
                listsArr.forEach(listname => {
                    if (listname.trim().length > 0) {
                        var option = new Option(listname, listname.replace(" ", ""));
                        urlListCombo.add(option);
                    }
                });
            }
        }
    });

    chrome.storage.sync.get("BulkUrlOpenerConfiguration", function (data) {
        if (data.BulkUrlOpenerConfiguration !== undefined) {
            focusTabsChk.checked = data.BulkUrlOpenerConfiguration.focus;
            rangeSelector.value = data.BulkUrlOpenerConfiguration.waitTime;
            selectedRangeLbl.innerHTML = data.BulkUrlOpenerConfiguration.waitTime;
            var selectedOptionText = data.BulkUrlOpenerConfiguration.selectedList;

            if (selectedOptionText != "Select URL List") {
                for (var i = 0; i < urlListCombo.options.length; i++) {
                    if (urlListCombo.options[i].text == selectedOptionText) {
                        urlListCombo.selectedIndex = i;
                        loadSelectedUrlList(true);
                        break;
                    }
                }
            }
        }
    });
}