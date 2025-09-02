// Popup script for Todo Blocker extension
let todoList = [];
let blockedUrls = [];
let isBlockingEnabled = false;
let wasBlocked = false;

// DOM elements
const blockingToggle = document.getElementById('blockingToggle');
const blockingNotification = document.getElementById('blockingNotification');
const todoInput = document.getElementById('todoInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoListContainer = document.getElementById('todoList');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const urlInput = document.getElementById('urlInput');
const addUrlBtn = document.getElementById('addUrlBtn');
const blockedUrlsList = document.getElementById('blockedUrlsList');
const recurringCheck = document.getElementById('recurringCheck');
const recurringType = document.getElementById('recurringType');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    setupTabs();
    checkIfBlocked();
});

// Check if popup was opened due to blocking
function checkIfBlocked() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      const currentUrl = tabs[0].url;
      if (currentUrl) {
        const hostname = new URL(currentUrl).hostname;
        
        // Check if current tab URL is blocked
        const isBlocked = blockedUrls.some(blockedUrl => {
          if (blockedUrl.startsWith('http')) {
            return currentUrl.includes(blockedUrl);
          } else {
            return hostname.includes(blockedUrl);
          }
        });
        
        if (isBlocked && isBlockingEnabled) {
          showBlockingNotification();
          wasBlocked = true;
        }
      }
    }
  });
}

// Show blocking notification
function showBlockingNotification() {
    blockingNotification.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        blockingNotification.style.display = 'none';
    }, 5000);
}

