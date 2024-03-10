const { indexBlobFromText } = require('../indexer')

module.exports = [{
  method: 'GET',
  path: '/index-documents',
  options: {
    tags: ['api'],
    handler: async (request, h) => {
      try {
        await indexBlobFromText('Standard Lines Pack-Trial-20.10.23.docx')
        return h.response({ status: 'Indexing complete' }).code(200)
      } catch (error) {
        console.error(error)
        return h.response({ error }).code(500)
      }
    }
  }
}]
