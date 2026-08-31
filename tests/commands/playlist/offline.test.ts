import { execSync } from 'child_process'
import path from 'node:path'

type ExecError = {
  stdout: string
  stderr: string
}

describe('playlist:test', () => {
  it('fails when the network is unavailable', () => {
    const preload = path.resolve('tests/__data__/input/offline_dns.cjs').replaceAll('\\', '/')
    const cmd =
      `cross-env NODE_OPTIONS="--require=${preload}" npm run playlist:test -- streams/af.m3u`

    try {
      execSync(cmd, { encoding: 'utf8' })
      throw new Error('Expected playlist:test to fail offline')
    } catch (error) {
      const output = `${(error as ExecError).stdout || ''}${(error as ExecError).stderr || ''}`
      expect(output).toContain('Internet connection is required for the script to work')
    }
  })
})
