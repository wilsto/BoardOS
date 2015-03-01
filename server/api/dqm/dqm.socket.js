/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Dqm = require('./dqm.model');

exports.register = function(socket) {
  Dqm.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Dqm.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('dqm:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('dqm:remove', doc);
}