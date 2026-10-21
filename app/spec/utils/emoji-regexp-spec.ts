import RegExpUtils from '../../src/regexp-utils';

describe('emoji regular expressions', () => {
  it('recognizes emoji sequences without consuming surrounding text', () => {
    const emojis = ['😀', '👍🏽', '👨‍👩‍👧‍👦'];
    expect(`Hello ${emojis.join(' ')} world`.match(RegExpUtils.emojiRegex())).toEqual(emojis);
  });

  it('returns a fresh stateful regular expression for every caller', () => {
    const first = RegExpUtils.emojiRegex();
    const second = RegExpUtils.emojiRegex();
    expect(first).not.toBe(second);
    first.test('😀');
    expect(second.lastIndex).toBe(0);
  });
});
