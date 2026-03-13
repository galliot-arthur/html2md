import { describe, it, expect } from "vitest";
import { htmlToMarkdown } from "../src/convert.js";

describe("htmlToMarkdown", () => {
  it("converts paragraphs", () => {
    const html = "<html><body><p>Hello world</p></body></html>";
    expect(htmlToMarkdown(html)).toBe("Hello world");
  });

  it("converts headings", () => {
    const html = `<html><body>
      <h1>Title</h1>
      <h2>Subtitle</h2>
      <h3>Section</h3>
    </body></html>`;
    const md = htmlToMarkdown(html);
    expect(md).toContain("# Title");
    expect(md).toContain("## Subtitle");
    expect(md).toContain("### Section");
  });

  it("converts links", () => {
    const html = `<html><body><a href="https://example.com">Example</a></body></html>`;
    expect(htmlToMarkdown(html)).toBe("[Example](https://example.com)");
  });

  it("converts images", () => {
    const html = `<html><body><img src="img.png" alt="Photo"></body></html>`;
    expect(htmlToMarkdown(html)).toBe("![Photo](img.png)");
  });

  it("converts unordered lists", () => {
    const html = `<html><body><ul><li>A</li><li>B</li><li>C</li></ul></body></html>`;
    const md = htmlToMarkdown(html);
    expect(md).toContain("-   A");
    expect(md).toContain("-   B");
    expect(md).toContain("-   C");
  });

  it("converts ordered lists", () => {
    const html = `<html><body><ol><li>First</li><li>Second</li></ol></body></html>`;
    const md = htmlToMarkdown(html);
    expect(md).toContain("1.  First");
    expect(md).toContain("2.  Second");
  });

  it("converts nested lists", () => {
    const html = `<html><body>
      <ul>
        <li>Parent
          <ul>
            <li>Child</li>
          </ul>
        </li>
      </ul>
    </body></html>`;
    const md = htmlToMarkdown(html);
    expect(md).toContain("-   Parent");
    expect(md).toContain("Child");
  });

  it("converts tables to GFM format", () => {
    const html = `<html><body>
      <table>
        <thead><tr><th>Name</th><th>Age</th></tr></thead>
        <tbody><tr><td>Alice</td><td>30</td></tr></tbody>
      </table>
    </body></html>`;
    const md = htmlToMarkdown(html);
    expect(md).toContain("| Name | Age |");
    expect(md).toContain("| --- | --- |");
    expect(md).toContain("| Alice | 30 |");
  });

  it("converts tables with nested elements", () => {
    const html = `<html><body>
      <table>
        <thead><tr><th>Link</th></tr></thead>
        <tbody><tr><td><a href="https://example.com">Click</a></td></tr></tbody>
      </table>
    </body></html>`;
    const md = htmlToMarkdown(html);
    expect(md).toContain("| [Click](https://example.com) |");
  });

  it("normalizes tables without thead (Confluence-style)", () => {
    const html = `<html><body>
      <table>
        <colgroup><col><col></colgroup>
        <tbody>
          <tr><th>Field</th><th>Type</th></tr>
          <tr><td>name</td><td>String</td></tr>
          <tr><td>age</td><td>Integer</td></tr>
        </tbody>
      </table>
    </body></html>`;
    const md = htmlToMarkdown(html);
    expect(md).toContain("| Field | Type |");
    expect(md).toContain("| --- | --- |");
    expect(md).toContain("| name | String |");
    expect(md).toContain("| age | Integer |");
  });

  it("strips noise elements", () => {
    const html = `<html><body>
      <nav><a href="/">Home</a></nav>
      <header><h1>Site Header</h1></header>
      <main><p>Content</p></main>
      <footer>Footer stuff</footer>
      <script>alert('x')</script>
      <style>body { color: red; }</style>
      <aside>Sidebar</aside>
    </body></html>`;
    const md = htmlToMarkdown(html);
    expect(md).toBe("Content");
  });

  it("prefers article over body", () => {
    const html = `<html><body>
      <div>Noise</div>
      <article><p>Article content</p></article>
    </body></html>`;
    expect(htmlToMarkdown(html)).toBe("Article content");
  });

  it("prefers main over body", () => {
    const html = `<html><body>
      <div>Noise</div>
      <main><p>Main content</p></main>
    </body></html>`;
    expect(htmlToMarkdown(html)).toBe("Main content");
  });

  it("extracts code blocks from table cells into separate blocks after the table", () => {
    const html = `<html><body>
      <table>
        <thead><tr><th>Field</th><th>Example</th></tr></thead>
        <tbody>
          <tr>
            <td>name</td>
            <td>
              <table data-macro-name="code" data-macro-parameters="language=json">
                <tbody><tr><td class="wysiwyg-macro-body"><pre>{ "key": "value" }</pre></td></tr></tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </body></html>`;
    const md = htmlToMarkdown(html);
    expect(md).toContain("| Field | Example |");
    expect(md).toContain("| --- | --- |");
    expect(md).toContain("| name |");
    expect(md).toContain('```json\n{ "key": "value" }\n```');
  });

  it("cleans residual wrapper elements from cells after code block extraction", () => {
    const html = `<html><body>
      <table>
        <thead><tr><th>Field</th><th>Example</th></tr></thead>
        <tbody>
          <tr>
            <td>name</td>
            <td rowspan="2">
              <div class="content-wrapper">
                <table data-macro-name="code" data-macro-parameters="language=json">
                  <tbody><tr><td class="wysiwyg-macro-body"><pre>{ "key": "value" }</pre></td></tr></tbody>
                </table>
                <p><br></p>
              </div>
            </td>
          </tr>
          <tr><td>age</td></tr>
        </tbody>
      </table>
    </body></html>`;
    const md = htmlToMarkdown(html);
    const tableLines = md.split("\n").filter((l) => l.startsWith("|"));
    for (const line of tableLines) {
      expect(line).not.toMatch(/<br>/);
    }
    expect(md).toContain("| name |");
    expect(md).toContain("| age |");
    expect(md).toContain('```json\n{ "key": "value" }\n```');
  });

  it("extracts multiple code blocks from a single table cell with rowspan", () => {
    const html = `<html><body>
      <table>
        <thead><tr><th>Field</th><th>Type</th><th>Example</th></tr></thead>
        <tbody>
          <tr>
            <td>data</td>
            <td>Object</td>
            <td rowspan="2">
              <table data-macro-name="code" data-macro-parameters="language=json">
                <tbody><tr><td class="wysiwyg-macro-body"><pre>{ "a": 1 }</pre></td></tr></tbody>
              </table>
              <table data-macro-name="code" data-macro-parameters="language=json">
                <tbody><tr><td class="wysiwyg-macro-body"><pre>{ "b": 2 }</pre></td></tr></tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td>data.id</td>
            <td>String</td>
          </tr>
        </tbody>
      </table>
    </body></html>`;
    const md = htmlToMarkdown(html);
    expect(md).toContain("| Field | Type | Example |");
    expect(md).toContain("| data | Object |");
    expect(md).toContain("| data.id | String |");
    expect(md).toContain('```json\n{ "a": 1 }\n```');
    expect(md).toContain('```json\n{ "b": 2 }\n```');
  });

  it("unwraps div.content-wrapper inside table cells so rows stay on one line", () => {
    const html = `<html><body>
      <table>
        <thead><tr><th>Status</th><th>Code</th><th>Date</th></tr></thead>
        <tbody>
          <tr>
            <td><div class="content-wrapper"><p><strong>check mark button</strong></p></div></td>
            <td><p><strong>SLS-056</strong></p></td>
            <td><div class="content-wrapper"><p>03 Jun 2024</p></div></td>
          </tr>
        </tbody>
      </table>
    </body></html>`;
    const md = htmlToMarkdown(html);
    const tableLines = md.split("\n").filter((l) => l.startsWith("|"));
    // Row must be a single line — no embedded newlines
    const dataRow = tableLines.find((l) => l.includes("check mark button"));
    expect(dataRow).toBeDefined();
    expect(dataRow).toContain("| **check mark button** |");
    expect(dataRow).toContain("| **SLS-056** |");
    expect(dataRow).toContain("| 03 Jun 2024 |");
  });

  it("removes <br> nested inside heading elements (strong, u, etc.)", () => {
    const html = `<html><body>
      <h1>Title<br><br></h1>
      <h3><u><strong>Section Header<br><br></strong></u></h3>
    </body></html>`;
    const md = htmlToMarkdown(html);
    // Headings should render as clean single lines without trailing whitespace from <br>
    expect(md).toContain("# Title");
    expect(md).toContain("### **Section Header**");
    // The heading lines themselves must not have trailing spaces or inline breaks
    const lines = md.split("\n");
    const h1Line = lines.find((l) => l.startsWith("# "));
    const h3Line = lines.find((l) => l.startsWith("### "));
    expect(h1Line?.trimEnd()).toBe("# Title");
    expect(h3Line?.trimEnd()).toBe("### **Section Header**");
  });

  it("replaces <br> inside table cells with <br> markers without breaking row structure", () => {
    const html = `<html><body>
      <table>
        <thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr>
            <td>id</td>
            <td>string<br><br>(path param)</td>
            <td>The resource identifier</td>
          </tr>
        </tbody>
      </table>
    </body></html>`;
    const md = htmlToMarkdown(html);
    const tableLines = md.split("\n").filter((l) => l.startsWith("|"));
    // The data row must be a single line (no embedded newlines)
    const dataRow = tableLines.find((l) => l.includes("| id |"));
    expect(dataRow).toBeDefined();
    expect(dataRow).toContain("string");
    expect(dataRow).toContain("path param");
  });

  it("handles a realistic saved HTML page", () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head><title>Blog Post</title></head>
<body>
  <nav><a href="/">Home</a><a href="/about">About</a></nav>
  <header><h1>My Blog</h1></header>
  <article>
    <h1>How to Cook Pasta</h1>
    <p>Cooking pasta is <strong>easy</strong>.</p>
    <ol>
      <li>Boil water</li>
      <li>Add pasta</li>
      <li>Wait 10 minutes</li>
    </ol>
    <p>Visit <a href="https://recipes.com">Recipes</a> for more.</p>
  </article>
  <aside><h3>Related Posts</h3></aside>
  <footer><p>&copy; 2024</p></footer>
  <script>console.log('tracking')</script>
</body>
</html>`;
    const md = htmlToMarkdown(html);
    expect(md).toContain("# How to Cook Pasta");
    expect(md).toContain("**easy**");
    expect(md).toContain("1.  Boil water");
    expect(md).toContain("[Recipes](https://recipes.com)");
    expect(md).not.toContain("Home");
    expect(md).not.toContain("Related Posts");
    expect(md).not.toContain("tracking");
    expect(md).not.toContain("©");
  });
});
