import { Dictionary } from '@freearhey/core'
import { Issue } from '../models'
import { IssueData } from './issueData'

const FIELDS = new Dictionary({
  'Channel ID': 'channelId',
  'Channel ID (required)': 'channelId',
  'Stream URL': 'streamUrl',
  'Stream URL (optional)': 'streamUrl',
  'Stream URL (required)': 'streamUrl',
  'Broken Link': 'brokenLinks',
  'Broken Links': 'brokenLinks',
  Label: 'label',
  Quality: 'quality',
  'Channel Name': 'channelName',
  'HTTP User-Agent': 'httpUserAgent',
  'HTTP User Agent': 'httpUserAgent',
  'HTTP Referrer': 'httpReferrer',
  'What happened to the stream?': 'reason',
  Reason: 'reason',
  Notes: 'notes',
  'Notes (optional)': 'notes'
})

export class IssueParser {
  parse(issue: { number: number; body: string; labels: { name: string }[] }): Issue {
    const fields = typeof issue.body === 'string' ? issue.body.split('###') : []

    const data = new Dictionary()
    fields.forEach((field: string) => {
      const parsed = typeof field === 'string' ? field.split(/\r?\n/).filter(Boolean) : []
      let _label = parsed.shift()
      _label = _label ? _label.trim() : ''
      let _value = parsed.join('\r\n')
      _value = _value ? _value.trim() : ''

      if (!_label || !_value) return data

      const id: string = FIELDS.get(_label)
      const value: string = _value === '_No response_' || _value === 'None' ? '' : _value

      if (!id) return

      data.set(id, value)
    })

    const labels = issue.labels.map(label => label.name)

    return new Issue({ number: issue.number, labels, data: new IssueData(data) })
  }
}
