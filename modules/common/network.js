module.exports = function(Orvibo) {
    var ip = require("ip")
    var dgram = require("dgram")
    // The ports we're going to be listening and sending on
    var ports = [
        10000, // v1 communication
        48899, // v1 setup
        9999, // v2 communication
        4999 // Uhh.. v2 setup perhaps?
    ]
    
    Orvibo.sockets = []
    Orvibo.sendPacket = function(message, address, port) {
        Orvibo.sockets.forEach(function(socket) {
            if (socket.port == port || typeof port === "undefined") {
                socket.socket.send(new Buffer(message.toLowerCase(), "hex"), socket.port, address, function(err, bytes) {
                    if (err) {
                        Orvibo.debug(err)
                    } else {
                        Orvibo.debug("Sent message", bytes + " bytes", "Address: " + address, message)
                    }
                })
            }
        })
    }

    ports.forEach(function(port) {
        var udp = dgram.createSocket("udp4")
        udp.bind(port, function() {
            udp.setBroadcast(true)
        })

        udp.on("message", function(message, address) {
            // If it's from us, we don't want it
            if (ip.address() == address.address) {
                return
            }

            message = new Buffer(message).toString("hex").toLowerCase()
            Orvibo.debug("Message received", message, address)

            // If the packet doesn't contain our magic word, we don't want it
            if (message.substring(0, 4) !== "6864") {
                return
            }

            Orvibo.events.emit("network.message.received", message, address)

        })

        Orvibo.sockets.push({
            "port": port,
            "socket": udp
        })
    })
}
