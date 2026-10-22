const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

async function main() {
  const { extractFile } = await import('@electron/asar');
  const root = path.join(__dirname, '..');
  const manifest = require('../mailsync-release.json');
  const platform = process.platform;
  const arch = process.arch;
  const asset = manifest.assets[`${platform}-${arch}`];
  assert.ok(asset, 'No verified native asset for this platform');
  const folderName = `${platform === 'darwin' || platform === 'win32' ? 'Mailspring' : 'mailspring'}-${platform}-${arch}`;
  const folder = path.join(root, 'app', 'dist', folderName);
  const resources =
    platform === 'darwin'
      ? path.join(folder, 'Mailspring.app', 'Contents', 'Resources')
      : path.join(folder, 'resources');
  const archive = path.join(resources, 'app.asar');
  const installed = JSON.parse(extractFile(archive, 'mailsync-release.json').toString());
  assert.equal(installed.revision, manifest.revision);
  assert.equal(installed.tag, manifest.tag);
  assert.equal(installed.sha256, asset.sha256);
  const metadata = JSON.parse(extractFile(archive, 'package.json').toString());
  assert.equal(metadata.securityFork, true);
  const source = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  assert.ok(
    JSON.stringify(metadata).includes(source.slice(0, 8)),
    'Packaged commit marker is missing'
  );
  const unpacked = path.join(resources, 'app.asar.unpacked');
  const binaryName =
    platform === 'win32' ? 'mailsync.exe' : platform === 'linux' ? 'mailsync.bin' : 'mailsync';
  const binary = path.join(unpacked, binaryName);
  const digest = crypto.createHash('sha256').update(fs.readFileSync(binary)).digest('hex');
  assert.equal(
    digest,
    asset.executableSha256,
    'Packaged native executable differs from the tested release'
  );
  const executable = platform === 'linux' ? path.join(unpacked, 'mailsync') : binary;
  const help = execFileSync(executable, ['--help'], {
    cwd: unpacked,
    encoding: 'utf8',
    timeout: 60000,
  });
  assert.match(help, /--mode/);
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'mailspring-package-check-'));
  try {
    const env = {
      ...process.env,
      CONFIG_DIR_PATH: temporary,
      IDENTITY_SERVER: 'https://unused.invalid',
    };
    for (let attempt = 0; attempt < 2; attempt++) {
      execFileSync(executable, ['--mode', 'migrate'], {
        cwd: unpacked,
        env,
        stdio: 'pipe',
        timeout: 60000,
      });
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
  const result = {
    source,
    platform,
    arch,
    nativeRevision: manifest.revision,
    nativeSha256: digest,
    unsigned: true,
    startup: 'passed',
    isolatedMigrations: 2,
  };
  fs.writeFileSync(
    path.join(root, 'app', 'dist', 'security-package-verification.json'),
    `${JSON.stringify(result, null, 2)}\n`
  );
  console.log(JSON.stringify(result));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
