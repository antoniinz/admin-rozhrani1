/* settings.js
 * Account/site settings that aren't part of auth itself (site title,
 * tagline). Password + display-name changes live in auth.js since they
 * touch the user record directly.
 */

const Settings = {
  get() {
    return Storage.getSettings();
  },
  update(patch) {
    return Storage.updateSettings(patch);
  }
};
