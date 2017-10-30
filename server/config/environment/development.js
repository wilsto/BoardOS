'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // Server IP
  ip: 'localhost',
  // Server port
  port: 9000,
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/boardos-dev'
  },

  seedDB: false
};
