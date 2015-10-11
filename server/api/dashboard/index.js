'use strict';

var express = require('express');
var controller = require('./dashboard.controller');

var router = express.Router();

router.get('/', controller.show);
router.get('/quick/:id', controller.quick);
router.get('/list', controller.list);
router.get('/:id', controller.show);
router.get('/user/:userId', controller.show);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;