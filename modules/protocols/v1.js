module.exports = function(Orvibo) {
    var _ = require("lodash")
    var validator = require("validator")
    var moment = require("moment")
    var util = require("util")

    Orvibo.v1.magicWord = "6864"
    Orvibo.v1.port = 10000

    Orvibo.events.on("network.message.received", function(message, address) {
        if (message.substring(8, 4) != "706b" || message.substring(8, 4) != "646b") {
            Orvibo.events.emit("v1.message.received", message, address)
        }
    })

    Orvibo.events.on("v1.message.received", function(message, address) {
        Orvibo.debug("Parsing incoming message. Command ID is:", message.substr(8, 4))
        // Get our commandID
        switch (message.substr(8, 4)) {
            // A device has been found
            case "7161":
                // Find out what type of device it is
                switch (message.substr(62, 6)) {
                    // SOC = Socket
                    case "534f43":
                        Orvibo.debug("Found socket", message.substr(14, 12))
                        Orvibo.devices.update({
                            macAddress: message.substr(14, 12),
                            macPadding: message.substr(26, 12),
                            type: ["socket"],
                            address: address.address,
                            port: address.port,
                            protocol: "v1",
                            // Takes the last character from the message and turns it into a boolean.
                            // This is our socket's initial state
                            state: validator.toBoolean(message.substr(message.length - 1, 1)),
                            // Give it a generic name until we discover the real name
                            name: "Socket " + message.substr(14, 12),
                            timers: [],
                            setState: Orvibo.v1.socket.setState,
                            discover: Orvibo.v1.discover,
                            subscribe: Orvibo.v1.subscribe,
                            query: Orvibo.v1.query
                        })

                        Orvibo.events.emit("v1.socket.found", Orvibo.devices.get({
                            macAddress: message.substr(14, 12)
                        }), message, address)
                        break;
                        // IRD = AllOne
                    case "495244":
                        Orvibo.debug("Found AllOne", message.substr(14, 12))
                        Orvibo.devices.update({
                            macAddress: message.substr(14, 12),
                            macPadding: message.substr(26, 12),
                            type: ["allone", "ir", "rf"],
                            address: address.address,
                            port: address.port,
                            protocol: "v1",
                            name: "AllOne " + message.substr(14, 12),
                            timers: [],
                            discover: Orvibo.v1.discover,
                            subscribe: Orvibo.v1.subscribe,
                            query: Orvibo.v1.query
                        })

                        Orvibo.events.emit("v1.allone.found", Orvibo.devices.get({
                            macAddress: message.substr(14, 12)
                        }), message, address)
                        break;
                }
                break;
                // We've asked to subscribe to a socket, and that's been confirmed
            case "636c":
                Orvibo.devices.update({
                    macAddress: message.substr(12, 12),
                    subscribed: new Date()
                })
                Orvibo.debug("Subscription confirmed", Orvibo.devices.get({
                    macAddress: message.substr(12, 12)
                }))
                Orvibo.events.emit("v1.subscribe.success", Orvibo.devices.get({
                    macAddress: message.substr(12, 12)
                }), message, address)
                break;
                // We've queried a device
            case "7274":
                device = Orvibo.devices.get({
                    macAddress: message.substr(12, 12)
                })
                switch (message.substr(46, 2)) {
                    // Table 04 = General info about the device
                    case "04":

                        Orvibo.debug("Query data returned from", device.macAddress)
                        device.password = new Buffer(message.substr(116, 24), 'hex').toString().trim()

                        if (message.substr(140, 32) != "ffffffffffffffffffffffffffffffff") {
                            device.name = new Buffer(message.substr(140, 32), 'hex').toString('ascii').trim() || device.name
                        }

                        device.icon = parseInt(message.substr(172, 4), 16)
                        device.hardwareversion = parseInt(message.substr(176, 8), 16)
                        device.firmwareversion = parseInt(message.substr(184, 8), 16)
                        device.cc3000firmareversion = parseInt(message.substr(192, 8), 16)

                        device.remote = {
                            password: new Buffer(message.substr(116, 24), 'hex').toString('ascii').trim(),
                            serverport: parseInt(v1_protocolObj.switchEndian(message.substr(200, 4)), 16),
                            domainport: parseInt(v1_protocolObj.switchEndian(message.substr(212, 4)), 16),
                            serverip: parseInt(message.substr(204, 2), 16) + "." + parseInt(message.substr(206, 2), 16) + "." + parseInt(message.substr(208, 2), 16) + "." + parseInt(message.substr(210, 2), 16),
                            domainserver: new Buffer(message.substr(216, 80).replace(/00/g, ""), 'hex').toString('ascii').trim()
                        }

                        device.dhcpmode = validator.toBoolean(message.substr(321, 1))
                        device.discoverable = validator.toBoolean(message.substr(323, 1))
                        device.timezoneset = validator.toBoolean(message.substr(325, 1))
                        device.timezone = parseInt(message.substr(326, 2), 16)

                        setTimeout(function() {
                            Orvibo.events.emit("v1.socket.countdown.finished", Orvibo.devices.get({
                                macAddress: message.substr(12, 12)
                            }))
                        }.bind(this), parseInt(message.substr(330, 4)), 16)
                        break
                        // Table 03 is timing data (e.g. what schedules are set up etc.)
                    case "03":

                        device.timers = []
                        var arr = Orvibo.v1.extractRecords(message.substr(56))
                        arr.forEach(function(item) {
                            time = {
                                id: parseInt(item.substr(0, 4), 16),
                                state: validator.toBoolean(item.substr(37, 1)),
                                date: moment({
                                    year: parseInt(item.substr(40, 4), 16),
                                    month: parseInt(item.substr(44, 2), 16) - 1,
                                    day: parseInt(item.substr(46, 2), 16) - 1,
                                    hour: parseInt(item.substr(48, 2), 16) - 1,
                                    minute: parseInt(item.substr(50, 2), 16) - 1,
                                    second: parseInt(item.substr(52, 2), 16) - 1,
                                }),
                                repeat: parseInt(item.substr(54, 2), 16),
                            }
                            device.timers.push(time)

                        }.bind(this))
                        break
                }
                Orvibo.devices.update(device)
                Orvibo.events.emit("v1.message.query.success", device)
                break;
                // Someone has pressed a button on the socket, changing it's state
            case "7366":
                device = Orvibo.devices.get({
                    macAddress: message.substr(12, 12)
                })
                // Extract our state (which is the last byte) and booleanify it
                device.state = validator.toBoolean(message.substr(message.length - 1, 1))
                Orvibo.debug("State change confirmation received. New state is", device.state)
                if (device.state == true) {
                    Orvibo.events.emit("v1.socket.state.on")
                } else {
                    Orvibo.events.emit("v1.socket.state.off")
                }
                // Update our device list
                Orvibo.devices.update(device)
                Orvibo.events.emit("v1.socket.state.change", device, device.state)
                break
        }
    })

    Orvibo.v1.sendMessage = function(messageData, address, port) {
        var packet, len
        var dataStr = ""

        if (typeof messageData["commandID"] === "undefined") {
            throw "commandID missing from message!"
        } else if (typeof messageData["macAddress"] === "undefined") {
            throw "macAddress missing from message!"
        }

        // Go through all of data's properties and merges the values into a single string
        for (key in messageData) {
            dataStr += messageData[key]
        }

        // We need to define packet twice, because we can't determine the length of the string as we're building it.
        // So we build the string, count the length, then redefine the string, with the length we stored earlier.
        packet = Orvibo.v1.magicWord + "0000" + dataStr
        packet = Orvibo.v1.magicWord + _.padStart((packet.length / 2).toString(16).toLowerCase(), 4, "0") + dataStr

        Orvibo.sendPacket(packet, address, port)
        Orvibo.events.emit("v1.message.sent", packet, address)
    }
    Orvibo.v1.discover = function(device) {
        if (typeof this.macAddress !== "undefined" && typeof device === "undefined") {
            device = this
        }
        if (typeof device === "undefined") {
            Orvibo.v1.sendMessage({
                commandID: "7161",
                macAddress: ""
            }, "255.255.255.255", Orvibo.v1.port)
        } else {
            Orvibo.v1.sendMessage({
                commandID: "7161",
                macAddress: device.macAddress || ""
            }, device.address || "255.255.255.255", Orvibo.v1.port)

        }
    }

    Orvibo.v1.subscribe = function(device) {
        if (typeof this.macAddress !== "undefined" && typeof device === "undefined") {
            device = this
        }
        if (typeof device === "undefined") {
            Orvibo.debug("Subscribing to all devices")
            Orvibo.devices.list().forEach(function(item) {
                Orvibo.v1.subscribe(item)
            }.bind(this))
        }
        device = Orvibo.devices.get({
            macAddress: device.macAddress
        })
        Orvibo.v1.sendMessage({
            commandID: "636c",
            macAddress: device.macAddress,
            macPadding: device.macPadding,
            macReversed: Orvibo.switchEndian(device.macAddress),
            macReversedPadding: device.macPadding
        }, device.address, Orvibo.v1.port)
        Orvibo.events.emit("v1.device.subscribe", device, device.address)

    }

    Orvibo.v1.query = function(device, table) {
        if (typeof this.macAddress !== "undefined" && typeof device === "undefined") {
            device = this
        }
        if (typeof device === "undefined") {
            Orvibo.debug("Subscribing to all devices")
            Orvibo.devices.get().forEach(function(item) {
                Orvibo.query(item)
            }.bind(this))
        }

        if (typeof table === "undefined") {
            table = "04"
        }
        Orvibo.v1.sendMessage({
            commandID: "7274",
            macAddress: device.macAddress,
            macPadding: device.macPadding,
            blank: "00000000",
            table: table,
            blank2: "000000000000"
        }, device.address, Orvibo.v1.port)

        Orvibo.events.emit("v1.device.query", device, device.address, table)

    }

    Orvibo.v1.extractRecords = function(data, lengthcount, littleendian) {
        var res = []
        Orvibo.debug("Extracting records from %s", data)
        // Only interested in looping while we have data
        while (data != "") {
            Orvibo.debug("Data left: %s", data)
            if (args.littleendian) {
                num = parseInt(_.flatten(_.chunk(data.substr(0, lengthcount * 2), 2).reverse()).join(""), 16) * 2
            } else {
                num = parseInt(data.substr(0, lengthcount * 2), 16) * 2
            }
            // Get the first two bytes and make it into a number. Spin it all around because these numbers are little endian

            // If the number of bytes to get (factoring in 2 bytes for the length) is less than our remaining data,
            if (num + lengthcount * 2 <= data.length) {
                Orvibo.debug("Pushing %s to the array", data.substr(lengthcount * 2, num))
                // Shove it onto our array
                res.push(data.substr(lengthcount * 2, num))
                // And reset `data` to be the data, less our already-extracted record
                data = data.substr(num + lengthcount * 2)
            } else {
                // If we've got more bytes to grab than there is available, stop
                data = ""
            }
        }
        // Return what we've got.
        Orvibo.debug("Extracted %d records", res.length)
        return res
    }

}
