module.exports = function(Orvibo) {
  var EventEmitter = require("pattern-emitter")
  Orvibo.events = new EventEmitter()
}
