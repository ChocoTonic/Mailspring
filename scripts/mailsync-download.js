const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { Readable, Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');

async function downloadVerifiedArchive(url, expectedSha256, destination, request = fetch) {
  if (!/^[a-f0-9]{64}$/i.test(expectedSha256)) {
    throw new Error('Missing valid SHA-256 for the pinned mailsync archive');
  }
  let response;
  for (let redirects = 0; redirects <= 5; redirects++) {
    if (new URL(url).protocol !== 'https:') throw new Error('Mailsync downloads require HTTPS');
    response = await request(url, { redirect: 'manual' });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get('location');
    await response.body?.cancel();
    if (!location || redirects === 5) throw new Error('Invalid mailsync download redirect');
    url = new URL(location, url).href;
  }
  if (!response.ok || !response.body) {
    throw new Error(`Mailsync download failed with HTTP ${response.status}`);
  }
  const temporary = `${destination}.${crypto.randomBytes(8).toString('hex')}.partial`;
  const digest = crypto.createHash('sha256');
  try {
    await fs.promises.mkdir(path.dirname(destination), { recursive: true });
    await pipeline(
      Readable.fromWeb(response.body),
      new Transform({
        transform(chunk, encoding, callback) {
          digest.update(chunk);
          callback(null, chunk);
        },
      }),
      fs.createWriteStream(temporary, { flags: 'wx' })
    );
    if (digest.digest('hex') !== expectedSha256.toLowerCase()) {
      throw new Error('Mailsync archive SHA-256 does not match the pinned release');
    }
    await fs.promises.rename(temporary, destination);
  } finally {
    await fs.promises.rm(temporary, { force: true });
  }
}

function releaseAsset(manifest, platform, arch) {
  const key = `${platform}-${arch}`;
  const asset = manifest.assets[key];
  if (!asset) throw new Error(`No patched mailsync release is pinned for ${key}`);
  if (!/^[\w.-]+\/[\w.-]+$/.test(manifest.repository))
    throw new Error('Invalid release repository');
  return {
    url: `https://github.com/${manifest.repository}/releases/download/${encodeURIComponent(manifest.tag)}/${encodeURIComponent(asset.name)}`,
    sha256: asset.sha256,
  };
}

module.exports = { downloadVerifiedArchive, releaseAsset };
