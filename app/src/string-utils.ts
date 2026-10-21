// These helpers preserve the string transformations used by Mailspring without
// loading underscore.string's unused, vulnerable sprintf implementation.
function text(value: unknown): string {
  return value == null ? '' : `${value}`;
}

export function capitalize(value: unknown, lowercaseRest = false): string {
  const input = text(value);
  const rest = input.slice(1);
  return input.charAt(0).toUpperCase() + (lowercaseRest ? rest.toLowerCase() : rest);
}

export function humanize(value: unknown): string {
  const input = text(value)
    .trim()
    .replace(/([a-z\d])([A-Z]+)/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
    .replace(/_id$/, '')
    .replace(/_/g, ' ');
  return capitalize(input.trim());
}

export function titleize(value: unknown): string {
  return text(value)
    .toLowerCase()
    .replace(/(?:^|\s|-)\S/g, character => character.toUpperCase());
}

export function dasherize(value: unknown): string {
  return text(value)
    .trim()
    .replace(/([A-Z])/g, '-$1')
    .replace(/[-_\s]+/g, '-')
    .toLowerCase();
}

export function escapeHTML(value: unknown): string {
  const entities: Record<string, string> = {
    '¢': 'cent',
    '£': 'pound',
    '¥': 'yen',
    '€': 'euro',
    '©': 'copy',
    '®': 'reg',
    '<': 'lt',
    '>': 'gt',
    '"': 'quot',
    '&': 'amp',
    "'": '#39',
  };
  return text(value).replace(/[¢£¥€©®<>"&']/g, character => `&${entities[character]};`);
}

export default { capitalize, humanize, titleize, dasherize, escapeHTML };
