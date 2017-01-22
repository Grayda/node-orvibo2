var Orvibo = require("../../index.js")

t = setInterval(function() {
  Orvibo.v1.discover()
}, 1000)

Orvibo.events.on("v1.socket.found", function(device) {
  Orvibo.debug("EXAMPLE: Socket found. Subscribing")
  clearInterval(t)
  device.subscribe()
})

Orvibo.events.on('v1.subscribe.success', function(device) {
  Orvibo.debug("EXAMPLE: Socket subscribed. Toggling state")
  setInterval(function() {
    device.setState(!device.state)
  }, 1000)
})
