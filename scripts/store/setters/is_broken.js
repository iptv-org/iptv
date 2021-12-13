module.exports = function ({ is_broken = false, status }) {
  if (status) {
    return status.level > 3 ? true : false
  }

  return is_broken
}
