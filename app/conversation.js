const { ChatOpenAI } = require('@langchain/openai')
const { StringOutputParser } = require('@langchain/core/output_parsers')
const { PromptTemplate } = require('@langchain/core/prompts')
const { formatDocumentsAsString } = require('langchain/util/document')
const { RunnableSequence, RunnablePassthrough, RunnableMap } = require('@langchain/core/runnables')
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts')
const { loadVectorStore } = require('./vector-store')

const contextualizeQSystemPrompt = `Given a chat history and the latest user question
which might reference context in the chat history, formulate a standalone question
which can be understood without the chat history. Do NOT answer the question,
just reformulate it if needed and otherwise return it as is.`

const template = `Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.
Use three sentences maximum and keep the answer as concise as possible.

{context}

Question: {question}

Helpful Answer:`

const createChatOpenAI = () => new ChatOpenAI({ modelName: 'gpt-3.5-turbo', temperature: 0 })

const askQuestion = async (question) => {
  const pgvectorStore = await loadVectorStore()
  const retriever = pgvectorStore.asRetriever()
  const customRagPrompt = PromptTemplate.fromTemplate(template)
  const llm = createChatOpenAI()

  const ragChain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough()
    },
    customRagPrompt,
    llm,
    new StringOutputParser()
  ])

  return ragChain.invoke(question)
}

const askQuestionWithSources = async (question) => {
  const pgvectorStore = await loadVectorStore()
  const retriever = pgvectorStore.asRetriever()
  const customRagPrompt = PromptTemplate.fromTemplate(template)
  const llm = createChatOpenAI()

  const ragChainFromDocs = RunnableSequence.from([
    RunnablePassthrough.assign({
      context: (input) => formatDocumentsAsString(input.context)
    }),
    customRagPrompt,
    llm,
    new StringOutputParser()
  ])

  let ragChainWithSource = new RunnableMap({
    steps: { context: retriever, question: new RunnablePassthrough() }
  })

  ragChainWithSource = ragChainWithSource.assign({ answer: ragChainFromDocs })

  return ragChainWithSource.invoke(question)
}

const askQuestionWithHistory = async (question) => {
  const pgvectorStore = await loadVectorStore()
  const retriever = pgvectorStore.asRetriever()
  const customRagPrompt = PromptTemplate.fromTemplate(template)
  const llm = createChatOpenAI()

  const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
    ['system', contextualizeQSystemPrompt],
    new MessagesPlaceholder('chat_history'),
    ['human', '{question}']
  ])

  const contextualizeQChain = contextualizeQPrompt
    .pipe(llm)
    .pipe(new StringOutputParser())

  const contextualizedQuestion = (input) => {
    if ('chat_history' in input) {
      return contextualizeQChain
    }
    return input.question
  }

  const ragChain = RunnableSequence.from([
    RunnablePassthrough.assign({
      context: (input) => {
        if ('chat_history' in input) {
          const chain = contextualizedQuestion(input)
          return chain.pipe(retriever).pipe(formatDocumentsAsString)
        }
        return ''
      }
    }),
    customRagPrompt,
    llm
  ])

  let chatHistory = []

  const msgResponse = ragChain.invoke({ question, chatHistory })

  chatHistory = chatHistory.concat(msgResponse)

  return msgResponse
}

module.exports = {
  askQuestion,
  askQuestionWithSources,
  askQuestionWithHistory
}
