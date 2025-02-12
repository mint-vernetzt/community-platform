/// <reference types="node" />

// There is no type declaration available for the matomo-tracker library
// This is a declaration file created by the typescript compiler based on the node_modules/matomo-tracker/index.js file

declare module "matomo-tracker" {
  export = MatomoTracker;
  /**
   * @constructor
   * @param {Number} siteId     Id of the site you want to track
   * @param {String} trackerUrl URL of your Matomo instance
   * @param {Boolean} [true] noURLValidation Set to true if the `piwik.php` has been renamed
   */
  declare function MatomoTracker(
    siteId: number,
    trackerUrl: string,
    // TODO: fix type issue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    noURLValidation: any
  ): MatomoTracker;
  declare class MatomoTracker {
    /**
     * @constructor
     * @param {Number} siteId     Id of the site you want to track
     * @param {String} trackerUrl URL of your Matomo instance
     * @param {Boolean} [true] noURLValidation Set to true if the `piwik.php` has been renamed
     */
    // TODO: fix type issue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(siteId: number, trackerUrl: string, noURLValidation: any);
    siteId: number;
    trackerUrl: string;
    // TODO: fix type issue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    agent: any;
    /**
     * Executes the call to the Matomo tracking API
     *
     * For a list of tracking option parameters see
     * https://developer.matomo.org/api-reference/tracking-api
     *
     * @param {(String|Object)} options URL to track or options (must contain URL as well)
     */
    // TODO: fix type issue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    track(options: string | any): void;
    // TODO: fix type issue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trackBulk(events: any, callback: any): void;
  }
}
