export interface ParsedHeading {
  id: string;
  text: string;
  level: number;
}

export function parseMarkdownHeadings(content: string): ParsedHeading[] {
  const lines = content.split('\n');
  const headingCount = new Map<string, number>();

  return lines
    .map((line) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (!match) return null;
      const level = match[1].length;
      const text = match[2].trim();
      const baseId = toSlug(text);
      const seen = headingCount.get(baseId) ?? 0;
      headingCount.set(baseId, seen + 1);
      const id = seen === 0 ? baseId : `${baseId}-${seen + 1}`;
      return { id, text, level };
    })
    .filter((heading): heading is ParsedHeading => heading !== null);
}

function toSlug(value: string): string {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return base || 'section';
}
