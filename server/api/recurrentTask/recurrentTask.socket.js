/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var RecurrentTask = require('./recurrentTask.model');

exports.register = function(socket) {
  RecurrentTask.schema.post('save', function(doc) {
    onSave(socket, doc);
  });
  RecurrentTask.schema.post('remove', function(doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {

  socket.emit('recurrentTask:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('recurrentTask:save', doc);
}
