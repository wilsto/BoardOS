/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Whatsnew = require('./whatsnew.model');

exports.register = function(socket) {
  Whatsnew.schema.post('save', function(doc) {
    onSave(socket, doc);
  });
  Whatsnew.schema.post('remove', function(doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('whatsnew:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('whatsnew:remove', doc);
}
