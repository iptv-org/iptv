import { describe, beforeEach, it, expect } from 'vitest'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'child_process'
import * as fs from 'fs-extra'

const ENV = {
  ...process.env,
  DATA_DIR: 'tests/__data__/input/data',
  STREAMS_DIR: 'tests/__data__/output/streams',
  LOGS_DIR: 'tests/__data__/output/logs',
  GITHUB_REPOSITORY: 'test-owner/test-repo',
  GITHUB_SHA: 'main'
}

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync('tests/__data__/input/discussion_validate/streams', 'tests/__data__/output/streams')
})

describe('discussion:validate', () => {
  it('can handle fulfilled channel search request', () => {
    const discussionNumber = 19956
    const body = '### Channel ID\n\nCNBCe.tr@SD'

    const stdout = runDiscussionValidate(discussionNumber, body)
    if (process.env.DEBUG === 'true') console.log(stdout)

    const result = readResultJson()
    expect(result.status).toBe('fulfilled')
    expect(result.label).toBe('check:failed')
    expect(result.comment).toContain('https://github.com/test-owner/test-repo/blob/main/')
    expect(result.close).toBe('true')
  })

  it('can handle duplicate channel search request', () => {
    const discussionNumber = 19958
    const body = '### Channel ID\n\nCNBCe.tr@SD'

    try {
      runDiscussionValidate(discussionNumber, body)
      throw new Error('Expected process to fail for duplicate request')
    } catch {
      const result = readResultJson()
      expect(result.status).toBe('duplicate_request')
      expect(result.label).toBe('check:failed')
      expect(result.comment).toContain('Duplicate of #19956.')
      expect(result.close).toBe('true')
    }
  })

  it('can handle invalid channel id request', () => {
    const discussionNumber = 19959
    const body = '### Channel ID\n\nCNBCe.com@SD'

    try {
      runDiscussionValidate(discussionNumber, body)
      throw new Error('Expected process to fail for invalid channel ID')
    } catch {
      const result = readResultJson()
      expect(result.status).toBe('invalid_channel_id')
      expect(result.label).toBe('check:failed')
      expect(result.comment).toContain('There is no channel with the ID "CNBCe.com" in the database.')
      expect(result.close).toBe('true')
    }
  })

  it('can handle missing feed id request', () => {
    const discussionNumber = 19960
    const body = '### Channel ID\n\nCNBCe.tr'

    try {
      runDiscussionValidate(discussionNumber, body)
      throw new Error('Expected process to fail for missing feed ID')
    } catch {
      const result = readResultJson()
      expect(result.status).toBe('missing_feed_id')
      expect(result.label).toBe('check:failed')
      expect(result.comment).toContain('The request is missing the feed ID.')
      expect(result.close).toBe('true')
    }
  })
})

function runDiscussionValidate(number: number, body: string) {
  return execFileSync(
    process.execPath,
    [
      '--import',
      'tsx',
      'scripts/commands/discussion/validate.ts',
      '--number',
      `${number}`,
      '--body',
      body
    ],
    { encoding: 'utf8', env: ENV }
  )
}

function readResultJson() {
  const filepath = 'tests/__data__/output/logs/result.json'
  const raw = fs.readFileSync(pathToFileURL(filepath), { encoding: 'utf8' })
  return JSON.parse(raw)
}