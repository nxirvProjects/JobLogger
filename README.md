# Job Logger Chrome Extension

A Chrome extension that helps you track your job applications with both automatic detection and manual entry capabilities.

## Features

- ✅ **Automatic Job Detection** - Detects when you're on job application pages
- ✅ **Manual Confirmation** - Shows a popup asking if you applied (no false positives!)
- ✅ **Manual Job Entry** - Add jobs manually as backup
- ✅ **Local Storage** - Jobs persist between browser sessions
- ✅ **CSV Export** - Download your job data to Excel/Google Sheets
- ✅ **Job History** - View all logged jobs with timestamps
- ✅ **Toggle Auto-Detection** - Enable/disable automatic detection
- ✅ **Individual Deletion** - Remove specific jobs
- ✅ **Clear All** - Bulk delete all jobs

## Installation

### Method 1: Load from Source (Recommended)

1. **Download the Extension**
   - Clone this repository or download the ZIP file
   - Extract to a folder on your computer

2. **Open Chrome Extensions**
   - Open Chrome and go to `chrome://extensions/`
   - Or click the three dots menu → More tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The Job Logger extension should now appear in your extensions list

5. **Pin the Extension**
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Job Logger" and click the pin icon to keep it visible

### Method 2: Install from Chrome Web Store (Coming Soon)

*This extension will be available on the Chrome Web Store soon.*

## How to Use

### Automatic Job Detection

1. **Enable Auto-Detection** (default: ON)
   - Open the extension popup
   - Make sure the "Auto-detect" toggle is enabled

2. **Browse Job Sites**
   - Visit job sites like Indeed, LinkedIn, Glassdoor, etc.
   - The extension will detect job application pages

3. **Confirm Applications**
   - When you visit a job page, a popup will appear asking: "Did you apply to a job?"
   - Click "Yes, Log It" if you applied, or "No" to dismiss
   - The popup auto-dismisses after 10 seconds

### Manual Job Entry

1. **Open the Extension**
   - Click the Job Logger icon in your toolbar

2. **Add a Job**
   - Enter the company name
   - Enter the job title
   - Click "Add Job"

3. **View Your Jobs**
   - All logged jobs appear in the "Recent Jobs" list
   - Jobs are sorted by date (newest first)
   - Shows company, title, and timestamp

### Exporting Data

1. **Download CSV**
   - Click "Download CSV" in the extension popup
   - File will be named `job_applications_YYYY-MM-DD.csv`
   - Open in Excel, Google Sheets, or any spreadsheet app

### Managing Jobs

- **Delete Individual Jobs**: Click the × button next to any job
- **Clear All Jobs**: Click "Clear All Jobs" (with confirmation)
- **Toggle Auto-Detection**: Use the toggle in the popup header

## Supported Job Sites

The extension works on most job sites including:
- Indeed
- LinkedIn
- Glassdoor
- Monster
- CareerBuilder
- ZipRecruiter
- SimplyHired
- Dice
- Angel.co
- Stack Overflow
- GitHub Jobs
- And many more!

## Privacy

- **Local Storage Only**: All job data is stored locally on your computer
- **No External Servers**: Data is never sent to external servers
- **Private**: Your job applications remain completely private
- **Browser Storage**: Data persists between browser sessions

## Troubleshooting

### Extension Not Working?
1. Make sure Developer mode is enabled
2. Try reloading the extension in `chrome://extensions/`
3. Check that the extension is pinned to your toolbar

### Auto-Detection Not Triggering?
1. Verify the "Auto-detect" toggle is enabled
2. Make sure you're on a job application page
3. Wait 2-3 seconds for the popup to appear
4. Try refreshing the page

### Jobs Not Saving?
1. Check that you have storage permission
2. Try clearing browser cache and reloading
3. Make sure you're not in incognito mode

### CSV Download Not Working?
1. Make sure you have jobs logged
2. Check your browser's download settings
3. Try a different browser if issues persist

## File Structure

```
jobLogger/
├── manifest.json      # Extension configuration
├── popup.html         # Extension popup interface
├── popup.js           # Popup functionality
├── content.js         # Automatic job detection
└── README.md          # This file
```

## Development

### Making Changes
1. Edit the files in your extension folder
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Job Logger extension
4. Test your changes

### Common Modifications
- **Add Job Sites**: Edit the `jobSites` array in `content.js`
- **Change Popup Style**: Modify CSS in `popup.html`
- **Add Fields**: Update the job object structure in both `popup.js` and `content.js`

## Version History

- **v2.2** - Polished UI, added CSV upload, and converted 'Clear All' to a safer menu option.
- **v2.1** - Added automatic job detection with manual confirmation.
- **v2.0** - Initial manual job logger with CSV export.
- **v1.4** - Original Google Sheets integration.

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the extension!

## License

This project is open source and available under the MIT License.

---

**Happy job hunting! 🚀** 