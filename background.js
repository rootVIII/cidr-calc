// noinspection JSDeprecatedSymbols
// eslint-disable-next-line no-undef
chrome.app.runtime.onLaunched.addListener(() => {
    // eslint-disable-next-line no-undef
    chrome.app.window.create('index.html', {
        outerBounds: {
            width: 600,
            height: 270,
        },
    });
});
