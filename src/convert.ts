import { parseHTML } from "linkedom";
import TurndownService from "turndown";

const NOISE_SELECTORS = [
  "script",
  "style",
  "nav",
  "header",
  "footer",
  "aside",
  "noscript",
  "iframe",
  "svg",
];

function extractMainContent(document: Document): Element {
  const main =
    document.querySelector("article") ??
    document.querySelector("main") ??
    document.body;
  return main;
}

function removeNoiseElements(root: Element): void {
  for (const selector of NOISE_SELECTORS) {
    for (const el of root.querySelectorAll(selector)) {
      el.remove();
    }
  }
}

export function htmlToMarkdown(html: string): string {
  const { document } = parseHTML(html);
  const content = extractMainContent(document);
  removeNoiseElements(content);

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });

  return turndown.turndown(content.innerHTML).trim();
}
