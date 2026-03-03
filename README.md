# html2md

A CLI tool that converts HTML files (e.g. saved from a browser) into clean, readable Markdown.

It automatically extracts the main content of a page (`<article>`, `<main>`, or `<body>`) and strips out noise elements like navigation, headers, footers, scripts, and styles.

## Stack

- **TypeScript** (Node.js)
- **linkedom** for lightweight HTML parsing
- **turndown** for HTML-to-Markdown conversion
- **vitest** for testing
- **eslint** for linting

## Getting Started

```bash
pnpm install
```

## Usage

Convert an HTML file to Markdown (writes a `.md` file alongside the original):

```bash
pnpm start page.html
```

Output to stdout instead:

```bash
pnpm start page.html --stdout
```

## Scripts

| Command          | Description                  |
| ---------------- | ---------------------------- |
| `pnpm start`    | Run the CLI                  |
| `pnpm test`     | Run tests with vitest        |
| `pnpm run lint` | Lint source and test files   |
| `pnpm run build`| Type-check with TypeScript   |

## How It Works

1. Parses the HTML using **linkedom**
2. Selects the main content container (`<article>` > `<main>` > `<body>`)
3. Removes noise elements (`<script>`, `<style>`, `<nav>`, `<header>`, `<footer>`, `<aside>`, `<noscript>`, `<iframe>`, `<svg>`)
4. Converts the cleaned HTML to Markdown using **turndown**
