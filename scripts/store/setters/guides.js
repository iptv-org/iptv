module.exports = function ({ tvg_url, guides = [] }) {
  return tvg_url ? [tvg_url] : guides
}
