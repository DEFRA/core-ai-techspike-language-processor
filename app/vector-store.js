const { OpenAIEmbeddings } = require('@langchain/openai')
const { PGVectorStore } = require('@langchain/community/vectorstores/pgvector')
const { dbConfig } = require('./config')

const loadVectorStore = async () => {
  return PGVectorStore.initialize(
    new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY
    }),
    dbConfig
  )
}

const filterVectorStore = async (search) => {
  const pgvectorStore = await loadVectorStore()
  pgvectorStore.similaritySearch(search, 1)
}

module.exports = {
  loadVectorStore,
  filterVectorStore
}
