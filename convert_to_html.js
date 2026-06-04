#!/usr/bin/env node
// Converts all java_part*.md files to beautiful HTML files
// Open the HTML in Safari/Chrome, then Cmd+P → Save as PDF

const fs = require('fs');
const path = require('path');

const dir = __dirname;

// Simple but solid Markdown → HTML converter
function mdToHtml(md) {
  let html = md;

  // Escape HTML entities first (in code blocks only)
  // We'll handle code blocks specially
  const codeBlocks = [];
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre><code class="language-${lang}">${escaped}</code></pre>`);
    return `%%CODEBLOCK_${idx}%%`;
  });

  // Inline code
  const inlineCodes = [];
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const idx = inlineCodes.length;
    inlineCodes.push(`<code>${escaped}</code>`);
    return `%%INLINE_${idx}%%`;
  });

  // Tables
  html = html.replace(/(\|.+\|\n)+/g, (table) => {
    const rows = table.trim().split('\n');
    let tableHtml = '<table>\n';
    rows.forEach((row, i) => {
      if (row.match(/^\|[\s\-|]+\|$/)) return; // separator row
      const cells = row.split('|').filter((_, j, arr) => j > 0 && j < arr.length - 1);
      const tag = i === 0 ? 'th' : 'td';
      tableHtml += '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>\n';
    });
    tableHtml += '</table>\n';
    return tableHtml;
  });

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold & italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Horizontal rule
  html = html.replace(/^---+$/gm, '<hr>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Unordered lists
  html = html.replace(/(^[\-\*] .+\n?)+/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^[\-\*] /, '')}</li>`).join('\n');
    return `<ul>\n${items}\n</ul>\n`;
  });

  // Ordered lists
  html = html.replace(/(^\d+\. .+\n?)+/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('\n');
    return `<ol>\n${items}\n</ol>\n`;
  });

  // Paragraphs (lines not already in tags)
  const lines = html.split('\n');
  const result = [];
  let inBlock = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('<') || trimmed === '' || trimmed.startsWith('%%')) {
      if (inBlock) { result.push('</p>'); inBlock = false; }
      result.push(line);
    } else {
      if (!inBlock) { result.push('<p>'); inBlock = true; }
      result.push(line);
    }
  }
  if (inBlock) result.push('</p>');
  html = result.join('\n');

  // Restore code blocks
  codeBlocks.forEach((block, i) => {
    html = html.replace(`%%CODEBLOCK_${i}%%`, block);
  });
  inlineCodes.forEach((code, i) => {
    html = html.replace(`%%INLINE_${i}%%`, code);
  });

  return html;
}

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.7;
    color: #24292e;
    max-width: 900px;
    margin: 0 auto;
    padding: 40px 48px;
  }
  h1 { font-size: 2em; border-bottom: 2px solid #e1e4e8; padding-bottom: 10px; margin: 24px 0 16px; color: #1a1a2e; }
  h2 { font-size: 1.5em; border-bottom: 1px solid #e1e4e8; padding-bottom: 6px; margin: 28px 0 12px; color: #2d4a7a; }
  h3 { font-size: 1.2em; margin: 20px 0 8px; color: #3d6b9e; }
  h4 { font-size: 1em; margin: 16px 0 6px; color: #555; font-weight: 600; }
  p { margin: 8px 0; }
  code {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 12.5px;
    background: #f0f3f6;
    padding: 2px 5px;
    border-radius: 4px;
    color: #c7254e;
  }
  pre {
    background: #1e1e2e;
    border-radius: 8px;
    padding: 20px;
    overflow-x: auto;
    margin: 14px 0;
    border-left: 4px solid #7c3aed;
  }
  pre code {
    background: none;
    color: #cdd6f4;
    padding: 0;
    font-size: 13px;
    line-height: 1.6;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 14px 0;
    font-size: 13px;
  }
  th {
    background: #7c3aed;
    color: white;
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
  }
  td {
    padding: 9px 14px;
    border-bottom: 1px solid #e1e4e8;
  }
  tr:nth-child(even) td { background: #f8f9ff; }
  ul, ol { padding-left: 24px; margin: 8px 0; }
  li { margin: 4px 0; }
  hr { border: none; border-top: 2px solid #e1e4e8; margin: 28px 0; }
  blockquote {
    border-left: 4px solid #7c3aed;
    background: #f5f0ff;
    padding: 10px 16px;
    margin: 12px 0;
    border-radius: 0 6px 6px 0;
    color: #4a3080;
  }
  strong { color: #1a1a2e; }
  @media print {
    body { padding: 20px 28px; font-size: 12px; }
    pre { page-break-inside: avoid; }
    h2, h3 { page-break-after: avoid; }
    table { page-break-inside: avoid; }
  }
`;

const files = fs.readdirSync(dir).filter(f => f.match(/^java_part\d+.*\.md$/));

if (files.length === 0) {
  console.log('Brak plików java_part*.md w katalogu.');
  process.exit(1);
}

files.sort();
console.log(`Znaleziono ${files.length} plików:\n`);

for (const file of files) {
  const mdPath = path.join(dir, file);
  const htmlPath = path.join(dir, file.replace('.md', '.html'));
  
  const md = fs.readFileSync(mdPath, 'utf8');
  const title = file.replace('.md', '').replace(/_/g, ' ');
  const body = mdToHtml(md);
  
  const fullHtml = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${CSS}</style>
</head>
<body>
${body}
</body>
</html>`;

  fs.writeFileSync(htmlPath, fullHtml, 'utf8');
  const sizeKb = Math.round(fs.statSync(htmlPath).size / 1024);
  console.log(`✅  ${file.replace('.md', '.html')}  (${sizeKb} KB)`);
}

console.log('\nGotowe! Otwórz pliki .html w Safari lub Chrome,');
console.log('a następnie Cmd+P → Zapisz jako PDF.');
