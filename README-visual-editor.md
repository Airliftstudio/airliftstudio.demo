# Visual Website Editor

A powerful visual editor for website projects that allows you to upload, preview, edit text content, and download modified projects.

## 🚀 Quick Start

1. **Start the local server** (required for demo functionality):

   ```bash
   python3 -m http.server 8000
   ```

2. **Open the editor**:
   ```
   http://localhost:8000/visual-editor-complete.html
   ```

## 📁 Supported Project Formats

- **ZIP Files**: Upload compressed project folders
- **Folder Upload**: Select entire project directories via browser
- **Demo Project**: Try the villa-zori sample project

## ✨ Features

### 📤 Upload & Import

- Drag & drop ZIP files or folders
- Automatic file type detection
- Resource loading for CSS, JS, images, and fonts
- Load demo project with one click

### 👀 Live Preview

- Real-time website rendering in iframe
- Automatic resource path resolution
- Responsive preview interface

### ✏️ Visual Text Editing

- **Enable Edit Mode**: Toggle editing capabilities
- **Click to Edit**: Click any text element to modify it inline
- **Visual Feedback**: Hover effects and editing indicators
- **Smart Selection**: Automatically identifies editable text
- **Keyboard Shortcuts**:
  - `Enter`: Save changes
  - `Escape`: Cancel editing

### 💾 Project Management

- **Change Tracking**: See all modifications with counter
- **File List**: View all project files with modification status
- **Reset Changes**: Undo all edits with one click
- **Download ZIP**: Export complete modified project

## 🎯 How to Use

### Method 1: Upload Your Own Project

1. Click "Choose ZIP" or "Choose Folder"
2. Select your website project
3. Wait for files to load and preview to appear
4. Enable edit mode and start editing

### Method 2: Try the Demo

1. Click "Load villa-zori demo project"
2. Wait for the demo to load
3. Enable edit mode
4. Click any text to edit it

### Editing Text

1. **Enable Edit Mode**: Click the "Enable Edit Mode" button
2. **Select Text**: Click on any text element (headings, paragraphs, buttons, etc.)
3. **Edit**: Type your changes directly
4. **Save**: Press Enter or click outside the element
5. **Cancel**: Press Escape to discard changes

### Download Your Changes

1. Make your edits
2. Click "Download Project"
3. Get a ZIP file with all your modifications

## 🛠 Technical Details

### Supported File Types

- **HTML**: `.html` files (main content)
- **CSS**: `.css` files (styling)
- **JavaScript**: `.js` files (functionality)
- **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`
- **Fonts**: `.woff`, `.woff2`, `.ttf`
- **Data**: `.json`, `.txt`, `.md`

### Project Structure

Your project should have this structure:

```
project-folder/
├── index.html          # Main HTML file (required)
├── css/               # CSS files
│   └── styles.css
├── js/                # JavaScript files
│   └── script.js
├── images/            # Images
│   ├── hero.jpg
│   └── logo.png
└── other files...
```

### Browser Requirements

- Modern browser with ES6+ support
- File API support for uploads
- Blob URL support for preview
- PostMessage API for iframe communication

## 🔧 Troubleshooting

### Preview Not Loading

- Make sure you're running a local HTTP server
- Check browser console for errors
- Verify your project has an `index.html` file

### CSS Not Applied

- Ensure CSS files are in the correct relative paths
- Check that CSS files were loaded (see file list)
- Verify CSS file paths in HTML match your project structure

### Can't Edit Text

- Make sure Edit Mode is enabled (red button)
- Only text elements are editable (not images or complex components)
- Some navigation elements are excluded from editing

### Download Issues

- Check browser allows downloads
- Verify you have made some changes to download
- Large projects may take a moment to prepare

## 🎨 Example Projects

The editor works best with projects similar to the villa-zori demo:

- Static HTML websites
- Landing pages
- Portfolio sites
- Airbnb listing websites
- Marketing pages

## 📝 Notes

- Changes are only saved when you download the project
- The editor creates blob URLs for resources, so refreshing will lose changes
- Text editing works on most HTML elements but excludes complex components
- Navigation menus are excluded from editing to preserve functionality
