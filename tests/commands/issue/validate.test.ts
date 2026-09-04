import issues from '../../__data__/input/issues'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'child_process'
import * as fs from 'fs-extra'

const ENV = {
  ...process.env,
  DATA_DIR: 'tests/__data__/input/data',
  STREAMS_DIR: 'tests/__data__/output/streams',
  LOGS_DIR: 'tests/__data__/output/logs'
}

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync('tests/__data__/input/issue_validate/streams', 'tests/__data__/output/streams')
})

describe('issue:validate', () => {
  it('can handle streams:add request', () => {
    const body = issues.find(issue => issue.number === 14179)?.body

    try {
      const stdout = runIssueValidate(body, 'approved,streams:add')
      if (process.env.DEBUG === 'true') console.log(stdout)
      throw new Error('Failed')
    } catch {
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue_validate/logs/streams_add.txt')
      )
    }
  })

  it('can handle streams:remove request', () => {
    const body = issues.find(issue => issue.number === 14150)?.body

    try {
      const stdout = runIssueValidate(body, 'approved,streams:remove')
      if (process.env.DEBUG === 'true') console.log(stdout)
      throw new Error('Failed')
    } catch {
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue_validate/logs/streams_remove.txt')
      )
    }
  })

  it('can handle streams:edit request', () => {
    const body = issues.find(issue => issue.number === 39097)?.body

    try {
      const stdout = runIssueValidate(body, 'approved,streams:edit')
      if (process.env.DEBUG === 'true') console.log(stdout)
      throw new Error('Failed')
    } catch {
      expect(content('tests/__data__/output/logs/errors.txt')).toBe(
        content('tests/__data__/expected/issue_validate/logs/streams_edit.txt')
      )
    }
  })
})

function runIssueValidate(body: string | undefined, labels: string) {
  return execFileSync(
    process.execPath,
    [
      '--import',
      'tsx',
      'scripts/commands/issue/validate.ts',
      '--body',
      `${body}`,
      '--labels',
      labels
    ],
    { encoding: 'utf8', env: ENV }
  )
}

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), { encoding: 'utf8' })
}
