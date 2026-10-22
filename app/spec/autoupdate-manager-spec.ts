import AutoUpdateManager from '../src/browser/autoupdate-manager';
import { shell } from 'electron';

describe('AutoUpdateManager', function () {
  beforeEach(function () {
    this.mailspringIdentityId = null;
    this.specMode = true;
    this.config = {
      set: jasmine.createSpy('config.set'),
      get: (key) => {
        if (key === 'identity.id') {
          return this.mailspringIdentityId;
        }
        if (key === 'env') {
          return 'production';
        }
      },
      onDidChange: (key, callback) => {
        return callback();
      },
    };
  });

  describe('security fork updates', () => {
    it('does not initialize the upstream updater', function () {
      const m = new AutoUpdateManager('1.26.0', this.config, this.specMode);
      spyOn(m, 'usesForkUpdates').andReturn(true);
      m.setupAutoUpdater();
      expect(m.getState()).toEqual('unsupported');
    });

    it('does not query upstream or open a browser for background checks', function () {
      const m = new AutoUpdateManager('1.26.0', this.config, this.specMode);
      spyOn(m, 'usesForkUpdates').andReturn(true);
      spyOn(m, 'updateFeedURL');
      spyOn(shell, 'openExternal');
      m.check({ hidePopups: true });
      expect(m.updateFeedURL).not.toHaveBeenCalled();
      expect(shell.openExternal).not.toHaveBeenCalled();
    });

    it('opens the fork releases for an explicit update check', function () {
      const m = new AutoUpdateManager('1.26.0', this.config, this.specMode);
      spyOn(m, 'usesForkUpdates').andReturn(true);
      spyOn(shell, 'openExternal');
      m.check();
      expect(shell.openExternal).toHaveBeenCalledWith(
        'https://github.com/ChocoTonic/Mailspring/releases'
      );
    });

    it('never installs from the upstream feed', function () {
      const m = new AutoUpdateManager('1.26.0', this.config, this.specMode);
      spyOn(m, 'usesForkUpdates').andReturn(true);
      spyOn(shell, 'openExternal');
      m.install();
      expect(shell.openExternal).toHaveBeenCalledWith(
        'https://github.com/ChocoTonic/Mailspring/releases'
      );
    });
  });

  describe('with attached commit version', () =>
    it('correctly sets the feedURL', function () {
      const m = new AutoUpdateManager('3.222.1-abc', this.config, this.specMode);
      spyOn(m, 'setupAutoUpdater');
      expect(m.feedURL).toEqual(
        'https://updates.getmailspring.com/check/' +
          process.platform +
          '/' +
          process.arch +
          '/3.222.1-abc/anonymous/stable'
      );
    }));

  describe('with no attached commit', () =>
    it('correctly sets the feedURL', function () {
      const m = new AutoUpdateManager('3.222.1', this.config, this.specMode);
      spyOn(m, 'setupAutoUpdater');
      expect(m.feedURL).toEqual(
        'https://updates.getmailspring.com/check/' +
          process.platform +
          '/' +
          process.arch +
          '/3.222.1/anonymous/stable'
      );
    }));

  describe('when an update identity is already set', () =>
    it('should send it and not save any changes', function () {
      this.mailspringIdentityId = 'test-mailspring-id';
      const m = new AutoUpdateManager('3.222.1', this.config, this.specMode);
      expect(m.feedURL).toEqual(
        'https://updates.getmailspring.com/check/' +
          process.platform +
          '/' +
          process.arch +
          '/3.222.1/test-mailspring-id/stable'
      );
    }));

  describe('when an update identity is added', () =>
    it('should update the feed URL', function () {
      const m = new AutoUpdateManager('3.222.1', this.config, this.specMode);
      spyOn(m, 'setupAutoUpdater');
      expect(m.feedURL.includes('anonymous')).toEqual(true);
      this.mailspringIdentityId = 'test-mailspring-id';
      m.updateFeedURL();
      expect(m.feedURL.includes(this.mailspringIdentityId)).toEqual(true);
    }));
});
