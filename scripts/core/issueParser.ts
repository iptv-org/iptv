import { Dictionary } from '@freearhey/core'
import { Issue } from '../models'
import { IssueData } from './issueData'

const FIELDS = new Dictionary({
  'Stream ID': 'streamId',
  'Channel ID': 'channelId',
  'Feed ID': 'feedId',
  'Stream URL': 'streamUrl',
  'New Stream URL': 'newStreamUrl',
  Label: 'label',
  Quality: 'quality',
  'HTTP User-Agent': 'httpUserAgent',
  'HTTP User Agent': 'httpUserAgent',
  'HTTP Referrer': 'httpReferrer',
  'What happened to the stream?': 'reason',
  Reason: 'reason',
  Notes: 'notes',
  Directives: 'directives'
})

export class IssueParser {
  parse(issue: { number: number; body: string; labels: { name: string }[] }): Issue {
    const fields = typeof issue.body === 'string' ? issue.body.split('###') : []

    const data = new Dictionary()
    fields.forEach((field: string) => {
      const parsed = typeof field === 'string' ? field.split(/\r?\n/).filter(Boolean) : []
      let _label = parsed.shift()
      _label = _label ? _label.replace(/ \(optional\)| \(required\)/, '').trim() : ''
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
