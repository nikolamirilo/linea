import React from 'react';
import { Text, Stack, Box, Link } from '@forge/react';

// ---- Minimal Markdown renderer (Forge UI Kit has no built-in one) ----
// Supports: headings (# ## ###), bullet lists (*, -), links [text](url),
// images ![alt](url) → rendered as Link, bold **text**, plain paragraphs.

function parseInline(text) {
  const parts = [];
  let remaining = text;
  let guard = 0;
  while (remaining.length > 0 && guard++ < 5000) {
    const bold = remaining.match(/^\*\*([^*\n]+)\*\*/);
    if (bold) {
      parts.push({ type: 'bold', text: bold[1] });
      remaining = remaining.slice(bold[0].length);
      continue;
    }
    const link = remaining.match(/^\[([^\]]+)\]\(<?([^)>]+)>?\)/);
    if (link) {
      parts.push({ type: 'link', text: link[1], url: link[2] });
      remaining = remaining.slice(link[0].length);
      continue;
    }
    // Consume up to the next special marker
    const next = remaining.search(/(\*\*|\[)/);
    if (next === -1) {
      parts.push({ type: 'text', text: remaining });
      remaining = '';
    } else if (next === 0) {
      // Marker that didn't match a known pattern - take one char and continue
      parts.push({ type: 'text', text: remaining[0] });
      remaining = remaining.slice(1);
    } else {
      parts.push({ type: 'text', text: remaining.slice(0, next) });
      remaining = remaining.slice(next);
    }
  }
  return parts;
}

function parseMarkdownBlocks(md) {
  if (!md || typeof md !== 'string') return [];
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      i++;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
      i++;
      continue;
    }

    // Horizontal rule: ---, ***, or ___ (3 or more)
    if (/^([-*_])\1{2,}$/.test(line.replace(/\s+/g, ''))) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    const image = line.match(/^!\[([^\]]*)\]\(<?([^)>]+)>?\)$/);
    if (image) {
      blocks.push({ type: 'image', alt: image[1], url: image[2] });
      i++;
      continue;
    }

    const listStart = line.match(/^[*-]\s+(.+)$/);
    if (listStart) {
      const items = [];
      while (i < lines.length) {
        const l = lines[i].trim();
        const m = l.match(/^[*-]\s+(.+)$/);
        if (m) {
          items.push(m[1]);
          i++;
        } else if (!l) {
          break;
        } else if (lines[i].match(/^\s{2,}/) && items.length > 0) {
          // Indented continuation line - append to last item
          items[items.length - 1] += ' ' + l;
          i++;
        } else {
          break;
        }
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    // Paragraph - collect consecutive non-empty, non-structural lines
    const paraLines = [];
    while (i < lines.length) {
      const l = lines[i];
      const t = l.trim();
      if (!t) break;
      if (t.match(/^(#{1,6})\s/)) break;
      if (t.match(/^[*-]\s/)) break;
      if (t.match(/^!\[/)) break;
      paraLines.push(t);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
    }
  }
  return blocks;
}

// Recursive renderer: parts whose content can itself contain markdown are
// re-parsed so nested formatting (bold inside link, link inside bold, etc.)
// renders correctly.
const renderInline = (text) =>
  parseInline(text).map((p, i) => {
    if (p.type === 'bold') {
      return (
        <Text as="strong" key={i}>
          {renderInline(p.text)}
        </Text>
      );
    }
    if (p.type === 'link') {
      return (
        <Link key={i} href={p.url} openNewTab>
          {renderInline(p.text)}
        </Link>
      );
    }
    return p.text;
  });

export const MarkdownRenderer = ({ text }) => {
  const blocks = parseMarkdownBlocks(text);
  if (blocks.length === 0) return <Text>No description.</Text>;
  return (
    <Stack space="space.100">
      {blocks.map((block, i) => {
        if (block.type === 'heading') {
          return (
            <Text key={i}>
              <Text as="strong">{renderInline(block.text)}</Text>
            </Text>
          );
        }
        if (block.type === 'paragraph') {
          return <Text key={i}>{renderInline(block.text)}</Text>;
        }
        if (block.type === 'list') {
          return (
            <Stack key={i} space="space.050">
              {block.items.map((item, j) => (
                <Text key={j}>• {renderInline(item)}</Text>
              ))}
            </Stack>
          );
        }
        if (block.type === 'image') {
          return (
            <Text key={i}>
              [Image:{' '}
              <Link href={block.url} openNewTab>
                {block.alt || block.url}
              </Link>
              ]
            </Text>
          );
        }
        if (block.type === 'hr') {
          return (
            <Box
              key={i}
              xcss={{
                width: '100%',
                height: '1px',
                backgroundColor: '#DFE1E6',
                marginTop: '8px',
                marginBottom: '8px',
              }}
            />
          );
        }
        return null;
      })}
    </Stack>
  );
};
