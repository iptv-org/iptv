var parsers = require('playlist-parser');
var M3U = parsers.M3U;
var fs = require("fs");
var axios = require('axios')
var path = require('path')

var errorLog = path.resolve(__dirname) + '/../error.log'

var instance = axios.create({ timeout: 10000, maxRedirects: 0 })

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

    if(/(\.m3u|\.m3u8)/i.test(file)) {

      try{
        var response = await instance.get(file)
        console.log(file)
        console.log(response.status)

        var sublist = M3U.parse(response.data);
        // console.log(sublist)
        _parsePlaylist(file, sublist)

      } catch(err) {
        console.log(file)
        console.log('Error:',err.message)

        if(err.response && /(404)/.test(err.response.status)) {
          _writeToLog('testThatAllLinksIsWorking', err.message, file)
        }

      }
    }

    return
  })
}

function testThatAllLinksIsWorking() {

  var playlist = M3U.parse(fs.readFileSync(path.resolve(__dirname) + "/../index.m3u", { encoding: "utf8" }));
  // playlist = playlist.slice(1600, 1700)

  _parsePlaylist(null, playlist)

}

testThatAllLinksIsWorking()
