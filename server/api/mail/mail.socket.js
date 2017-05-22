/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Mail = require('./mail.model');

exports.register = function(socket) {
  Mail.schema.post('save', function(doc) {
    onSave(socket, doc);
  });
  Mail.schema.post('remove', function(doc) {
    onRemove(socket, doc);
  });

  process.on('taskFullstart', function(data) {
    socket.emit('taskFull:start', data);
  });

  process.on('taskFullrun', function(data) {
    socket.emit('taskFull:run', data);
  });

}

function onSave(socket, doc, cb) {
  socket.emit('mail:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('mail:remove', doc);
}
