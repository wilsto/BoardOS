/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var TaskComplete = require('./taskComplete.model');

exports.register = function(socket) {
  TaskComplete.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  TaskComplete.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('taskComplete:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('taskComplete:remove', doc);
}