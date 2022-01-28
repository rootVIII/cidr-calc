// noinspection JSDeprecatedSymbols
// eslint-disable-next-line no-undef
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
        // eslint-disable-next-line no-undef
        chrome.scripting.executeScript({
            target: { tabId },
            files: ['./cidr.js'],
        })
            .then(() => {
                console.log('INJECTED THE FOREGROUND SCRIPT.');
            })
            .catch((err) => console.log(err));
    }
});
