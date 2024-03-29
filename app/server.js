require('./insights').setup()
const Hapi = require('@hapi/hapi')

const server = Hapi.server({
  port: process.env.PORT
})

const routes = [].concat(
  require('./routes/conversation'),
  require('./routes/summarisation'),
  require('./routes/document'),
  require('./routes/index-document'),
  require('./routes/healthy'),
  require('./routes/healthz')
)

server.route(routes)

module.exports = server
