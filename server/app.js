/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

//var newrelic = require('newrelic');
var logger = require('./config/logger');


var express = require('express');
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var config = require('./config/environment');

// Setup server
var app = express();
var server = require('http').createServer(app);
var socketio = require('socket.io')(server, {
  serveClient: (config.env === 'production') ? false : true,
  path: '/socket.io-client'
});
require('./config/socketio')(socketio);
require('./config/express')(app);
require('./routes')(app);

mongoose.connection.once('open', function() {
  logger.info('MongoDB event open');
  logger.debug('MongoDB connected [%s]', config.mongo.uri);

  mongoose.connection.on('connected', function() {
    logger.info('MongoDB event connected');
  });

  mongoose.connection.on('disconnected', function() {
    logger.warn('MongoDB event disconnected');
  });

  mongoose.connection.on('reconnected', function() {
    logger.info('MongoDB event reconnected');
  });

  mongoose.connection.on('error', function(err) {
    logger.error('MongoDB event error: ' + err);
  });

  // Start server
  server.listen(config.port, config.ip, function() {
    logger.info('Server started on ' + config.ip + ':' + config.port);
  });
});

mongoose.connect(config.mongo.uri, config.mongo.options, function(err) {
  if (err) {
    logger.error('MongoDB connection error: ' + err);
    // return reject(err);
    process.exit(1);
  }
});

//Mongoose: default lean to true (always on)
// var __setOptions = mongoose.Query.prototype.setOptions;
// mongoose.Query.prototype.setOptions = function(options, overwrite) {
//   __setOptions.apply(this, arguments);
//   if (this.options.lean === null) this.options.lean = true;
//   return this;
// };

// Expose app
exports = module.exports = app;
