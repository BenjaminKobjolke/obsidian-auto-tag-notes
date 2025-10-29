# Auto Tag Notes

An Obsidian plugin that automatically adds and updates author metadata and timestamps in your note frontmatter.

## Features

This plugin automatically manages frontmatter metadata for your notes:

- **Author tracking**: Records who created the note
- **Creation timestamp**: Tracks when the note was first created
- **Last updated timestamp**: Updates automatically when you modify a note
- **Last editor tracking**: Records who last edited the note (useful for collaborative environments)

## Example Output

When you create or edit a note, the plugin automatically adds/updates frontmatter like this:

```yaml
---
Author: John Doe <john.doe@example.com>
Created at: '2025-10-21 13:03:31'
Last updated at: '2025-10-21 14:25:42'
Last edited by: John Doe <john.doe@example.com>
---
```

## How It Works

- **On note creation**: Adds complete frontmatter with author, creation time, last updated time, and last editor
- **On note modification**: Updates the "Last updated at" and "Last edited by" fields while preserving the original author and creation date
- **Smart behavior**: Only processes notes when author information is configured
- **Cross-platform**: Works on desktop and mobile (Android/iOS)

## Installation

### From Git Repository

1. Navigate to your vault's plugins folder:
   ```bash
   cd /path/to/your/vault/.obsidian/plugins
   ```

2. Clone this repository:
   ```bash
   git clone <repository-url> obsidian-auto-tag-notes
   ```

3. Install dependencies and build:
   ```bash
   cd obsidian-auto-tag-notes
   npm install
   npm run build
   ```

4. Reload Obsidian and enable the plugin in Settings → Community Plugins

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release
2. Create a folder: `YourVault/.obsidian/plugins/obsidian-auto-tag-notes/`
3. Copy the downloaded files into that folder
4. Reload Obsidian and enable the plugin in Settings → Community Plugins

## Configuration

1. Open Obsidian Settings
2. Go to Community Plugins → Auto Tag Notes
3. Configure your author information:
   - **Author Name**: Your name (required)
   - **Author Email**: Your email address (optional)

If author name is not set, the plugin will show a notification reminding you to configure it when you try to create or edit a note.

## Usage

Once configured, the plugin works automatically:

- Create a new note → frontmatter is added automatically
- Edit an existing note → "Last updated at" and "Last edited by" fields are updated
- Manual update: Use the command palette (Ctrl/Cmd + P) and search for "Update frontmatter metadata"

## Development

### Building from Source

```bash
npm install
npm run build
```

### Development Mode

```bash
npm run dev
```

This starts compilation in watch mode - changes to `main.ts` are automatically compiled to `main.js`.

## License

MIT
