# 💌 Mailspring

**Mailspring is a new version of Nylas Mail maintained by one of the original authors. It's faster, leaner, and shipping today!** It replaces the JavaScript sync code in Nylas Mail with a new C++ sync engine based on [Mailcore2](https://github.com/MailCore/mailcore2). It uses roughly half the RAM and CPU of Nylas Mail and idles with almost zero "CPU Wakes", which translates to great battery life. It also has an entirely revamped composer and other great new features.

Mailspring's UI is open source (GPLv3) and written in TypeScript with [Electron](https://github.com/atom/electron) and [React](https://facebook.github.io/react/) - it's built on a plugin architecture and was designed to be easy to extend. Check out [CONTRIBUTING.md](https://github.com/Foundry376/Mailspring/blob/master/CONTRIBUTING.md) to get started!

Mailspring's sync engine is spawned by the Electron application and runs locally on your computer. [It is open source (GPLv3) and written in C++ and C.](https://github.com/ChocoTonic/Mailspring-Sync) Installation always downloads the patched fork release pinned in `mailsync-release.json` and verifies its SHA-256 before extraction, including in checkouts containing native sources. Native developers can rebuild that source afterwards. The installed app retains the downloaded native revision and archive digest in `app/mailsync-release.json`.

This fork requires macOS 13.5 or later, matching the patched native sync engine's deployment target and exceeding the [Electron 44 platform minimum](https://www.electronjs.org/blog/electron-44-0). Its native HTTPS protection also requires the supported system libcurl; older unsupported backends fail closed.

On macOS, native HTTPS requests refuse HTTPS proxy URLs because that backend cannot check the proxy certificate before sending proxy credentials. HTTP and SOCKS proxies remain supported.

Native mail authentication rejects DIGEST-MD5 on every platform. Accounts using that mechanism must use a supported server authentication method; the client does not fall back to a weaker method when rejecting it.

Build and install this fork to use these changes. The upstream desktop downloads linked below do not include this fork's native security update.

This security fork uses manual updates from [its GitHub releases](https://github.com/ChocoTonic/Mailspring/releases). Background update checks do not contact the upstream installer feed, which could replace the pinned native security changes. Check for Updates opens the fork releases page. Fork packages are unsigned unless a release explicitly states otherwise.

The verified native Linux binaries and bundled libraries require glibc 2.34 or later on x64 and glibc 2.38 or later on ARM64. These requirements come from their ELF version dependencies. Ubuntu 22.04 ARM64 cannot run that ARM64 binary; Ubuntu 24.04 provides a suitable glibc.

![Mailspring Screenshot](https://github.com/Foundry376/Mailspring/raw/master/screenshots/hero_graphic_mac%402x.png)

## Features

Mailspring comes packed with powerful features like Unified Inbox, Snooze, Send
Later, Mail Rules, Templates and more. Mailspring Pro, which you can unlock
with a monthly subscription, adds even more features for people who send a ton
of email: link tracking, read receipts, mailbox analytics, contact and company
profiles. **All of these features run in the client - Mailspring does not send
your email credentials to the cloud.** For a full list of features, check out
[getmailspring.com](https://getmailspring.com/).

## Download Mailspring

You can download compiled versions of Mailspring for Windows, Mac OS X, and
Linux (deb, rpm and snap) from
[https://getmailspring.com/download](https://getmailspring.com/download).

## Getting Help

You can find community-based help and discussion with other Mailspring users on our
[Discourse community](https://community.getmailspring.com/).

## Contributing

Mailspring is entirely open-source. Pull requests and contributions are
welcome! There are three ways to contribute: building a plugin, building a
theme, and submitting pull requests to the project itself. When you're getting
started, you may want to join our
[Discourse](https://community.getmailspring.com/) so you can ask questions and
learn from other people doing development.

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v2.0%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)

### Running Mailspring from Source

To install all dependencies and run Mailspring from its source code,
run the following commands from the root directory of the Mailspring repository:

```
export npm_config_arch=x64 # If you are on an M1 / Apple Silicon Mac
npm install
npm start
```

You can attach command line parameters by separating them using a double hyphen:

```
npm start -- --help
```

### Building Mailspring

To build Mailspring, you need to run the following command from the root directory
of the Mailspring repository:

```
npm run-script build
```

### Building A Plugin

Plugins lie at the heart of Mailspring and give it its powerful features.
Building your own plugins allows you to integrate the app with other tools,
experiment with new workflows, and more. Follow the [Getting Started
guide](https://Foundry376.github.io/Mailspring/) to write your first plugin in
five minutes.

- To create your own theme, check out the
  [Mailspring-Theme-Starter](https://github.com/Foundry376/Mailspring-Theme-Starter).

- To create your own plugin, check out the
  [Mailspring-Plugin-Starter](https://github.com/Foundry376/Mailspring-Plugin-Starter).

A plugin "store" like the Chrome Web Store is coming soon, and will make it
easy for other users to discover plugins you create. (Right now, users need to
"sideload" the plugins into the app by downloading them and copying them into
place.)

You can share and browse Mailspring Plugins, and discuss plugin development
with other developers, on our
[Discourse](https://community.getmailspring.com/).

### Building a Theme

The Mailspring user interface is styled using CSS, which means it's easy to
modify and extend. Mailspring comes stock with a few beautiful themes, and
there are many more which have been built by community developers. To start
creating a theme, [clone the theme starter](https://github.com/Foundry376/Mailspring-Theme-Starter)!

If you are updating an existing Nylas theme for Mailspring here is a
[step by step tutorial](https://community.getmailspring.com/t/updating-an-n1-nylas-mail-theme-for-mailspring/195).
Notice: as part of the update process you will probably need to [import mailspring base variables](https://github.com/Foundry376/Mailspring/issues/326#issuecomment-343757775).

You can share and browse Mailspring Themes, and discuss theme development with other developers, on our [Discourse](https://community.getmailspring.com/).

### Localizing / Translating

Mailspring (1.5.0 and above) supports localization. If you're a fluent speaker of
another language, we'd love your help improving translations. Check out the
[LOCALIZATION](https://github.com/Foundry376/Mailspring/blob/master/LOCALIZATION.md)
guide for more information. You can discuss localization and translation with
other developers on our [Discourse](https://community.getmailspring.com/).

### Contributing to Mailspring Core

Pull requests are always welcome - check out
[CONTRIBUTING](https://github.com/Foundry376/Mailspring/blob/master/CONTRIBUTING.md)
for more information about setting up the development environment, running
tests locally, and submitting pull requests.
