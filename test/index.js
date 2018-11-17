var parsers = require('playlist-parser');
var M3U = parsers.M3U;
var fs = require("fs");
var axios = require('axios')
var path = require('path')

var errorLog = path.resolve(__dirname) + '/../error.log'

var instance = axios.create()

function _writeToLog(test, msg, url) {
  var now = new Date()
  var line = `${now.toISOString()} ${test}(): ${msg} '${url}'`
  fs.appendFileSync(errorLog, line + '\n')
}

function _getFullPathToFile(parent, file) {
  if(/(http|https)/i.test(file) || !parent) {
    return file
  }

  var parsedUrl = parent.substring(0, parent.lastIndexOf("/"))

  return parsedUrl + '/' + file
}

function _parsePlaylist(parent, playlist) {
  playlist.forEach(async (item) => {
    if(!item) return

    var file = _getFullPathToFile(parent, item.file)

    if(/^(http)/i.test(file) && /(\.m3u|\.m3u8)/i.test(file)) {

      try {
        var response = await instance.get(file)
        // console.log(file)
        // console.log(response.status)

        // DEBUG: return errors if link is working
        // var sublist = M3U.parse(response.data);
        // _parsePlaylist(file, sublist)

      } catch(err) {
        console.log(file)
        console.log('Error:',err.message)

        if(err.response || err.request) {
          _writeToLog('testThatAllLinksIsWorking', err.message, file)
          process.exit(0)
        }
      }
    }

    return
  })
}

function testThatAllLinksIsWorking() {

  var playlist = M3U.parse(fs.readFileSync(path.resolve(__dirname) + "/../index.m3u", { encoding: "utf8" }));
  // playlist = playlist.slice(1600, 1700)
  // playlist = [{ file: 'http://163.172.107.234:1914/live/medoum1/FH6Oxe1vOH/19.m3u8' }]

  _parsePlaylist(null, playlist)

}

testThatAllLinksIsWorking()
