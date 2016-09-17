var express = require('express');
var path = require('path');
var cors = require('cors');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// initialize env vars
require('dotenv').config();

var app = express();
app.use(cors());
var debug = require('debug')('censusd3:server');
var http = require('http');
var port = normalizePort(process.env.PORT || '8000');
app.set('port', port);

// __dirname will use the current path from where you run this file 
//app.use(express.static(__dirname));
//app.use(express.static(path.join(__dirname, 'prototype/src')));
//app.listen(process.env.PORT || 8000);
//console.log('Listening on port:' + process.env.PORT || 8000);

var server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'prototype/src')));
app.use('/', require('./routes/index'));

// catch 404 and forward to error handler
app.use( function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// wire global app error handlers

// wire http 500 internal server error handler for dev env.
if ( app.get('env') === 'development' ) {
  app.use( function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// wire prod. http 500 internal server error handler 
app.use( function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


/**
 * Normalizes a port into a number, string, or false.
 */
function normalizePort(val) {
  var port = parseInt(val, 10);

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


/*----------------- Global express.js Event Handlers -----------------------*/

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}
