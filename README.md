# DAT Reader

A client-side web tool for parsing and viewing Xray-core GeoIP and GeoSite `.dat` files directly in the browser.

All processing happens locally -- no files are uploaded to any server.

## Features

- Drag-and-drop or file picker for `.dat` files
- Auto-detects GeoIP vs GeoSite format (or manual selection)
- Search and filter entries by tag name or content
- Copy entry tags in Xray route format (`ext:filename:tag`)
- Dark/light theme based on system preference
- Installable as a PWA

## Tech Stack

TypeScript, Vite, protobufjs, Web Workers.

## Development

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Production build
npm run format       # Format code with Prettier
npm run lint:ts      # Type-check with tsc
```

## License

MIT
