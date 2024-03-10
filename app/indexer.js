const { loadVectorStore } = require('./vector-store')
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter')
const { AzureBlobStorageContainerLoader } = require('langchain/document_loaders/web/azure_blob_storage_container')
const { Document } = require('langchain/document')
const { CheerioWebBaseLoader } = require('langchain/document_loaders/web/cheerio')
const { downloadFile } = require('./storage/blob-repository')
const { blobConfig } = require('./config')
const mammoth = require('mammoth')

const loadDocuments = async (loader) => await loader.load()

const splitDocuments = async (docs) => {
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 })
  return await textSplitter.splitDocuments(docs)
}

const addDocumentsToStore = async (store, docs) => await store.addDocuments(docs)

const indexBlobFromText = async (filename) => {
  const downloadDocument = await downloadFile(filename, blobConfig.knowledgeBaseContainer, '')
  const extractDocumentText = await mammoth.extractRawText({ buffer: downloadDocument })

  const docs = new Document({ pageContent: extractDocumentText.value, metadata: { source: filename } })
  return indexDocuments([docs])
}

const indexBlob = async (blob) => {
  const loader = new AzureBlobStorageContainerLoader({
    azureConfig: {
      connectionString: blobConfig.connectionString,
      container: 'knowledge-base'
    },
    unstructuredConfig: {
      apiUrl: 'http://localhost:8000/general/v0/general',
      apiKey: ''
    }
  })

  const docs = await loadDocuments(loader)
  return indexDocuments(docs)
}

const indexWebPage = async (url) => {
  const createWebLoader = (url) => new CheerioWebBaseLoader(url)
  const loader = createWebLoader(url)
  const docs = await loadDocuments(loader)
  return indexDocuments(docs)
}

const indexDocuments = async (docs) => {
  const pgvectorStore = await loadVectorStore()
  const splits = await splitDocuments(docs)

  await addDocumentsToStore(pgvectorStore, splits)
  await pgvectorStore.end()

  console.log(splits[0])

  return splits.map(split => ({ metadata: split.metadata }))
}

const deleteDocuments = async (url) => {
  const pgvectorStore = await loadVectorStore()
  await pgvectorStore.delete({ filter: { metadata: { source: url } } })
  await pgvectorStore.end()
}

module.exports = {
  indexWebPage,
  indexBlob,
  indexBlobFromText,
  deleteDocuments
}
