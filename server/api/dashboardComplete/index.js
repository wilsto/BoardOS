'use strict';

var express = require('express');
var controller = require('./dashboardComplete.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/execute', controller.execute);
router.get('/:id', controller.show);
router.get('/execute/:dashboardId', controller.executeId);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;
