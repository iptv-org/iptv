const { logger, db } = require('../../core')

async function main() {
  await db.streams.load()
  const docs = await db.streams.find({}).sort({ cluster_id: 1 })
  const cluster_id = docs.reduce((acc, curr) => {
    if (!acc.includes(curr.cluster_id)) acc.push(curr.cluster_id)
    return acc
  }, [])

  const matrix = { cluster_id }
  const output = `::set-output name=matrix::${JSON.stringify(matrix)}`
  logger.info(output)
}

main()
