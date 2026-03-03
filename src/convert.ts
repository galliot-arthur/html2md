import { parseHTML } from "linkedom";
import TurndownService from "turndown";
// @ts-expect-error no type declarations available
import { gfm } from "turndown-plugin-gfm";

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

function resolveConfluenceEmoticons(root: Element, document: Document): void {
  for (const img of root.querySelectorAll("img.emoticon")) {
    const alt = img.getAttribute("alt") ?? "";
    const text = document.createTextNode(alt);
    img.replaceWith(text);
  }
}

function removeConfluenceMacroImages(root: Element): void {
  for (const img of root.querySelectorAll("img.editor-inline-macro")) {
    img.remove();
  }
}

function cleanHeadings(root: Element): void {
  for (const h of root.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
    // Remove leading/trailing <br> inside headings
    while (h.firstElementChild?.tagName === "BR") h.firstElementChild.remove();
    while (h.lastElementChild?.tagName === "BR") h.lastElementChild.remove();
    // Remove empty headings
    if (!h.textContent?.trim()) h.remove();
  }
}

function convertConfluenceCodeBlocks(root: Element, document: Document): void {
  for (const table of root.querySelectorAll('table[data-macro-name="code"]')) {
    const pre = table.querySelector("pre");
    if (pre) {
      const lang =
        table
          .getAttribute("data-macro-parameters")
          ?.match(/language=([^|]+)/)?.[1] ?? "";
      const codeBlock = document.createElement("pre");
      const code = document.createElement("code");
      if (lang) code.setAttribute("class", `language-${lang}`);
      code.textContent = pre.textContent;
      codeBlock.appendChild(code);
      table.replaceWith(codeBlock);
    }
  }
}

const BR_PLACEHOLDER = "\u200B\u200B!!BR!!\u200B\u200B";

function flattenTableCells(root: Element, document: Document): void {
  for (const cell of root.querySelectorAll("td, th")) {
    // Flatten <li> into text separated by placeholders, then remove <ul>/<ol>
    for (const list of cell.querySelectorAll("ul, ol")) {
      const items = Array.from(list.querySelectorAll("li"));
      const text = items
        .map((li) => li.textContent?.trim())
        .filter((i) => !!i)
        .join(BR_PLACEHOLDER);
      list.replaceWith(document.createTextNode(text));
    }
    // Replace all <br> with placeholder text
    for (const br of cell.querySelectorAll("br")) {
      br.replaceWith(document.createTextNode(BR_PLACEHOLDER));
    }
    // Unwrap <p> tags: replace with content separated by placeholders
    const paragraphs = cell.querySelectorAll("p");
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const fragment = document.createDocumentFragment();
      if (i > 0) fragment.appendChild(document.createTextNode(BR_PLACEHOLDER));
      while (p.firstChild) fragment.appendChild(p.firstChild);
      p.replaceWith(fragment);
    }
  }
}

function extractCodeBlocksFromTableCells(
  root: Element,
  document: Document,
): void {
  for (const table of root.querySelectorAll("table")) {
    if (table.getAttribute("data-macro-name")) continue;

    for (const cell of table.querySelectorAll("td, th")) {
      const nestedCodeTables = cell.querySelectorAll(
        'table[data-macro-name="code"]',
      );
      if (nestedCodeTables.length === 0) continue;

      const codeBlocks: Element[] = [];
      for (const codeMacro of nestedCodeTables) {
        const pre = codeMacro.querySelector("pre");
        if (pre) {
          const lang =
            codeMacro
              .getAttribute("data-macro-parameters")
              ?.match(/language=([^|]+)/)?.[1] ?? "";
          const codeBlock = document.createElement("pre");
          const code = document.createElement("code");
          if (lang) code.setAttribute("class", `language-${lang}`);
          code.textContent = pre.textContent;
          codeBlock.appendChild(code);
          codeBlocks.push(codeBlock);
        }
        codeMacro.remove();
      }

      if (codeBlocks.length > 0) {
        const parent = table.parentNode;
        const nextSibling = table.nextSibling;
        for (const block of codeBlocks) {
          parent?.insertBefore(block, nextSibling);
        }
        // Clean residual wrapper elements left in the cell
        for (const wrapper of cell.querySelectorAll(
          "div.content-wrapper, div",
        )) {
          while (wrapper.firstChild) {
            wrapper.parentNode?.insertBefore(wrapper.firstChild, wrapper);
          }
          wrapper.remove();
        }
        for (const p of cell.querySelectorAll("p")) {
          if (!p.textContent?.trim()) p.remove();
        }
        for (const br of cell.querySelectorAll("br")) {
          br.remove();
        }
      }
    }
  }
}

function normalizeTables(root: Element, document: Document): void {
  for (const table of root.querySelectorAll("table")) {
    // Skip tables already handled (e.g. code macro tables)
    if (table.getAttribute("data-macro-name")) continue;

    // Remove <colgroup> elements that serve no purpose in Markdown
    for (const col of table.querySelectorAll("colgroup")) {
      col.remove();
    }

    flattenTableCells(table, document);

    // If no <thead> exists, promote the first row to <thead>
    if (!table.querySelector("thead")) {
      const tbody = table.querySelector("tbody");
      const firstRow = tbody?.querySelector("tr");
      if (firstRow) {
        for (const td of firstRow.querySelectorAll("td")) {
          const th = document.createElement("th");
          th.innerHTML = td.innerHTML;
          td.replaceWith(th);
        }
        const thead = document.createElement("thead");
        thead.appendChild(firstRow);
        table.insertBefore(thead, table.firstChild);
      }
    }

    // Strip rowspan/colspan attributes (unsupported in GFM tables)
    for (const cell of table.querySelectorAll("td, th")) {
      cell.removeAttribute("rowspan");
      cell.removeAttribute("colspan");
    }
  }
}

export function htmlToMarkdown(html: string): string {
  const { document } = parseHTML(html);
  const content = extractMainContent(document);
  removeNoiseElements(content);
  resolveConfluenceEmoticons(content, document);
  removeConfluenceMacroImages(content);
  cleanHeadings(content);
  extractCodeBlocksFromTableCells(content, document);
  convertConfluenceCodeBlocks(content, document);
  normalizeTables(content, document);

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  turndown.use(gfm);

  // Minimal escaping: skip underscores, hyphens, and brackets
  turndown.escape = (str: string) =>
    str.replace(/([\\*#+=|{}`~>])/g, "\\$1").replace(/^(\d+)\. /g, "$1\\. ");

  let md = turndown.turndown(content.innerHTML).trim();

  // Replace placeholders with <br>, then clean up empty/trailing ones in cells
  const brRe = new RegExp(BR_PLACEHOLDER, "g");
  md = md.replace(brRe, "<br>");
  // Remove leading/trailing <br> in table cells and collapse whitespace around them
  md = md.replace(/\| *(<br>)+ */g, "| ");
  md = md.replace(/ *(<br>)+ *\|/g, " |");

  return md;
}
