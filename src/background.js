// Background service worker for Chrome extension

const REDIRECT_RULE_ID = 1;
const extensionUrl = chrome.runtime.getURL('index.html');

// Convert blocked URLs to declarativeNetRequest rules
function createRules(blockedUrls) {
  const rules = [];
  
  blockedUrls.forEach((blockedUrl, index) => {
    try {
      const url = new URL(blockedUrl);
      const hostname = url.hostname;
      
      rules.push({
        id: REDIRECT_RULE_ID + index,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: { url: extensionUrl }
        },
        condition: {
          urlFilter: `*://${hostname}/*`,
          resourceTypes: ['main_frame']
        }
      });
    } catch (e) {
      // If blockedUrl is not a full URL, treat it as a domain pattern
      rules.push({
        id: REDIRECT_RULE_ID + index,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: { url: extensionUrl }
        },
        condition: {
          urlFilter: `*://*${blockedUrl}/*`,
          resourceTypes: ['main_frame']
        }
      });
    }
  });
  
  return rules;
}

// Update declarativeNetRequest rules based on blocked URLs
async function updateBlockingRules() {
  const result = await chrome.storage.local.get(['blockedUrls']);
  const blockedUrls = result.blockedUrls || [];
  
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
  
  // Add new rules if there are blocked URLs
  if (blockedUrls.length > 0) {
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
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.blockedUrls) {
    updateBlockingRules();
  }
});

