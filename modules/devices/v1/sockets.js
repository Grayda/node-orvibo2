module.exports = function(Orvibo) {

    Orvibo.v1.socket = {}

    Orvibo.v1.socket.setState = function(device, state) {
        // We've ignored the device part
        if (typeof device === "boolean") {
            state = device
            device = this
        }

        Orvibo.v1.sendMessage({
            commandID: "6463",
            macAddress: device.macAddress,
            macPadding: device.macPadding,
            blank: "00000000",
            state: state ? "01" : "00"
        }, device, device.port)
    }

}
