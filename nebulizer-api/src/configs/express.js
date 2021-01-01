const express = require('express');
const pino = require('express-pino-logger')();
const debug = require('debug')('nebulizer:api');
const helmet = require('helmet');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createTerminus } = require('@godaddy/terminus');
const baseRouter = require('../routes');

// const { injectPassport } = require('./passport');

const app = express();

app.use(helmet());
// check docs https://github.com/expressjs/cors#configuration-options
app.use(cors());
// app.use(cookieSession({ secret: process.env.COOKIE_SECRET }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// app.use(cookieParser());
app.options('*', cors());
app.use(pino);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = parseInt(val, 10);

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

const port = normalizePort(process.env.PORT || '3000');

/**
 * Get port from environment and store in Express.
 */

app.set('port', port);

app.use(baseRouter);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      debug(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      debug(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onSignal() {
  debug('server is starting cleanup');
  return Promise.all([
    // your clean logic, like closing database connections
  ]);
}

function onShutdown() {
  debug('cleanup finished, server is shutting down');
}

function healthCheck() {
  return Promise
    .resolve
    // optionally include a resolve value to be included as
    // info in the health check response
    ();
}

const options = {
  // health check options
  healthChecks: {
    '/healthcheck': healthCheck, // a function returning a promise indicating service health,
    verbatim: true, // [optional = false] use object returned from /healthcheck verbatim in response
  },

  // cleanup options
  timeout: 1000, // [optional = 1000] number of milliseconds before forceful exiting
  // signal, // [optional = 'SIGTERM'] what signal to listen for relative to shutdown
  // signals, // [optional = []] array of signals to listen for relative to shutdown
  // beforeShutdown, // [optional] called before the HTTP server starts its shutdown
  onSignal, // [optional] cleanup function, returning a promise (used to be onSigterm)
  onShutdown, // [optional] called right before exiting
  // onSendFailureDuringShutdown, // [optional] called before sending each 503 during shutdowns

  // both
  logger: debug, // [optional] logger function to be called with errors
};

createTerminus(server, options);
/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
module.exports = server;
