var winston = require('winston');
var logger = winston.createLogger({
  transports: [
    new(winston.transports.Console)({
      json: false,
      timestamp: false,
      colorize: true
    }),
    new winston.transports.File({
      filename: __dirname + '/debug.log',
      json: false
    })
  ],
  // exceptionHandlers: [
  //   new(winston.transports.Console)({
  //     json: true,
  //     timestamp: true,
  //     colorize: true
  //   }),
  //   new winston.transports.File({
  //     filename: __dirname + '/exceptions.log',
  //     json: false
  //   })
  // ],
  exitOnError: false
});
module.exports = logger;
