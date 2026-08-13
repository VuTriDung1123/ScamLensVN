chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SAVE_HISTORY') {
    window.postMessage({
      type: 'SCAMLENS_SAVE_HISTORY',
      payload: request.payload
    }, '*');
    sendResponse({ success: true });
  }
});
