const { loadSummarizationChain } = require('langchain/chains')
const { TokenTextSplitter } = require('langchain/text_splitter')
const { Document } = require('langchain/document')
const { PromptTemplate } = require('@langchain/core/prompts')
const { ChatOpenAI } = require('@langchain/openai')
const { downloadFile } = require('./storage/blob-repository')
const { blobConfig } = require('./config')
const mammoth = require('mammoth')

const summaryRefineTemplate = `
You are an expert in summarizing corospondence and writing a reply in the form of a letter.
Your goal is to create a summary of a corospondence and write a reply in the form of a letter.
We have provided an existing summary up to a certain point: {existing_answer}

Below you find the transcript of a corospondence:
--------
{text}
--------

Given the new context, refine the summary.
The transcript of the corospondence will also be used as the basis for the reply in the form of a letter.

If the context isn't useful, return the original summary.
Total output will be a summary of the corospondence and a reply in the form of a letter.

SUMMARY AND REPLY:
`

const summaryTemplate = `
You are an expert in summarizing corospondence and writing a repy in the form of a letter.
Your goal is to create a summary of a corospondence and write a reply in the form of a letter.
Below you find the transcript of a corospondence:
--------
{text}
--------

The transcript of the corospondence will also be used as the basis for writing a reply in the form of a letter.

Total output will be a summary of the corospondence and a reply in the form of a letter.

SUMMARY AND REPLY:
`
const createChatOpenAI = () => new ChatOpenAI({ modelName: 'gpt-3.5-turbo', temperature: 0 })

const downloadAndExtractText = async (filename) => {
  const downloadDocument = await downloadFile(filename, blobConfig.documentContainer, '')
  const extractDocumentText = await mammoth.extractRawText({ buffer: downloadDocument })
  return extractDocumentText.value
}

const createDocument = (text, filename) => {
  return new Document({ pageContent: text, metadata: { source: filename } })
}

const splitDocument = async (doc) => {
  const splitter = new TokenTextSplitter({
    chunkSize: 10000,
    chunkOverlap: 250
  })
  return await splitter.splitDocuments([doc])
}

const createSummarizeChain = () => {
  const llmSummary = createChatOpenAI()
  const SUMMARY_PROMPT = PromptTemplate.fromTemplate(summaryTemplate)
  const SUMMARY_REFINE_PROMPT = PromptTemplate.fromTemplate(summaryRefineTemplate)

  return loadSummarizationChain(llmSummary, {
    type: 'refine',
    verbose: true,
    questionPrompt: SUMMARY_PROMPT,
    refinePrompt: SUMMARY_REFINE_PROMPT
  })
}

const summeriseDocument = async (filename) => {
  const text = await downloadAndExtractText(filename)
  const doc = createDocument(text, filename)
  const docsSummary = await splitDocument(doc)
  const summarizeChain = createSummarizeChain()

  return summarizeChain.run(docsSummary)
}

module.exports = {
  summeriseDocument
}
