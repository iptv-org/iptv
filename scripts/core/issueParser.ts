import { Dictionary } from './'

export class IssueParser {
  parse(issue: any): Dictionary {
    const data = new Dictionary()
    data.set('issue_number', issue.number)

    const idDict = new Dictionary({
      'Channel ID': 'channel_id',
      'Channel ID (required)': 'channel_id',
      'Broken Link': 'stream_url',
      'Stream URL': 'stream_url',
      'Stream URL (optional)': 'stream_url',
      'Stream URL (required)': 'stream_url',
      Label: 'label',
      Quality: 'quality',
      'Channel Name': 'channel_name',
      'HTTP User-Agent': 'user_agent',
      'HTTP Referrer': 'http_referrer',
      Reason: 'reason',
      'What happened to the stream?': 'reason',
      'Possible Replacement (optional)': 'possible_replacement',
      Notes: 'notes',
      'Notes (optional)': 'notes'
    })

    const fields = issue.body.split('###')

    if (!fields.length) return data

    fields.forEach((field: string) => {
      let [_label, , _value] = field.split(/\r?\n/)
      _label = _label ? _label.trim() : ''
      _value = _value ? _value.trim() : ''

      if (!_label || !_value) return data

      const id: string = idDict.get(_label)
      const value: string = _value === '_No response_' || _value === 'None' ? '' : _value

      if (!id) return

      data.set(id, value)
    })

    return data
  }
}
