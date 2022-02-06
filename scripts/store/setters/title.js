module.exports = function ({ title }) {
  return title
    .trim()
    .split(' ')
    .map(s => s.trim())
    .filter(s => {
      return !/\[|\]/i.test(s) && !/\((\d+)P\)/i.test(s)
    })
    .join(' ')
}
