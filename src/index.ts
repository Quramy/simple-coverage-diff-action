import { readFile } from "node:fs/promises"
import { getInput, info } from "@actions/core"
import { getOctokit, context } from "@actions/github"

import { diff } from "coverage-diff"

async function main() {
  const githubToken = getInput("github-token")
  const headSummaryJsonFilename = getInput("head-summary-json")
  const baseSummaryJsonFileName = getInput("base-summary-json")

  const coverage = JSON.parse(await readFile(headSummaryJsonFilename, "utf-8"))
  const baseSummary = JSON.parse(await readFile(baseSummaryJsonFileName, "utf-8"))

  const octokit = getOctokit(githubToken)

  const { results: body } = diff(baseSummary, coverage, {})

  const repo = context.repo
  const issue_number = context.payload?.pull_request?.number

  if (issue_number != null) {
    await octokit.rest.issues.createComment({
      ...repo,
      issue_number,
      body,
    })
  } else {
    info("Skip because context does not have pull_request")
  }
}

main()
