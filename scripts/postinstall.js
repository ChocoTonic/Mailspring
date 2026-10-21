#!/usr/bin/env node
/* eslint global-require: 0 */
/* eslint quote-props: 0 */
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const targz = require('targz');
const { safeExec } = require('./utils/child-process-wrapper.js');
const { downloadVerifiedArchive, releaseAsset } = require('./mailsync-download');

const appDependencies = require('../app/package.json').dependencies;
const rootDependencies = require('../package.json').dependencies;
const npmElectronTarget = rootDependencies.electron;
const npmEnvs = {
  system: process.env,
  electron: Object.assign({}, process.env, {
    npm_config_target: npmElectronTarget,
    npm_config_arch: process.env.OVERRIDE_TO_INTEL ? 'x64' : process.arch,
    npm_config_target_arch: process.env.OVERRIDE_TO_INTEL ? 'x64' : process.arch,
    npm_config_disturl: 'https://electronjs.org/headers',
    npm_config_runtime: 'electron',
  }),
};

function npm(cmd, options) {
  const { cwd, env } = Object.assign({ cwd: '.', env: 'system' }, options);

  return new Promise((resolve, reject) => {
    console.log(
      `\n-- Running npm ${cmd} in ${cwd} with ${env} config (arch=${npmEnvs[env].npm_config_target_arch}) --`
    );

    safeExec(
      `npm ${cmd}`,
      {
        cwd: path.resolve(__dirname, '..', cwd),
        env: npmEnvs[env],
      },
      (err, stdout) => {
        return err ? reject(err) : resolve(stdout);
      }
    );
  });
}

async function downloadMailsync() {
  const manifest = require('../mailsync-release.json');
  const asset = releaseAsset(manifest, process.platform, process.arch);
  const archive = path.resolve(__dirname, '..', 'app', 'mailsync.tar.gz');
  console.log(`\n-- Downloading verified patched mailsync ${manifest.revision} --`);
  await downloadVerifiedArchive(asset.url, asset.sha256, archive);
  const staging = await fs.promises.mkdtemp(path.join(path.dirname(archive), '.mailsync-'));
  try {
    await new Promise((resolve, reject) => {
      targz.decompress({ src: archive, dest: staging }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    const executable = path.join(
      staging,
      process.platform === 'win32' ? 'mailsync.exe' : 'mailsync'
    );
    const executableInfo = await fs.promises.stat(executable);
    if (!executableInfo.isFile()) throw new Error('Patched mailsync archive has no executable');
    if (process.platform !== 'win32') {
      await fs.promises.access(executable, fs.constants.X_OK);
    }
    await fs.promises.cp(staging, path.dirname(archive), {
      recursive: true,
      force: true,
      verbatimSymlinks: true,
    });
  } finally {
    await fs.promises.rm(staging, { recursive: true, force: true });
  }
  fs.writeFileSync(
    path.join(path.dirname(archive), 'mailsync-release.json'),
    JSON.stringify(
      {
        revision: manifest.revision,
        tag: manifest.tag,
        sha256: asset.sha256,
      },
      null,
      2
    )
  );
  console.log('\nUnpacked the verified patched mailsync release into ./app.');
}

// For speed, we cache app/node_modules. However, we need to
// be sure to do a full rebuild of native node modules when the
// Electron version changes. To do this we check a marker file.
const appPath = path.resolve(__dirname, '..', 'app');
const appModulesPath = path.resolve(appPath, 'node_modules');
const cacheVersionPath = path.join(appModulesPath, '.postinstall-target-version');
const cacheElectronTarget =
  fs.existsSync(cacheVersionPath) && fs.readFileSync(cacheVersionPath).toString();

if (cacheElectronTarget !== npmElectronTarget) {
  console.log(
    `\n-- Clearing app/node_modules (${cacheElectronTarget} !== ${npmElectronTarget}) --`
  );
  rimraf.sync(appModulesPath);
}

// Audit is emitted with npm ls, no need to run it on EVERY command which is an odd default

async function sqliteMissingNanosleep() {
  return new Promise((resolve) => {
    const sqliteLibDir = path.join(appModulesPath, 'better-sqlite3', 'build', 'Release');
    const staticLib = path.join(sqliteLibDir, 'sqlite3.a');
    const sharedLib = path.join(sqliteLibDir, 'better_sqlite3.node');

    // Check the static lib first (build-from-source), then the prebuilt .node binary
    const target = fs.existsSync(staticLib) ? staticLib : sharedLib;
    safeExec(`nm '${target}' | grep nanosleep`, { ignoreStderr: true }, (err, resp) => {
      resolve(resp === '');
    });
  });
}

async function run() {
  // run `npm install` in ./app with Electron NPM config
  await npm(`install --no-audit`, { cwd: './app', env: 'electron' });

  // run `npm dedupe` in ./app with Electron NPM config
  await npm(`dedupe --no-audit`, { cwd: './app', env: 'electron' });

  // run `npm ls` in ./app - detects missing peer dependencies, etc.
  await npm(`ls`, { cwd: './app', env: 'electron' });

  // if SQlite was not built with HAVE_NANOSLEEP, do not ship this build! We need nanosleep
  // support so that multiple processes can connect to the sqlite file at the same time.
  // Without it, transactions only retry every 1 sec instead of every 10ms, leading to
  // awful db lock contention.  https://github.com/WiseLibs/better-sqlite3/issues/597
  if (['linux', 'darwin'].includes(process.platform) && (await sqliteMissingNanosleep())) {
    console.error(`better-sqlite compiled without -HAVE_NANOSLEEP, do not ship this build!`);
    process.exit(1001);
  }

  // write the marker with the electron version
  fs.writeFileSync(cacheVersionPath, npmElectronTarget);

  // Always replace existing binaries, including in checkouts with native sources.
  // Updating the submodule alone does not replace an older app/mailsync binary.
  await downloadMailsync();
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
