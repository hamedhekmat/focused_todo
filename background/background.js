// Background script for Todo Blocker extension (Manifest V3)
let blockedUrls = [];
let todoList = [];
let isBlockingEnabled = false;

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  loadData();
  updateBlockingRules();
});

// Load data from storage
function loadData() {
  chrome.storage.sync.get(['blockedUrls', 'todoList', 'isBlockingEnabled'], (result) => {
    blockedUrls = result.blockedUrls || [];
    todoList = result.todoList || [];
    isBlockingEnabled = result.isBlockingEnabled || false;
    updateBlockingRules();
  });
}

// Save data to storage
function saveData() {
  chrome.storage.sync.set({
    blockedUrls: blockedUrls,
    todoList: todoList,
    isBlockingEnabled: isBlockingEnabled
  });
  updateBlockingRules();
}

// Update blocking rules based on current state
function updateBlockingRules() {
  if (!isBlockingEnabled || blockedUrls.length === 0) {
    // Disable all rules if blocking is off or no URLs are blocked
    chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // Remove up to 10 rules
    });
    return;
  }

  // Check if all todos are completed
  const allCompleted = todoList.length > 0 && todoList.every(todo => todo.completed);
  
  if (allCompleted) {
    // Remove blocking rules if all todos are completed
    chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // Remove up to 10 rules
    });
    return;
  }

  // Create blocking rules for each blocked URL
  const rules = blockedUrls.map((url, index) => {
    const ruleId = index + 1;
    let urlFilter;
    
    if (url.startsWith('http')) {
      urlFilter = url;
    } else {
      // For domain names, block all URLs from that domain
      urlFilter = `*://*.${url}/*`;
    }
    
    return {
      id: ruleId,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          url: chrome.runtime.getURL('popup/popup.html')
        }
      },
      condition: {
        urlFilter: urlFilter,
        resourceTypes: ["main_frame"]
      }
    };
  });

  // Update the rules
  chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: blockedUrls.map((_, index) => index + 1),
    addRules: rules
  });
}

// Handle extension icon click
chrome.action.onClicked.addListener(() => {
  openExtensionPage();
});

// Function to open the extension page
function openExtensionPage() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('popup/popup.html')
  });
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getData':
      sendResponse({
        blockedUrls: blockedUrls,
        todoList: todoList,
        isBlockingEnabled: isBlockingEnabled
      });
      break;
      
    case 'addBlockedUrl':
      if (!blockedUrls.includes(request.url)) {
        blockedUrls.push(request.url);
        saveData();
      }
      sendResponse({ success: true });
      break;
      
    case 'removeBlockedUrl':
      blockedUrls = blockedUrls.filter(url => url !== request.url);
      saveData();
      sendResponse({ success: true });
      break;
      
    case 'addTodo':
      const newTodo = {
        id: Date.now(),
        text: request.text,
        completed: false,
        recurring: request.recurring || null,
        createdAt: new Date().toISOString()
      };
      todoList.push(newTodo);
      saveData();
      sendResponse({ success: true, todo: newTodo });
      break;
      
    case 'toggleTodo':
      const todo = todoList.find(t => t.id === request.id);
      if (todo) {
        todo.completed = !todo.completed;
        if (todo.completed) {
          todo.lastCompleted = new Date().toISOString();
        }
        saveData();
      }
      sendResponse({ success: true });
      break;
      
    case 'deleteTodo':
      todoList = todoList.filter(t => t.id !== request.id);
      saveData();
      sendResponse({ success: true });
      break;
      
    case 'toggleBlocking':
      isBlockingEnabled = !isBlockingEnabled;
      saveData();
      sendResponse({ success: true, isBlockingEnabled: isBlockingEnabled });
      break;
  }
});

// Handle recurring todos
function checkRecurringTodos() {
  const now = new Date();
  const today = now.toDateString();
  
  todoList.forEach(todo => {
    if (todo.recurring && todo.completed) {
      const lastCompleted = new Date(todo.lastCompleted || 0);
      const lastCompletedDate = lastCompleted.toDateString();
      
      let shouldReset = false;
      
      if (todo.recurring === 'daily') {
        // Check if it's a new day (after midnight)
        if (lastCompletedDate !== today) {
          shouldReset = true;
        }
      } else if (todo.recurring === 'weekly') {
        const daysDiff = Math.floor((now - lastCompleted) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 7) {
          shouldReset = true;
        }
      }
      
      if (shouldReset) {
        todo.completed = false;
        todo.lastCompleted = null;
      }
    }
  });
  
  saveData();
}

// Check recurring todos every hour
setInterval(checkRecurringTodos, 60 * 60 * 1000);

// Also check when the extension starts up
checkRecurringTodos();

// Initial load
loadData();
