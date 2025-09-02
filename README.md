# 🎯 Focused Todo - Chrome Extension

A Chrome extension that helps you stay focused by blocking distracting websites until you complete your todo list.

## Features

- **Todo List Management**: Add, complete, and delete todo items
- **Recurring Todos**: Set todos to refresh daily or weekly
- **Website Blocking**: Block specific URLs or domains until todos are completed
- **Progress Tracking**: Visual progress bar showing completion status
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Auto-blocking**: Automatically opens the extension popup when accessing blocked sites

## Installation

### Method 1: Load as Unpacked Extension (Development)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The extension should now appear in your extensions list

### Method 2: Create Icons (Required)

Before using the extension, you need to create icon files:

1. Create three PNG icon files:
   - `icons/icon16.png` (16x16 pixels)
   - `icons/icon48.png` (48x48 pixels) 
   - `icons/icon128.png` (128x128 pixels)

2. You can use any image editor or online icon generator to create these files

## Usage

### Getting Started

1. Click the extension icon in your Chrome toolbar
2. Toggle the "Blocking" switch to enable website blocking
3. Add URLs or domains you want to block in the "Blocked Sites" tab
4. Add your todo items in the "Todo List" tab

### Adding Todos

1. Go to the "Todo List" tab
2. Type your todo item in the input field
3. Optionally check "Recurring" and select daily or weekly
4. Click "Add" or press Enter

### Adding Blocked Sites

1. Go to the "Blocked Sites" tab
2. Enter a URL or domain (e.g., "facebook.com" or "https://youtube.com")
3. Click "Block"

### How Blocking Works

- When you try to access a blocked site, the extension popup will automatically open
- You'll see a red notification banner indicating the site is blocked
- Complete all your todos to unlock access to blocked sites
- The extension will show your progress with a visual progress bar

### Recurring Todos

- **Daily**: Todo resets every day at midnight
- **Weekly**: Todo resets every 7 days from when it was last completed

## File Structure

```
focused_todo/
├── manifest.json          # Extension configuration
├── background/
│   └── background.js      # Background script for blocking logic
├── popup/
│   ├── popup.html         # Extension popup interface
│   ├── popup.css          # Styles for the popup
│   └── popup.js           # Popup functionality
├── icons/
│   ├── icon16.png         # 16x16 icon (create this)
│   ├── icon48.png         # 48x48 icon (create this)
│   └── icon128.png        # 128x128 icon (create this)
├── contentScript.js       # Content script for page interactions
└── README.md              # This file
```

## Permissions

The extension requires the following permissions:

- **activeTab**: To interact with the current tab
- **storage**: To save todo list and blocked URLs
- **webRequest**: To intercept and block web requests
- **webRequestBlocking**: To cancel blocked requests
- **tabs**: To access tab information

## Development

### Making Changes

1. Edit the relevant files in the extension
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test your changes

### Debugging

- Use Chrome DevTools to debug the popup (right-click extension icon → Inspect)
- Check the background script console in the extensions page
- Use `console.log()` statements for debugging

## Troubleshooting

### Extension Not Loading

- Make sure all required files are present
- Check that icon files are proper PNG images
- Verify the manifest.json syntax is correct

### Blocking Not Working

- Ensure the "Blocking" toggle is enabled
- Check that you have added URLs to the blocked list
- Verify the extension has the required permissions

### Todos Not Saving

- Check that the extension has storage permissions
- Try refreshing the extension in `chrome://extensions/`

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.
