module.exports = function(Orvibo) {
  var _ = require("lodash")

  Orvibo.switchEndian = function(data) {
      return _.flatten(_.chunk(data, 2).reverse()).join("")
  }

}
