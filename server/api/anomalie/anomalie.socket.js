/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Log = require('./anomalie.model');

exports.register = function(socket) {
  Log.schema.post('save', function(doc) {
    onSave(socket, doc);
  });
  Log.schema.post('remove', function(doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('anomalie:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('anomalie:remove', doc);
}
