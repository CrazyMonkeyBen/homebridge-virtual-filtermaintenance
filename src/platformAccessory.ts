import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { VirtualFilterPlatform } from './platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class VirtualFilterAccessory {
  private service: Service;


  constructor (private readonly platform: VirtualFilterPlatform,
         private readonly accessory: PlatformAccessory) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Virtual Filter')
      .setCharacteristic(this.platform.Characteristic.Model,
        accessory.context.deviceConfig['device-type'] + ' - ' + accessory.context.deviceConfig['duration'])
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'VFM-' + accessory.context.deviceConfig['id']);

    // get the service if it exists, otherwise create a new service
    if (accessory.context.deviceConfig['device-type'] === 'button') {
      this.service = this.accessory.getService(this.platform.Service.StatelessProgrammableSwitch) ||
            this.accessory.addService(this.platform.Service.StatelessProgrammableSwitch);

      this.service.getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
        .onGet(this.getDummy.bind(this));
    } else if (accessory.context.deviceConfig['device-type'] === 'purifier') {
      this.service = this.accessory.getService(this.platform.Service.AirPurifier) ||
          this.accessory.addService(this.platform.Service.AirPurifier);

      this.service.getCharacteristic(this.platform.Characteristic.Active)
        .onSet(this.setDummy.bind(this));

      this.service.getCharacteristic(this.platform.Characteristic.Active)
        .onGet(this.getDummy.bind(this));

      this.service.getCharacteristic(this.platform.Characteristic.CurrentAirPurifierState)
        .onGet(this.getDummy.bind(this));

      this.service.getCharacteristic(this.platform.Characteristic.TargetAirPurifierState)
        .onGet(this.getDummy.bind(this));
    } else {
      this.service = this.accessory.getService(this.platform.Service.FilterMaintenance) ||
          this.accessory.addService(this.platform.Service.FilterMaintenance);
    }

    // set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.deviceConfig['filter-name']);
    this.accessory.displayName = accessory.context.deviceConfig['filter-name'];

    // register handlers for the Filter Change Indication Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.FilterChangeIndication)
      .onGet(this.getFilterChangeIndication.bind(this));

    // register handlers for the Filter Life Level Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.FilterLifeLevel)
      .onGet(this.getFilterLifeLevel.bind(this));

    // register handlers for the Reset Filter Indication Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.ResetFilterIndication)
      .onSet(this.setResetFilterIndication.bind(this));


    // Calculate Durration from config
    const durationString = accessory.context.deviceConfig['duration'].trim().toLowerCase();
    let cursor = 0;
    let years = 0;
    let months = 0;
    let days = 0;
    let hours = 0;

    let stringPos = durationString.search('y');
    if (stringPos !== -1) {
      years = durationString.slice(cursor, stringPos);
      cursor = stringPos + 1;
    }

    stringPos = durationString.search('m');
    if (stringPos !== -1) {
      months = durationString.slice(cursor, stringPos);
      cursor = stringPos + 1;
    }

    stringPos = durationString.search('d');
    if (stringPos !== -1) {
      days = durationString.slice(cursor, stringPos);
      cursor = stringPos + 1;
    }

    stringPos = durationString.search('h');
    if (stringPos !== -1) {
      hours = durationString.slice(cursor, stringPos);
      cursor = stringPos + 1;
    }

    if (Number.isNaN(years)) {
      years = 0;
    }
    if (Number.isNaN(hours)) {
      months = 0;
    }
    if (Number.isNaN(hours)) {
      months = 0;
    }
    if (Number.isNaN(hours)) {
      hours = 0;
    }

    if (!years && !months && !days && !hours) {
      months = 3;
    }

    this.platform.log.debug(this.accessory.displayName, durationString,
      ' year:', years, ' month:', months, ' day:', days, ' hour:', hours);

    accessory.context.durationValues = [years, months, days, hours];
    this.platform.api.updatePlatformAccessories([accessory]);

    if (!this.accessory.context.startTime) {
      this.resetTimer();
    }

    this.calculateDuration();
  }

  //tsignore
  async setDummy (value: CharacteristicValue) {
    // Do nothing on set command
    this.platform.log.debug('Set ', value);
  }

  async getDummy (): Promise<CharacteristicValue> {
    // return nothing on get command
    this.platform.log.debug('Get');

    return 0;
  }


  async getFilterChangeIndication (): Promise<CharacteristicValue> {
    this.platform.log.debug(this.accessory.displayName, 'Indication');
    return this.calculateFilterLife()[0];
  }

  async getFilterLifeLevel (): Promise<CharacteristicValue> {
    this.platform.log.debug(this.accessory.displayName, 'LifeLevel');
    return this.calculateFilterLife()[1];
  }

  async setResetFilterIndication (value: CharacteristicValue) {
    this.platform.log.debug('Reset ', value);
    this.resetTimer();
  }

  calculateFilterLife () {
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.accessory.context.startTime;
    let percent = ((this.accessory.context.duration - elapsedTime) / this.accessory.context.duration) * 100;
    let expired = false;

    if (percent < 10) {
      expired = true;
    }
    if (percent < 0) {
      percent = 0;
    }

    this.platform.log.debug(this.accessory.displayName,
      'Calculate Filter: Percent -> ', percent, ' Expired ', expired);

    return [expired, percent];
  }

  calculateDuration () {
    const startTimeMS = this.accessory.context.startTime;

    const endTime = new Date(startTimeMS);
    endTime.setFullYear(endTime.getFullYear() + +this.accessory.context.durationValues[0]);
    endTime.setMonth(endTime.getMonth() + +this.accessory.context.durationValues[1]);
    endTime.setDate(endTime.getDate() + +this.accessory.context.durationValues[2]);
    endTime.setHours(endTime.getHours() + +this.accessory.context.durationValues[3]);
    this.accessory.context.endTime = endTime.getTime();
    this.accessory.context.duration = endTime.getTime() - startTimeMS;

    this.platform.log.debug(this.accessory.displayName, 'Calculate Duration, New Start -> ', new Date(startTimeMS));
    this.platform.log.debug(this.accessory.displayName, 'Calculate Duration, New End -> ', endTime);

    this.platform.api.updatePlatformAccessories([this.accessory]);
  }

  resetTimer () {
    this.accessory.context.startTime = Date.now();
    this.platform.api.updatePlatformAccessories([this.accessory]);

    this.calculateDuration();
  }
}
