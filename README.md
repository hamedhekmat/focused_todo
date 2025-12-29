# Focused Todo - Chrome Extension

A Chrome extension that combines a todo list with URL blocking to help you stay focused.

## Features

- **Todo List**: Add tasks with optional daily repeat functionality
- **URL Blocking**: Block distracting websites and redirect to the todo list
- **Daily Reset**: Tasks marked as "repeats daily" automatically reset at midnight
- **Persistent Storage**: All data is saved locally in Chrome storage

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build
```

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

## Development

Run the development build with watch mode:
```bash
npm run dev
```

## Usage

- Click the extension icon to open the popup, or set it as your new tab page
- Add tasks in the top section, optionally marking them to repeat daily
- Add URLs to block in the bottom section
- When you try to visit a blocked URL, you'll be redirected to the todo list page

## Project Structure

```
focused_todo/
├── src/
│   ├── components/
│   │   ├── TodoList.js
│   │   └── UrlBlockList.js
│   ├── App.js
│   ├── index.js
│   ├── background.js
│   ├── index.html
│   └── popup.html
├── dist/          (generated after build)
├── manifest.json
├── webpack.config.js
└── package.json
```

