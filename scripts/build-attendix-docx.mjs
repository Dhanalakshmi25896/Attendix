/**
 * Converts docs/ATTENDIX-Professional-Workflow-Documentation.md to .docx
 * Run from repo root: node scripts/build-attendix-docx.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from '../frontend/node_modules/docx/dist/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const mdPath = path.join(root, 'docs', 'ATTENDIX-Professional-Workflow-Documentation.md');
const outPath = path.join(root, 'docs', 'ATTENDIX-Professional-Workflow-Documentation.docx');

function stripMd(s) {
  return s.replace(/\*\*/g, '').replace(/^`|`$/g, '').trim();
}

const md = fs.readFileSync(mdPath, 'utf8');
const lines = md.split(/\r?\n/);
const children = [];

for (let i = 0; i < lines.length; i++) {
  const raw = lines[i];
  const t = raw.trim();

  if (t === '' || t === '---') continue;

  if (t.startsWith('# ')) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
        children: [new TextRun({ text: stripMd(t.slice(2)), bold: true, size: 32 })],
      })
    );
    continue;
  }

  if (t.startsWith('## ')) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 280, after: 160 },
        children: [new TextRun({ text: stripMd(t.slice(3)), bold: true, size: 28 })],
      })
    );
    continue;
  }

  if (t.startsWith('### ')) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 120 },
        children: [new TextRun({ text: stripMd(t.slice(4)), bold: true, size: 24 })],
      })
    );
    continue;
  }

  if (t.startsWith('#### ')) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 160, after: 100 },
        children: [new TextRun({ text: stripMd(t.slice(5)), bold: true })],
      })
    );
    continue;
  }

  if (t.startsWith('|')) {
    const tableLines = [t];
    while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
      i += 1;
      tableLines.push(lines[i].trim());
    }
    const skipSep = tableLines.filter((row) => !/^\|[\s\-:|]+\|$/.test(row.replace(/\s/g, '')));
    const body = skipSep.length ? skipSep : tableLines;
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: body.join('\n'),
            font: 'Consolas',
            size: 20,
          }),
        ],
      })
    );
    continue;
  }

  if (t.startsWith('- ') || t.startsWith('* ')) {
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        indent: { left: 360 },
        children: [new TextRun({ text: `• ${stripMd(t.slice(2))}` })],
      })
    );
    continue;
  }

  if (/^\*\*[^*]+\*\*:\s*\*\*[^*]+\*\*\s*$/.test(t)) {
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: stripMd(t), bold: false })],
      })
    );
    continue;
  }

  children.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: stripMd(t) })],
    })
  );
}

const doc = new Document({
  sections: [
    {
      properties: {},
      children,
    },
  ],
});

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buf);
console.log('Created:', outPath);
