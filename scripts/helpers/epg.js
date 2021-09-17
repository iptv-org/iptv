const axios = require('axios')

module.exports = {
  codes: {
    async load() {
      return await axios
        .get('https://iptv-org.github.io/epg/codes.json')
        .then(r => r.data)
        .catch(console.log)
    }
  }
}
