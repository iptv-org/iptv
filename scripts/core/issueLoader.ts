import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods'
import { paginateRest } from '@octokit/plugin-paginate-rest'
import { Octokit } from '@octokit/core'
import { Collection, IssueParser } from './'
import { TESTING, OWNER, REPO } from '../constants'

const CustomOctokit = Octokit.plugin(paginateRest, restEndpointMethods)
const octokit = new CustomOctokit()

export class IssueLoader {
  async load({ labels }: { labels: string[] | string }) {
    labels = Array.isArray(labels) ? labels.join(',') : labels
    let issues: any[] = []
    if (TESTING) {
      switch (labels) {
        case 'streams:add':
          issues = (await import('../../tests/__data__/input/issues/streams_add')).default
          break
        case 'streams:edit':
          issues = (await import('../../tests/__data__/input/issues/streams_edit')).default
          break
        case 'broken stream':
          issues = (await import('../../tests/__data__/input/issues/broken_stream')).default
          break
        case 'streams:add,approved':
          issues = (await import('../../tests/__data__/input/issues/streams_add_approved')).default
          break
        case 'streams:edit,approved':
          issues = (await import('../../tests/__data__/input/issues/streams_edit_approved')).default
          break
        case 'streams:remove,approved':
          issues = (await import('../../tests/__data__/input/issues/streams_remove_approved'))
            .default
          break
      }
    } else {
      issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
        owner: OWNER,
        repo: REPO,
        per_page: 100,
        labels,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    }

    const parser = new IssueParser()

    return new Collection(issues).map(parser.parse)
  }
}
