module.exports = function ({ http_referrer }) {
  return http_referrer || null
}
