const { Readable } = require('stream')
const { uploadFile } = require('../storage/blob-repository')
const Joi = require('joi')
const { blobConfig } = require('../config')
const { summeriseDocument } = require('../summerisation')

module.exports = {
  method: 'POST',
  path: '/summerisation',
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
      const documentfilename = `document-${new Date().toISOString()}`

      await uploadFile(documentfilename, stream, blobConfig.documentContainer, '')
      const summary = await summeriseDocument(documentfilename)

      return h.response({ source: filename, reference: documentfilename, summary }).code(200)
    }
  }
}
