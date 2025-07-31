# Airbnb Scraper - Modular Version

This is a modular version of the Airbnb scraper that splits the functionality into three separate executable parts.

## Files

- `start.js` - Main orchestrator script
- `setup.js` - Creates the file structure for the website
- `scrape.js` - Scrapes the Airbnb listing and writes data to listing.json
- `modify.js` - Modifies index.html based on listing.json data

## Usage

### Main Script (Recommended)

```bash
# Run all commands in sequence
node start.js all <airbnb_url> [template] [languages]

# Run individual commands
node start.js setup <airbnb_url> [template] [languages]
node start.js scrape <airbnb_url>
node start.js modify <airbnb_url>
```

### Individual Scripts

You can also run the individual scripts directly:

```bash
# Setup - Create file structure
node setup.js <airbnb_url> [template] [languages]

# Scrape - Extract data from Airbnb
node scrape.js <airbnb_url>

# Modify - Update HTML based on scraped data
node modify.js <airbnb_url>
```

## Examples

```bash
# Complete workflow with default template
node start.js all https://www.airbnb.com/rooms/123456789

# Complete workflow with specific template
node start.js all https://www.airbnb.com/rooms/123456789 v1

# With translations
node start.js all https://www.airbnb.com/rooms/123456789 v1 es,fr
node start.js all https://www.airbnb.com/rooms/123456789 es,fr

# Step by step
node start.js setup https://www.airbnb.com/rooms/123456789 v1
node start.js scrape https://www.airbnb.com/rooms/123456789
node start.js modify https://www.airbnb.com/rooms/123456789
```

## Template System

The setup script now uses a template system:

- **Template Directory**: `templates/[template_name]/`
- **Default Template**: `v1` (if no template specified)
- **Destination**: `demo/[listing_id]/`

### Template Structure

```
templates/
├── v1/
│   ├── index.html          # Regular version
│   ├── index_lang.html     # Language-enabled version
│   ├── css/
│   │   ├── styles.css
│   │   ├── lang.css        # Language-specific styles
│   │   └── ...
│   ├── js/
│   │   ├── script.js
│   │   ├── lang.js         # Language functionality
│   │   └── translations.js # Translation data
│   ├── images/
│   ├── webfonts/
│   ├── _headers
│   └── _redirects
```

### Language Support

When languages are specified:

- `index.html` is skipped (not copied)
- `index_lang.html` is renamed to `index.html`
- Language-specific files are included: `js/lang.js`, `css/lang.css`, `js/translations.js`, `_redirects`

When no languages are specified:

- `index_lang.html` is skipped
- Language-specific files are excluded

## Workflow

1. **Setup** - Creates the project directory in `demo/[listing_id]/` and copies template files
2. **Scrape** - Extracts data from Airbnb and saves to `listing.json`
3. **Modify** - Updates `index.html` with the scraped data

## Dependencies

Make sure you have the required dependencies installed:

```bash
npm install playwright
```

## Error Handling

Each script includes proper error handling:

- Validates Airbnb URL format
- Checks for required files/directories
- Provides clear error messages
- Exits with appropriate error codes

## Benefits of Modular Structure

1. **Separation of Concerns** - Each script has a single responsibility
2. **Reusability** - Can run individual steps as needed
3. **Debugging** - Easier to identify and fix issues
4. **Flexibility** - Can run steps in different orders or skip steps
5. **Maintenance** - Easier to maintain and update individual components
6. **Template System** - Support for multiple website templates
7. **Language Support** - Conditional inclusion of language-specific files

## File Structure

After running the scripts, you'll have:

```
demo/
└── <listing_id>/
    ├── index.html          # Main website file
    ├── listing.json        # Scraped data
    ├── LISTING.md          # Markdown version of data
    ├── images/             # Folder for downloaded images
    ├── css/               # Style files
    ├── js/                # JavaScript files
    └── webfonts/          # Font files
```
