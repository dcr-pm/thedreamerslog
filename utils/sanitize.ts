/** Escape HTML entities to prevent XSS from AI-generated content */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Convert markdown-style bold and newlines to safe HTML */
export function markdownToSafeHtml(text: string, headingClass?: string): string {
  const escaped = escapeHtml(text);
  const defaultClass = 'text-dreamy-purple block mt-4 mb-1 uppercase tracking-widest text-[10px]';
  return escaped
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, `<strong class="${headingClass || defaultClass}">$1</strong>`);
}
