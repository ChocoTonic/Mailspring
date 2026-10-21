const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { downloadVerifiedArchive, releaseAsset } = require('./mailsync-download');

test('only publishes an archive whose content matches its pinned digest', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'mailsync-'));
  const archive = path.join(directory, 'mailsync.tar.gz');
  const content = Buffer.from('verified release fixture');
  const digest = crypto.createHash('sha256').update(content).digest('hex');
  try {
    await downloadVerifiedArchive(
      'https://github.com/owner/repo/archive',
      digest,
      archive,
      async () => new Response(content)
    );
    assert.deepEqual(await fs.readFile(archive), content);
    await assert.rejects(
      downloadVerifiedArchive(
        'https://github.com/owner/repo/archive',
        digest,
        archive,
        async () => new Response('tampered archive')
      ),
      /SHA-256/
    );
    assert.deepEqual(await fs.readFile(archive), content);
    assert.deepEqual(await fs.readdir(directory), ['mailsync.tar.gz']);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('rejects a redirect to an insecure transport', async () => {
  await assert.rejects(
    downloadVerifiedArchive(
      'https://github.com/owner/repo/archive',
      'a'.repeat(64),
      'unused',
      async () =>
        new Response(null, { status: 302, headers: { location: 'http://example.test/archive' } })
    ),
    /HTTPS/
  );
});

test('fails closed for an unsupported native release platform', () => {
  assert.throws(
    () => releaseAsset({ repository: 'owner/repo', tag: 'v1', assets: {} }, 'linux', 'ia32'),
    /No patched/
  );
});
