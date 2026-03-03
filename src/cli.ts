import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { htmlToMarkdown } from "./convert.js";

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: html2md <file.html> [--stdout]");
    process.exit(1);
  }

  const filePath = args[0];
  const toStdout = args.includes("--stdout");

  const html = readFileSync(filePath, "utf-8");
  const markdown = htmlToMarkdown(html);

  if (toStdout) {
    process.stdout.write(markdown + "\n");
  } else {
    const outName = basename(filePath).replace(/\.html?$/i, ".md");
    const outPath = join(dirname(filePath), outName);
    writeFileSync(outPath, markdown + "\n", "utf-8");
    console.log(`Written to ${outPath}`);
  }
}

main();
