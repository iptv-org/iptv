import issues from '../../__data__/input/issues'
import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import * as fs from 'fs-extra'

const ENV_VAR =
  'cross-env DATA_DIR=tests/__data__/input/data STREAMS_DIR=tests/__data__/output/streams LOGS_DIR=tests/__data__/output/logs'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync('tests/__data__/input/issue_validate/streams', 'tests/__data__/output/streams')
})

describe('issue:validate', () => {
  it('can handle streams:add request', () => {
    const body = issues.find(issue => issue.number === 14179)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,streams:add"`

    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      throw new Error('Failed')
    } catch {
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue_validate/logs/streams_add.txt')
      )
    }
  })

  it('can handle streams:remove request', () => {
    const body = issues.find(issue => issue.number === 14150)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,streams:remove"`

    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      throw new Error('Failed')
    } catch {
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue_validate/logs/streams_remove.txt')
      )
    }
  })

  it('can handle streams:edit request', () => {
    const body = issues.find(issue => issue.number === 39097)?.body
    const cmd = `${ENV_VAR} npm run issue:validate --- --body="${body}" --labels="approved,streams:edit"`

    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      throw new Error('Failed')
    } catch {
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue_validate/logs/streams_edit.txt')
      )
    }
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), { encoding: 'utf8' })
}
