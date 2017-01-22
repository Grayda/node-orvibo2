var recursive = require("recursive-readdir-sync")
var path = require("path")
var debug = require("debug")("node-orvibo2")

function Orvibo() {

}

Orvibo.prototype.constructor = Orvibo

Orvibo.debug = debug
Orvibo.v1 = {}
Orvibo.v2 = {}

// Load the various parts of the library from the modules folder
var files = recursive(path.join(__dirname, 'modules'));

for (var i = 0; i < files.length; i++) {
	var file = files[i];
	if (file.match(/.*\.js/i)) {
    Orvibo.debug("Loading " + file)
		var mod = require(file)(Orvibo);
	}
}

module.exports = Orvibo
