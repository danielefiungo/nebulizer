const log = require('pino')();

const expressServer = require('./configs/express');

expressServer.on('error', (error) => {
  log.error('🔥 Starting express', error);
});
expressServer.on('listening', () => {
  const addr = expressServer.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  log.info(`📻 Listening on ${bind}`);
});
