import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { VirtualFilterAccessory } from './platformAccessory';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class VirtualFilterPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];


  constructor (public readonly log: Logger,
         public readonly config: PlatformConfig,
         public readonly api: API) {
    this.log.info('Finished initializing platform:', this.config.name);

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices();
    });
  }


  /*
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory (accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }


  discoverDevices () {
    const deviceConfigs = this.config.filters;

    // loop over the discovered devices and register each one if it has not already been registered
    for (const deviceConfig of deviceConfigs) {

      // generate a unique id for the accessory
      const uuid = this.api.hap.uuid.generate('VirtualFilterMaintenance' + deviceConfig['id']);

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      let accessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (accessory) {
        // the accessory already exists
        this.log.info('Restoring existing accessory from cache:', accessory.displayName);

        accessory.context.deviceConfig = deviceConfig;
        this.api.updatePlatformAccessories([accessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        new VirtualFilterAccessory(this, accessory);
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', deviceConfig['filter-name'], uuid);

        // create a new accessory
        accessory = new this.api.platformAccessory(deviceConfig['filter-name'], uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.deviceConfig = deviceConfig;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new VirtualFilterAccessory(this, accessory);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }
}
