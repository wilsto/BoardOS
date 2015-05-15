'use strict';

var express = require('express');
var controller = require('./task.controller');

var router = express.Router();

router.get('/', controller.show);
router.get('/search', controller.search);
router.get('/globalChange', controller.globalChange);
router.get('/:id', controller.show);
router.post('/watch/:id/:userId', controller.watch);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;