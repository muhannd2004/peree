/**
 * Lightweight markdown-to-HTML converter.
 * Sanitizes HTML first (prevents XSS), then applies regex-based markdown rules.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Generate a URL-friendly id from heading text
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function markdownToHtml(md: string): string {
  // Sanitize raw HTML characters first
  let html = escapeHtml(md);

  // Fenced code blocks (``` ... ```)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_match, _lang, code) =>
      `<pre class="md-code-block"><code>${code.trimEnd()}</code></pre>`,
  );

  // Inline code (`...`)
  html = html.replace(
    /`([^`\n]+)`/g,
    '<code class="md-inline-code">$1</code>',
  );

  // Headings (# through ######) - must be at line start
  html = html.replace(/^(#{1,6})\s+(.+)$/gm, (_match, hashes, text) => {
    const level = hashes.length;
    const id = slugify(text);
    return `<h${level} id="${id}" class="md-h${level}">${text}</h${level}>`;
  });

  // Bold (**text**)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic (*text*) - avoid matching ** sequences
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');

  // Links [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="md-link" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // Horizontal rules (--- or ***)
  html = html.replace(/^(-{3,}|\*{3,})$/gm, '<hr class="md-hr" />');

  // Process lines into blocks (lists, paragraphs)
  const lines = html.split('\n');
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip pre-formatted blocks (already processed)
    if (line.startsWith('<pre') || line.startsWith('<h') || line.startsWith('<hr')) {
      blocks.push(line);
      i++;
      continue;
    }

    // Unordered list items
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(`<li>${lines[i].replace(/^[-*]\s+/, '')}</li>`);
        i++;
      }
      blocks.push(`<ul class="md-ul">${items.join('')}</ul>`);
      continue;
    }

    // Ordered list items
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${lines[i].replace(/^\d+\.\s+/, '')}</li>`);
        i++;
      }
      blocks.push(`<ol class="md-ol">${items.join('')}</ol>`);
      continue;
    }

    // Empty lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph: collect consecutive non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('<pre') &&
      !lines[i].startsWith('<h') &&
      !lines[i].startsWith('<hr') &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push(`<p class="md-p">${paraLines.join('<br />')}</p>`);
    }
  }

  return blocks.join('\n');
}

/**
 * Extract headings (h2 and h3) from raw markdown content.
 * Used by the sidebar to build a table of contents.
 */
export interface HeadingInfo {
  level: number;
  text: string;
  id: string;
}

export function extractHeadings(md: string): HeadingInfo[] {
  const headings: HeadingInfo[] = [];
  const regex = /^(#{2,3})\s+(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(md)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2],
      id: slugify(match[2]),
    });
  }

  return headings;
}
