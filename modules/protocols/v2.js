module.exports = function(Orvibo) {
  Orvibo.events.on("network.message.received", function(message, address) {
    if(message.substring(8, 4) == "706b" || message.substring(8, 4) == "646b") {
      Orvibo.events.emit("v2.message.received", message, address)
    }
  })
}