// Load data from background script
function loadData() {
    chrome.runtime.sendMessage({ action: 'getData' }, (response) => {
        if (response) {
            todoList = response.todoList || [];
            blockedUrls = response.blockedUrls || [];
            isBlockingEnabled = response.isBlockingEnabled || false;
            
            updateUI();
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Blocking toggle
    blockingToggle.addEventListener('change', toggleBlocking);
    
    // Add todo
    addTodoBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
    
    // Add blocked URL
    addUrlBtn.addEventListener('click', addBlockedUrl);
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addBlockedUrl();
    });
    
    // Recurring options
    recurringCheck.addEventListener('change', () => {
        recurringType.disabled = !recurringCheck.checked;
    });
}

// Setup tabs
function setupTabs() {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// Toggle blocking
function toggleBlocking() {
    chrome.runtime.sendMessage({ action: 'toggleBlocking' }, (response) => {
        if (response && response.success) {
            isBlockingEnabled = response.isBlockingEnabled;
            updateBlockingToggle();
        }
    });
}

// Add todo
function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;
  
  const recurring = recurringCheck.checked ? recurringType.value : null;
  
  chrome.runtime.sendMessage({
    action: 'addTodo',
    text: text,
    recurring: recurring
  }, (response) => {
    if (response && response.success) {
      // Prevent storage listener from triggering
      isLocalUpdate = true;
      
      // Add the new todo to the list without triggering storage listener
      todoList.push(response.todo);
      addTodoToUI(response.todo);
      updateProgress();
      
      // Reset form
      todoInput.value = '';
      recurringCheck.checked = false;
      recurringType.disabled = true;
      
      // Re-enable storage listener after a short delay
      setTimeout(() => {
        isLocalUpdate = false;
      }, 100);
    }
  });
}

// Add a single todo to the UI without recreating the entire list
function addTodoToUI(todo) {
  if (todoListContainer.querySelector('.empty-state')) {
    // Remove empty state if this is the first todo
    todoListContainer.innerHTML = '';
  }
  
  const todoElement = document.createElement('div');
  todoElement.className = `todo-item ${todo.completed ? 'completed' : ''}`;
  todoElement.dataset.todoId = todo.id;
  todoElement.innerHTML = `
    <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
    <div class="todo-content">
      <div class="todo-text">${escapeHtml(todo.text)}</div>
      <div class="todo-meta">
        ${todo.recurring ? `🔄 ${todo.recurring}` : ''}
        ${todo.completed ? `Completed ${formatDate(todo.lastCompleted || todo.createdAt)}` : ''}
      </div>
    </div>
    <div class="todo-actions">
      <button class="btn btn-danger delete-btn">Delete</button>
    </div>
  `;
  
  // Add event listeners to the new element
  const checkbox = todoElement.querySelector('.todo-checkbox');
  const deleteBtn = todoElement.querySelector('.delete-btn');
  
  checkbox.addEventListener('change', () => {
    toggleTodo(todo.id);
  });
  
  deleteBtn.addEventListener('click', () => {
    deleteTodo(todo.id);
  });
  
  // Add to the beginning of the list
  todoListContainer.insertBefore(todoElement, todoListContainer.firstChild);
  
  // Add animation
  todoElement.style.opacity = '0';
  todoElement.style.transform = 'translateY(-10px)';
  setTimeout(() => {
    todoElement.style.transition = 'all 0.3s ease';
    todoElement.style.opacity = '1';
    todoElement.style.transform = 'translateY(0)';
  }, 10);
}

// Add blocked URL
function addBlockedUrl() {
    const url = urlInput.value.trim();
    if (!url) return;
    
    chrome.runtime.sendMessage({
        action: 'addBlockedUrl',
        url: url
    }, (response) => {
        if (response && response.success) {
            blockedUrls.push(url);
            updateBlockedUrlsList();
            
            // Reset form
            urlInput.value = '';
        }
    });
}

// Toggle todo completion
function toggleTodo(id) {
  chrome.runtime.sendMessage({
    action: 'toggleTodo',
    id: id
  }, (response) => {
    if (response && response.success) {
      // Prevent storage listener from triggering
      isLocalUpdate = true;
      
      const todo = todoList.find(t => t.id === id);
      if (todo) {
        todo.completed = !todo.completed;
        
        // Update the specific todo element without recreating the entire list
        const todoElement = document.querySelector(`[data-todo-id="${id}"]`);
        if (todoElement) {
          const checkbox = todoElement.querySelector('.todo-checkbox');
          const todoText = todoElement.querySelector('.todo-text');
          const todoMeta = todoElement.querySelector('.todo-meta');
          
          checkbox.checked = todo.completed;
          todoElement.className = `todo-item ${todo.completed ? 'completed' : ''}`;
          
          // Update meta text
          todoMeta.innerHTML = `
            ${todo.recurring ? `🔄 ${todo.recurring}` : ''}
            ${todo.completed ? `Completed ${formatDate(todo.lastCompleted || todo.createdAt)}` : ''}
          `;
        }
        
        updateProgress();
        
        // Check if all todos are completed
        const allCompleted = todoList.length > 0 && todoList.every(t => t.completed);
        if (allCompleted && wasBlocked) {
          setTimeout(() => {
            alert('🎉 Congratulations! All todos completed. You can now access blocked sites.');
            wasBlocked = false;
          }, 500);
        }
      }
      
      // Re-enable storage listener after a short delay
      setTimeout(() => {
        isLocalUpdate = false;
      }, 100);
    }
  });
}

// Delete todo
function deleteTodo(id) {
  chrome.runtime.sendMessage({
    action: 'deleteTodo',
    id: id
  }, (response) => {
    if (response && response.success) {
      // Prevent storage listener from triggering
      isLocalUpdate = true;
      
      // Remove from local array
      todoList = todoList.filter(t => t.id !== id);
      
      // Remove from UI without recreating the entire list
      const todoElement = document.querySelector(`[data-todo-id="${id}"]`);
      if (todoElement) {
        // Add fade-out animation
        todoElement.style.transition = 'all 0.3s ease';
        todoElement.style.opacity = '0';
        todoElement.style.transform = 'translateX(-100%)';
        
        setTimeout(() => {
          todoElement.remove();
          
          // Show empty state if no todos left
          if (todoList.length === 0) {
            todoListContainer.innerHTML = `
              <div class="empty-state">
                <h3>No todos yet</h3>
                <p>Add your first todo item to get started!</p>
              </div>
            `;
          }
        }, 300);
      }
      
      updateProgress();
      
      // Re-enable storage listener after a short delay
      setTimeout(() => {
        isLocalUpdate = false;
      }, 100);
    }
  });
}

// Remove blocked URL
function removeBlockedUrl(url) {
    chrome.runtime.sendMessage({
        action: 'removeBlockedUrl',
        url: url
    }, (response) => {
        if (response && response.success) {
            blockedUrls = blockedUrls.filter(u => u !== url);
            updateBlockedUrlsList();
        }
    });
}

// Update UI
function updateUI() {
    updateBlockingToggle();
    updateTodoList();
    updateBlockedUrlsList();
    updateProgress();
}

// Update blocking toggle
function updateBlockingToggle() {
    blockingToggle.checked = isBlockingEnabled;
}

// Update todo list
function updateTodoList() {
  if (todoList.length === 0) {
    todoListContainer.innerHTML = `
      <div class="empty-state">
        <h3>No todos yet</h3>
        <p>Add your first todo item to get started!</p>
      </div>
    `;
    return;
  }
  
  todoListContainer.innerHTML = todoList.map(todo => `
    <div class="todo-item ${todo.completed ? 'completed' : ''}" data-todo-id="${todo.id}">
      <input type="checkbox" class="todo-checkbox" 
             ${todo.completed ? 'checked' : ''}>
      <div class="todo-content">
        <div class="todo-text">${escapeHtml(todo.text)}</div>
        <div class="todo-meta">
          ${todo.recurring ? `🔄 ${todo.recurring}` : ''}
          ${todo.completed ? `Completed ${formatDate(todo.lastCompleted || todo.createdAt)}` : ''}
        </div>
      </div>
      <div class="todo-actions">
        <button class="btn btn-danger delete-btn">Delete</button>
      </div>
    </div>
  `).join('');
  
  // Add event listeners after creating the HTML
  addTodoEventListeners();
}

// Add event listeners to todo items
function addTodoEventListeners() {
  const todoItems = document.querySelectorAll('.todo-item');
  
  todoItems.forEach(item => {
    const todoId = parseInt(item.dataset.todoId);
    const checkbox = item.querySelector('.todo-checkbox');
    const deleteBtn = item.querySelector('.delete-btn');
    
    // Checkbox event listener
    checkbox.addEventListener('change', () => {
      toggleTodo(todoId);
    });
    
    // Delete button event listener
    deleteBtn.addEventListener('click', () => {
      deleteTodo(todoId);
    });
  });
}

// Update blocked URLs list
function updateBlockedUrlsList() {
  if (blockedUrls.length === 0) {
    blockedUrlsList.innerHTML = `
      <div class="empty-state">
        <h3>No blocked sites</h3>
        <p>Add URLs or domains to block them until you complete your todos.</p>
      </div>
    `;
    return;
  }
  
  blockedUrlsList.innerHTML = blockedUrls.map(url => `
    <div class="blocked-url-item" data-url="${escapeHtml(url)}">
      <span class="blocked-url-text">${escapeHtml(url)}</span>
      <button class="btn btn-danger remove-url-btn">Remove</button>
    </div>
  `).join('');
  
  // Add event listeners for remove buttons
  addBlockedUrlEventListeners();
}

// Add event listeners to blocked URL items
function addBlockedUrlEventListeners() {
  const blockedUrlItems = document.querySelectorAll('.blocked-url-item');
  
  blockedUrlItems.forEach(item => {
    const url = item.dataset.url;
    const removeBtn = item.querySelector('.remove-url-btn');
    
    removeBtn.addEventListener('click', () => {
      removeBlockedUrl(url);
    });
  });
}

// Update progress
function updateProgress() {
    const total = todoList.length;
    const completed = todoList.filter(todo => todo.completed).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${completed} of ${total} completed`;
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'today';
    } else if (diffDays === 2) {
        return 'yesterday';
    } else {
        return `${diffDays - 1} days ago`;
    }
}

// Flag to prevent storage listener from triggering during local operations
let isLocalUpdate = false;

// Listen for storage changes to update UI when data changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && !isLocalUpdate) {
    if (changes.todoList) {
      // Update only the todo list, not the entire UI
      todoList = changes.todoList.newValue || [];
      updateTodoList();
      updateProgress();
    }
    if (changes.blockedUrls) {
      // Update only the blocked URLs list
      blockedUrls = changes.blockedUrls.newValue || [];
      updateBlockedUrlsList();
    }
    if (changes.isBlockingEnabled) {
      // Update only the blocking toggle
      isBlockingEnabled = changes.isBlockingEnabled.newValue || false;
      updateBlockingToggle();
    }
  }
});
