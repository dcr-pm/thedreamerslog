/** Escape HTML entities to prevent XSS from AI-generated content */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const SECTION_HEADINGS = [
  'core emotional theme',
  'key symbols & archetypes',
  'key symbols and archetypes',
  'potential interpretation',
];

function isSectionHeading(text: string): boolean {
  const normalized = text.replace(/[*:]/g, '').trim().toLowerCase();
  return SECTION_HEADINGS.some(h => normalized === h || normalized.startsWith(h));
}

/** Convert markdown-style formatting to safe HTML */
export function markdownToSafeHtml(text: string, headingClass?: string): string {
  const escaped = escapeHtml(text);
  const hClass = headingClass || 'text-dreamy-purple block mt-6 mb-2 uppercase tracking-widest text-xs font-bold';

  return escaped
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '<br/>';

      // Check if entire line is a bold heading like **Core Emotional Theme**
      const headingMatch = trimmed.match(/^\*\*(.+?)\*\*:?\s*$/);
      if (headingMatch && isSectionHeading(headingMatch[1])) {
        return `<strong class="${hClass}">${headingMatch[1].replace(/\*+/g, '')}</strong>`;
      }

      // Bullet points: - Symbol: explanation
      let processed = trimmed;
      if (processed.match(/^[-•]\s/)) {
        const bulletContent = processed.replace(/^[-•]\s*/, '');
        // Bold the symbol name before the colon
        const colonIdx = bulletContent.indexOf(':');
        if (colonIdx > 0) {
          const symbol = bulletContent.slice(0, colonIdx);
          const rest = bulletContent.slice(colonIdx);
          processed = `<span class="block pl-4 py-1"><strong class="text-dreamy-purple font-semibold">${symbol}</strong>${rest}</span>`;
        } else {
          processed = `<span class="block pl-4 py-1">&bull; ${bulletContent}</span>`;
        }
      } else {
        // Inline **bold** within regular text
        processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong class="text-dreamy-purple font-semibold">$1</strong>');
      }

      // Inline *italic*
      processed = processed.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

      return processed;
    })
    .join('\n')
    // Collapse multiple <br/> into max two
    .replace(/(<br\/?>\s*){3,}/g, '<br/><br/>')
    // Convert remaining newlines
    .replace(/\n/g, '<br/>');
}
