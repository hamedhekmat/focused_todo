// Content script for Todo Blocker extension
// This script runs on all pages and can be used for future enhancements

console.log('Focused Todo extension loaded');

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle any content script specific messages here
  if (request.action === 'ping') {
    sendResponse({ status: 'active' });
  }
});
