
<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>


# Homebridge Plugin For Virtual Filter Maintenance Timers

This plugin creates a virtual dummy device with FilterMaintenance properties, which allows you to check on the status
various filters or other things which need regular replacement or cleaning, such as whole house water filters, furnace
filters (if you don't have a smart thermostat with its own filter maintenance property), vent filters, or anything
that requires a periodic reminder.

The filter maintenance timers can be set to any number of days, months, or years, and each filter has it's own timer
duration and reset.

Unfortuanatly support for filter maintenance is poor in the Apple Home app, but the Eve app has reasonable support
including display of filter status, life remaining (in percent), a reset button, and the ability to trigger automations
based on both status and life percent.

With the use of additional Homebridge plugins, automations could be setup to notify the user when filters need attention.

## Device Types

3 types af devices are provided, each has its own strengths and weeknesses in the different apps.

### FilterMaintenance

The basic FilterMaintenance device does not pretend to be anything else. The Apple Home app does not support this device
in any way. It will display as a device but will say it is unsupported. It will not show any status information, and can
ot be reset.

However in the Eve app, FilterMaintenance has full functionality. The status can be displayed on the At a Glance screen
and status, life and reset are displayed in the room view.

### Air Purifier

This pretends to be an air purifier which doesn't do anything. The filter status and life will be displayed in the device
Accessory Details screen, however Home does not provice a reset button. Home will display a tiny warning icon in the device
tile when the filter life is low.

The behaviour in the Eve app is similar to the Home app, but also includes a filter reset button. Unlike the Filter
Maintenance device type, the At a Glace tile will only show if the air purifier is running (it isn't), not the status of
the filter.

### Button

This emulates a stateless switch with no functionality. It has similar behaviour as the air purifier in both apps, but 
without the clutter in your climate device summary.


## Configuration

- **platform** Must be "VirtualFilterMaintenance"
- **name** The display name of the plugin
- **filters** An array of filter devices
- **filter-name** The display name for your filter or device
- ** id** Must be unique amongst all the filters. Can be any length, letters or numbers
- **duration** Maintenance interval in Years, Months, Days, Hours. "1y 2m 3d 4h"
- **device-type** "filter", "purifier", or "button"

```json
{
  "platforms": [
    {
      "name": "VirtualFilterMaintenance",
      "filters": [
        {
          "filter-name": "Basic Filter",
          "id": "1",
          "duration": "3m",
          "device-type": "filter"
        },
        {
          "filter-name": "Purifier Filter",
          "id": "2",
          "duration": "1y 6m",
          "device-type": "purifier"
        },
        {
          "filter-name": "Button Filter",
          "id": "3",
          "duration": "7d12h",
          "device-type": "button"
        }
      ],
      "platform": "VirtualFilterMaintenance"
    }
  ]
}
```

