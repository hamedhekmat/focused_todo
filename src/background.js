// Background service worker for Chrome extension

const REDIRECT_RULE_ID = 1;
const extensionUrl = chrome.runtime.getURL('index.html');

// Convert blocked URLs to declarativeNetRequest rules using substring matching
function createRules(blockedUrls) {
  const rules = [];
  
  blockedUrls.forEach((blockedUrl, index) => {
    // Use substring matching - any URL containing the blocked substring will be blocked
    // Pattern: *://*substring* matches any URL containing the substring
    rules.push({
      id: REDIRECT_RULE_ID + index,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: { url: extensionUrl }
      },
      condition: {
        urlFilter: `*://*${blockedUrl}*`,
        resourceTypes: ['main_frame']
      }
    });
  });
  
  return rules;
}

// Update declarativeNetRequest rules based on blocked URLs
// Only block URLs if there are incomplete todos
async function updateBlockingRules() {
  const result = await chrome.storage.local.get(['blockedUrls', 'todos']);
  const blockedUrls = result.blockedUrls || [];
  const todos = result.todos || [];
  
  // Check if there are any incomplete todos
  const hasIncompleteTodos = todos.some(todo => !todo.completed);
  
  // Remove all existing rules
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIds = existingRules.map(rule => rule.id);
    if (ruleIds.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ruleIds
      });
    }
  } catch (e) {
    console.log('No existing rules to remove');
  }
  
  // Only add blocking rules if there are incomplete todos AND blocked URLs
  if (hasIncompleteTodos && blockedUrls.length > 0) {
    const rules = createRules(blockedUrls);
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: rules
      });
    } catch (e) {
      console.error('Error adding rules:', e);
    }
  }
}

// Handle extension icon click - open extension page in new tab
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('index.html')
  });
});

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Focused Todo extension installed');
  updateBlockingRules();
});

// Update rules on startup
updateBlockingRules();

// Listen for storage changes to update rules
// Update when blocked URLs change OR when todos change (completion status)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && (changes.blockedUrls || changes.todos)) {
    updateBlockingRules();
  }
});

