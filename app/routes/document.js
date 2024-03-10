const { Readable } = require('stream')
const { uploadFile, listBlobs } = require('../storage/blob-repository')
const Joi = require('joi')
const { blobConfig } = require('../config')
const { indexBlobFromText } = require('../indexer')

module.exports = [{
  method: 'GET',
  path: '/document',
  options: {
    handler: async (request, h) => {
      try {
        const files = await listBlobs(blobConfig.knowledgeBaseContainer, '/')
        return h.response(files).code(200)
      } catch (error) {
        console.error(error)
        return h.response({ error }).code(500)
      }
    }
  }
},
{
  method: 'POST',
  path: '/document',
  options: {
    tags: ['api'],
    payload: {
      maxBytes: (50 * 1024 * 1024) + 250,
      multipart: true,
      timeout: false,
      output: 'stream',
      parse: true,
      allow: 'multipart/form-data'
    },
    validate: {
      payload: Joi.object({
        document: Joi.object({
          hapi: Joi.object({
            filename: Joi.string().regex(/^(.+)\.(doc|docx)$/).message('Incorrect document file type. Must be .doc or .docx.')
          }).required().unknown(true)
        }).required().unknown(true)
      }).required().unknown(true),
      failAction: (request, h, err) => {
        console.log(err)
        return h.response('failed').code(400)
      }
    },
    handler: async (request, h) => {
      const fileBuffer = request.payload.document._data
      const filename = request.payload.document.hapi.filename

      const stream = new Readable()
      stream.push(fileBuffer)
      stream.push(null)

      await uploadFile(filename, stream, blobConfig.knowledgeBaseContainer, '')
      await indexBlobFromText(filename)
      return h.response({ source: filename, reference: filename }).code(200)
    }
  }
}]
