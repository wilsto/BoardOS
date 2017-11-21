/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Obeya = require('./obeya.model');

exports.register = function(socket) {
  Obeya.schema.post('save', function(doc) {
    onSave(socket, doc);
  });
  Obeya.schema.post('remove', function(doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('obeya:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('obeya:remove', doc);
}
