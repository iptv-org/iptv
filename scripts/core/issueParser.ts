import { Dictionary } from '@freearhey/core'
import { IssueData } from './issueData'
import { Issue } from '../models'

const FIELDS = new Dictionary({
  'Stream ID': 'stream_id',
  'Channel ID': 'channel_id',
  'Feed ID': 'feed_id',
  'Stream URL': 'stream_url',
  Label: 'label',
  Quality: 'quality',
  'HTTP User-Agent': 'http_user_agent',
  'HTTP User Agent': 'http_user_agent',
  'HTTP Referrer': 'http_referrer',
  'What happened to the stream?': 'reason',
  Reason: 'reason',
  Notes: 'notes'
})

export class IssueParser {
  parse(issue: { number: number; body: string; labels: { name: string }[] }): Issue {
    const fields = typeof issue.body === 'string' ? issue.body.split('###') : []

    const data = new Dictionary<string>()
    fields.forEach((field: string) => {
      const parsed = typeof field === 'string' ? field.split(/\r?\n/).filter(Boolean) : []
      let _label = parsed.shift()
      _label = _label ? _label.replace(/ \(optional\)| \(required\)/, '').trim() : ''
      let _value = parsed.join('\r\n')
      _value = _value ? _value.trim() : ''

      if (!_label || !_value) return data

      const id = FIELDS.get(_label)
      const value: string = _value === '_No response_' || _value === 'None' ? '' : _value

      if (!id) return

      data.set(id, value)
    })

    const labels = issue.labels.map(label => label.name)

    return new Issue({ number: issue.number, labels, data: new IssueData(data) })
  }
}
