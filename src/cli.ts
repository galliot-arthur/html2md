import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import { htmlToMarkdown } from "./convert.js";

const INPUT_DIR = "input";
const OUTPUT_DIR = "output";

function main(): void {
  console.log(`🚀 Process starting`);
  mkdirSync(INPUT_DIR, { recursive: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = readdirSync(INPUT_DIR).filter((f) => /\.html?$/i.test(f));

  if (files.length === 0) {
    console.error(`❌ No HTML files found in ${INPUT_DIR}/`);
    process.exit(1);
  }

  for (const file of files) {
    console.log(`⚙️ Converting ${file}`);
    const html = readFileSync(join(INPUT_DIR, file), "utf-8");
    const markdown = htmlToMarkdown(html);
    const outName = basename(file).replace(/\.html?$/i, ".md");
    const outPath = join(OUTPUT_DIR, outName);
    writeFileSync(outPath, markdown + "\n", "utf-8");
    console.log(`✨ ${file} -> ${outPath}`);
  }
}

main();
