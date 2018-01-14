'use strict';

var express = require('express');
var controller = require('./recurrentTask.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/search', controller.search);
router.get('/list/:userId', controller.list);
router.get('/toggleOne/:type/:rtaskId', controller.toggleOne);
router.get('/toggleAll/:type/:userId', controller.toggleAll);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;