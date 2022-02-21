module.exports = function ({ title, resolution = {} }) {
  if (title) {
    const [_, h] = title.match(/\((\d+)P\)/i) || [null, null]

    return h ? { height: parseInt(h), width: null } : resolution
  }

  return resolution
}
