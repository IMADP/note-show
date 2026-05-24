# Note Show - AI Agent Instructions

This document describes how to read and modify a Note Show notebook file. Note Show is a browser-based markdown notebook that stores all data in a single JSON file on the user's hard drive.

## File Format

The notebook file is a JSON file with this structure:

```json
{
  "version": 1,
  "folders": [
    {
      "id": "uuid-string",
      "name": "Folder Name",
      "collapsed": false,
      "pages": [
        {
          "id": "uuid-string",
          "title": "Page Title",
          "content": "Markdown content here",
          "createdAt": "2025-01-15T12:00:00.000Z",
          "updatedAt": "2025-01-15T12:00:00.000Z"
        }
      ]
    }
  ]
}
```

### Fields

**Top level:**
- `version` - Must be `1`. Do not change this value.
- `folders` - An ordered array of folder objects. The array order determines the display order in the sidebar.

**Folder:**
- `id` - A unique UUID v4 string.
- `name` - The folder's display name.
- `collapsed` - Whether the folder is collapsed in the sidebar. Set to `false` for new folders.
- `pages` - An ordered array of page objects within this folder. The array order determines the display order.

**Page:**
- `id` - A unique UUID v4 string.
- `title` - The page's display title.
- `content` - The page's body as a markdown string. Supports standard markdown, GFM (tables, task lists, strikethrough), math (KaTeX), and fenced code blocks with syntax highlighting.
- `createdAt` - ISO 8601 timestamp of when the page was created.
- `updatedAt` - ISO 8601 timestamp of when the page was last modified.

## Before Modifying the File

**Always create a backup before making changes.** Copy the notebook file to `<filename>-backup.json` in the same directory, overwriting any existing backup. For example, if the notebook is `notes.json`, create `notes-backup.json`.

## Adding a Folder

To add a new folder, append a folder object to the `folders` array:

```json
{
  "id": "generate-a-new-uuid-v4",
  "name": "My New Folder",
  "collapsed": false,
  "pages": []
}
```

## Adding a Page

To add a new page, append a page object to the `pages` array of the target folder:

```json
{
  "id": "generate-a-new-uuid-v4",
  "title": "My New Page",
  "content": "Your markdown content here.",
  "createdAt": "2025-01-15T12:00:00.000Z",
  "updatedAt": "2025-01-15T12:00:00.000Z"
}
```

Set both `createdAt` and `updatedAt` to the current time in ISO 8601 format.

## Important Rules

1. **Do not change the `version` field.** It must remain `1`.
2. **All `id` fields must be unique UUID v4 strings.** Do not reuse IDs.
3. **Preserve existing data.** When adding folders or pages, do not remove or modify existing entries unless explicitly asked.
4. **Write valid JSON.** The file must be parseable JSON. Use 2-space indentation for readability.
5. **The entire file is read and written atomically.** There are no partial updates. Always read the full file, make your changes, and write the full file back.
6. **Markdown content is a plain string.** Newlines in the content field should be encoded as `\n` within the JSON string. Do not use raw HTML in content.
