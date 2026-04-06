/** Escape HTML entities to prevent XSS from AI-generated content */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Convert markdown-style formatting to safe HTML */
export function markdownToSafeHtml(text: string, headingClass?: string): string {
  const escaped = escapeHtml(text);
  const defaultClass = 'text-dreamy-purple block mt-6 mb-2 uppercase tracking-widest text-xs font-bold';

  return escaped
    // Process line by line for accurate structure
    .split('\n')
    .map(line => {
      const trimmed = line.trim();

      // Bold-only lines become headings (e.g. **Key Symbols & Archetypes**)
      const headingMatch = trimmed.match(/^\*\*(.+?)\*\*:?\s*$/);
      if (headingMatch) {
        return `<strong class="${headingClass || defaultClass}">${headingMatch[1].replace(/\*+/g, '')}</strong>`;
      }

      // Inline bold within a paragraph
      let processed = trimmed.replace(/\*\*(.+?)\*\*/g, '<strong class="text-dreamy-purple font-semibold">$1</strong>');

      // Inline italic *text*
      processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');

      // Clean any remaining stray asterisks (only isolated ones, not inside words)
      processed = processed.replace(/(^|\s)\*(\s|$)/g, '$1$2');

      // Bullet points
      if (processed.match(/^[-•]\s/)) {
        processed = `<span class="block pl-4 mb-1">${processed.replace(/^[-•]\s/, '&bull; ')}</span>`;
      }

      return processed;
    })
    .join('<br/>');
}
