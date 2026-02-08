# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A client-side single-page application for parsing and viewing Xray-core GeoIP/GeoSite `.dat` files (binary protobuf). No backend — all processing happens in the browser.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:5173
npm run build        # Production build to dist/
npm run preview      # Preview production build
npm run format       # Format with Prettier
npm run lint:ts      # Type-check with tsc --noEmit
```

No test runner is configured.

## Architecture

TypeScript modules with Web Worker for off-main-thread processing:

- **`src/main.ts`** — Entry point. Handles file input (drag-and-drop + file picker), wires up UI events (parse, search/filter), orchestrates decode→render flow. Manages module-level state (selected file, parsed result). Uses `performance.mark`/`measure` for timing.

- **`src/worker/DecodeWorkerClient.ts`** — Main-thread client wrapping the Web Worker. Provides async `decode`/`filter` methods, manages request/response via Promises keyed by UUID.

- **`src/worker/decode.worker.ts`** — Web Worker running off the main thread. Handles protobuf decoding and entry filtering. Loads `public/geoip.proto` schema via protobufjs (cached after first load), auto-detects GeoIP vs GeoSite from filename, deserializes binary data into structured entry arrays. Caches decoded entries for subsequent filter calls.

- **`src/worker/formatIp.ts`** — IPv4/IPv6 formatting with zero-compression for IPv6. Converts raw protobuf CIDR bytes to human-readable CIDR strings.

- **`src/worker/messages.ts`** — Shared TypeScript types for worker request/response communication. Defines `MESSAGE_KIND` constants and typed request/response interfaces.

- **`src/types.ts`** — Domain types (GeoIPEntry, GeoSiteEntry, DecodedResult, etc.) and type guards (`isGeoIPEntry`, `isGeoSiteEntry`).

- **`src/utils.ts`** — Small utility functions (debounce, formatBytes).

- **`src/renderer/results.ts`** — DOM rendering for entry lists using `<details>` elements and `DocumentFragment` for bulk inserts. Includes copy-to-clipboard producing Xray route format (`ext:filename:tag`).

- **`src/renderer/summary.ts`** — DOM rendering for file metadata and totals.

- **`src/style.css`** — Dark/light mode via `prefers-color-scheme` with CSS custom properties.

- **`index.html`** — SPA shell with SEO meta tags (Open Graph, Twitter Cards, structured data), PWA manifest, and Apple splash screens.

- **`public/manifest.json`** — PWA web app manifest.

- **`vite.config.ts`** — Build config with manual chunk splitting for protobufjs and ES-format worker output.

## Tech Stack

TypeScript (ES modules), Vite 7, protobufjs 8, Web Workers, Prettier. No framework. The proto schema in `public/geoip.proto` defines the GeoIP/GeoSite message types from Xray-core. PWA-ready with web app manifest and Apple splash screens.

## Conventions

- Direct DOM manipulation (getElementById, createElement, DocumentFragment for bulk inserts)
- Async/await for file reading and proto loading
- State passed as function parameters, no global state object

### Basic Principles

- Use English for all code and documentation.
- Always declare the type of each variable and function (parameters and return value).
  - Avoid using any.
  - Create necessary types.
- Use JSDoc to document public classes and methods.
- Don't leave blank lines within a function.
- One export per file.

### Nomenclature

- Use PascalCase for classes.
- Use camelCase for variables, functions, and methods.
- Use UPPERCASE for environment variables or top level constants.
  - Avoid magic numbers and define constants.
- Start each function with a verb.
- Use verbs for boolean variables. Example: isLoading, hasError, canDelete, etc.
- Use complete words instead of abbreviations and correct spelling.
  - Except for standard abbreviations like API, URL, etc.
  - Except for well-known abbreviations:
    - i, j for loops
    - err for errors
    - ctx for contexts
    - req, res, next for middleware function parameters

### Functions

- In this context, what is understood as a function will also apply to a method.
- Write short functions with a single purpose. Less than 20 instructions.
- Name functions with a verb and something else.
  - If it returns a boolean, use isX or hasX, canX, etc.
  - If it doesn't return anything, use executeX or saveX, etc.
- Avoid nesting blocks by:
  - Early checks and returns.
  - Extraction to utility functions.
- Use higher-order functions (map, filter, reduce, etc.) to avoid function nesting.
  - Use arrow functions for simple functions (less than 3 instructions).
  - Use named functions for non-simple functions.
- Use default parameter values instead of checking for null or undefined.
- Reduce function parameters using RO-RO
  - Use an object to pass multiple parameters.
  - Use an object to return results.
  - Declare necessary types for input arguments and output.
- Use a single level of abstraction.

### Data

- Don't abuse primitive types and encapsulate data in composite types.
- Avoid data validations in functions and use classes with internal validation.
- Prefer immutability for data.
  - Use readonly for data that doesn't change.
  - Use as const for literals that don't change.

### Classes

- Follow SOLID principles.
- Prefer composition over inheritance.
- Declare interfaces to define contracts.
- Write small classes with a single purpose.
- Less than 200 instructions.
- Less than 10 public methods.
- Less than 10 properties.

### Exceptions

- Use exceptions to handle errors you don't expect.
- If you catch an exception, it should be to:
  - Fix an expected problem.
  - Add context.
  - Otherwise, use a global handler.
