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
```

No test runner or linter is configured.

## Architecture

TypeScript modules with Web Worker for off-main-thread processing:

- **`src/main.ts`** — Entry point. Handles file input (drag-and-drop + file picker), wires up UI events (parse, search/filter), orchestrates decode→render flow. Manages module-level state (selected file, parsed result).

- **`src/worker/DecodeWorkerClient.ts`** — Main-thread client wrapping the Web Worker. Provides async decode/filter methods, manages request/response communication via Promises.

- **`src/worker/decode.worker.ts`** — Web Worker that runs off the main thread. Handles protobuf decoding and entry filtering. Loads `public/geoip.proto` schema via protobufjs (cached after first load), auto-detects GeoIP vs GeoSite from filename, deserializes binary data into structured entry arrays with formatted IPs/CIDRs or domain lists.

- **`src/worker/messages.ts`** — Shared TypeScript types for worker request/response communication.

- **`src/types.ts`** — Domain types (GeoIPEntry, GeoSiteEntry, DecodedResult, etc.).

- **`src/utils.ts`** — Small utility functions (debounce, formatBytes).

- **`src/renderer/results.ts`** — DOM rendering for entry lists. Uses lazy `<details>` expansion (content built on first toggle) for performance. Includes copy-to-clipboard producing Xray route format (`ext:filename:tag`).

- **`src/renderer/summary.ts`** — DOM rendering for file metadata and totals.

- **`src/style.css`** — Dark/light mode via `prefers-color-scheme` with CSS custom properties.

## Tech Stack

TypeScript (ES modules), Vite 7, protobufjs 8, Web Workers. No framework. The proto schema in `public/geoip.proto` defines the GeoIP/GeoSite message types from Xray-core.

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
