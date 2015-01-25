/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Help = require('./help.model');

exports.register = function(socket) {
  Help.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Help.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('help:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('help:remove', doc);
}