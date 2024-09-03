chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  });
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'takeScreenshot') {
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        sendResponse({ screenshotUrl: dataUrl });
      });
      return true;
    }
  });