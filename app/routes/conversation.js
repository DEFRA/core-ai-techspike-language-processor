const { askQuestionWithSources, askQuestion } = require('../conversation')

module.exports = [{
  method: 'GET',
  path: '/conversation',
  options: {
    tags: ['api'],
    handler: async (request, h) => {
      const question = request.query.question
      const results = await askQuestion(question)
      return h.response(results).code(200)
    }
  }
},
{
  method: 'GET',
  path: '/conversation-with-source',
  options: {
    tags: ['api'],
    handler: async (request, h) => {
      const question = request.query.question
      const results = await askQuestionWithSources(question)
      return h.response(results).code(200)
    }
  }
}]
