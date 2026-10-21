import strings from '../../src/string-utils';

describe('string helpers', () => {
  it('preserves display labels and configuration keys', () => {
    expect(strings.capitalize('iMAP')).toBe('IMAP');
    expect(strings.capitalize('iMAP', true)).toBe('Imap');
    expect(strings.humanize('accountDisplayName_id')).toBe('Account display name');
    expect(strings.titleize('foo-bar BAZ')).toBe('Foo-Bar Baz');
    expect(strings.dasherize('Send_To MyTask')).toBe('-send-to-my-task');
  });

  it('escapes HTML from messages, contact fields and print previews', () => {
    expect(strings.escapeHTML(`<a title="'">&¢£¥€©®</a>`)).toBe(
      '&lt;a title=&quot;&#39;&quot;&gt;&amp;&cent;&pound;&yen;&euro;&copy;&reg;&lt;/a&gt;'
    );
    expect(strings.escapeHTML(null)).toBe('');
  });
});
