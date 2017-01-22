module.exports = function(Orvibo) {
    var _ = require("lodash")
    Orvibo.devices = {}
    Orvibo.devices.devices = []

    Orvibo.devices.list = function() {
      return Orvibo.devices.devices
    }

    Orvibo.devices.get = function(device) {
      if(typeof device === "undefined") {
        return Orvibo.devices.list()
      } else {
        return _.find(_.values(Orvibo.devices.devices), device)
      }
    }

    Orvibo.devices.add = function(device) {
        if (typeof device.macAddress === "undefined") {
            throw Error("Can't add device, as 'macAddress' is not present in the object passed")
        } else if (typeof device.protocol === "undefined") {
            throw Error("Can't add device, as 'protocol' is not present in the object passed")
        }
        Orvibo.devices.devices[device.macAddress] = device
        return Orvibo.devices.devices[device.macAddress]
    }

    Orvibo.devices.update = function(device) {
        if (typeof device.macAddress === "undefined") {
            throw Error("Can't update device, as 'macAddress' is not present in the object passed")
        }

        Orvibo.devices.devices[device.macAddress] = _.merge(device, Orvibo.devices.devices[device.macAddress])
        return Orvibo.devices.devices[device.macAddress]
    }

    Orvibo.devices.delete = function(device) {
        if (typeof device.macAddress === "undefined") {
            throw Error("Can't delete device, as 'macAddress' is not present in the object passed")
        }

        delete Orvibo.devices.devices[device.macAddress]
        return device
    }
}
