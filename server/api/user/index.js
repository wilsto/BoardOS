'use strict';

var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/roles', auth.isAuthenticated(), controller.getRoles);
router.put('/:id/role', auth.hasRole('admin'), controller.changeRole);
router.put('/desactivate/:id', auth.hasRole('admin'), controller.desactivate);
router.put('/:id/fullupdate', auth.hasRole('admin'), controller.update);
router.put('/:id/avatar', auth.isAuthenticated(), controller.update);
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', controller.create);

module.exports = router;
