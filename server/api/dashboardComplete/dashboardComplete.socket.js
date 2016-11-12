/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var DashboardComplete = require('./dashboardComplete.model');

exports.register = function(socket) {
  DashboardComplete.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  DashboardComplete.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('dashboardComplete:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('dashboardComplete:remove', doc);
}