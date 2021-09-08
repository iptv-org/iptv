const file = require('./helpers/file')

file.list().then(files => {
  const country = files.map(file => file.replace(/channels\/|\.m3u/gi, ''))
  const matrix = { country }
  const output = `::set-output name=matrix::${JSON.stringify(matrix)}`
  console.log(output)
})
