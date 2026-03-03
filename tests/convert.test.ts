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

  it("converts tables", () => {
    const html = `<html><body>
      <table>
        <thead><tr><th>Name</th><th>Age</th></tr></thead>
        <tbody><tr><td>Alice</td><td>30</td></tr></tbody>
      </table>
    </body></html>`;
    const md = htmlToMarkdown(html);
    expect(md).toContain("Name");
    expect(md).toContain("Age");
    expect(md).toContain("Alice");
    expect(md).toContain("30");
  });

  it("converts tables with nested elements", () => {
    const html = `<html><body>
      <table>
        <thead><tr><th>Link</th></tr></thead>
        <tbody><tr><td><a href="https://example.com">Click</a></td></tr></tbody>
      </table>
    </body></html>`;
    const md = htmlToMarkdown(html);
    expect(md).toContain("[Click](https://example.com)");
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
