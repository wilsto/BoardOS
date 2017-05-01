'use strict';

var express = require('express');
var controller = require('./taskFull.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/list/hierarchies', controller.listHierarchies);
router.get('/execute', controller.execute);
router.get('/search', controller.search);
router.get('/standardPERT', controller.standardPERT);
router.get('/executeId/:taskId', controller.executeId);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;
