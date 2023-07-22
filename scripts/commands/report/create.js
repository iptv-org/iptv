const { api } = require('../../core')
const { Octokit } = require('@octokit/core')
const { paginateRest } = require('@octokit/plugin-paginate-rest')
const CustomOctokit = Octokit.plugin(paginateRest)
const _ = require('lodash')

const octokit = new CustomOctokit()

const DATA_DIR = process.env.DATA_DIR || './tmp/data'
const OWNER = 'iptv-org'
const REPO = 'iptv'

async function main() {
  try {
    await api.channels.load()
    let channels = await api.channels.all()
    channels = _.keyBy(channels, 'id')

    await api.blocklist.load()
    let blocklist = await api.blocklist.all()
    blocklist = _.keyBy(blocklist, 'channel')

    await api.streams.load()
    let streams = await api.streams.all()
    streams = _.keyBy(streams, 'channel')

    const channelRequests = await loadChannelRequests()
    const buffer = {}
    const report = channelRequests.map(r => {
      let result = {
        issueNumber: r.issue.number,
        channelId: r.channel.id || undefined,
        status: undefined
      }

      if (!r.channel || !r.channel.id) result.status = 'error'
      else if (blocklist[r.channel.id]) result.status = 'blocked'
      else if (!channels[r.channel.id]) result.status = 'invalid_id'
      else if (streams[r.channel.id]) result.status = 'fullfilled'
      else if (buffer[r.channel.id] && !r.channel.url) result.status = 'duplicate'
      else result.status = 'pending'

      buffer[r.channel.id] = true

      return result
    })
    console.table(report)
  } catch (err) {
    console.log(err.message)
  }
}

main()

async function loadChannelRequests() {
  const issues = await fetchIssues('channel request')

  return issues.map(parseIssue)
}

async function fetchIssues(labels) {
  const issues = await octokit.paginate('GET /repos/{owner}/{repo}/issues', {
    owner: OWNER,
    repo: REPO,
    per_page: 100,
    labels,
    direction: 'asc',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })

  return issues
}

function parseIssue(issue) {
  const buffer = {}
  const channel = {}
  const fields = {
    'Channel ID (required)': 'id',
    'Channel ID': 'id',
    'Stream URL (optional)': 'url',
    'Stream URL': 'url',
    'Notes (optional)': 'notes',
    Notes: 'notes'
  }

  const matches = issue.body.match(/### ([^\r\n]+)\s+([^\r\n]+)/g)

  if (!matches) return { issue, channel: null }

  matches.forEach(item => {
    const [, fieldLabel, value] = item.match(/### ([^\r\n]+)\s+([^\r\n]+)/)
    const field = fields[fieldLabel]

    if (!field) return

    buffer[field] = value === '_No response_' ? undefined : value.trim()
  })

  for (let field in buffer) {
    channel[field] = buffer[field]
  }

  return { issue, channel }
}
