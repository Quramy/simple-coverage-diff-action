import { cwd } from "node:process"
import { relative } from "node:path"
import { readFile } from "node:fs/promises"
import { getInput, info } from "@actions/core"
import { getOctokit, context } from "@actions/github"

import { diff, JsonSummary } from "coverage-diff"

const pwd = cwd()

function stripAbsolute(summaryJson: JsonSummary): JsonSummary {
  return Object.entries(summaryJson).reduce(
    (acc, [k, v]) => (k !== "total" && k.startsWith(pwd) ? { ...acc, [relative(pwd, k)]: v } : { ...acc, [k]: v }),
    {} as JsonSummary,
  )
}

async function main() {
  const githubToken = getInput("github-token")
  const headSummaryJsonFilename = getInput("head-summary-json")
  const baseSummaryJsonFileName = getInput("base-summary-json")
  const bodyHeader = getInput("body-header").trim()
  const bodyFooter = getInput("body-footer").trim()

  const headSummary = JSON.parse(await readFile(headSummaryJsonFilename, "utf-8")) as JsonSummary
  const baseSummary = JSON.parse(await readFile(baseSummaryJsonFileName, "utf-8")) as JsonSummary

  const octokit = getOctokit(githubToken)

  const { results } = diff(stripAbsolute(baseSummary), stripAbsolute(headSummary), {})

  const repo = context.repo
  const issue_number = context.payload?.pull_request?.number

  const body = bodyHeader + "\n\n" + results + "\n\n" + bodyFooter

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
