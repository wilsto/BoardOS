'use strict';

var express = require('express');
var controller = require('./dashboardComplete.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/execute', controller.execute);
router.get('/showTasks/:id', controller.showTasks);
router.get('/:id', controller.show);
router.get('/executeId/:dashboardId', controller.executeId);
router.post('/', controller.create);
router.post('/subscribe/:id', controller.subscribe);
router.post('/unsubscribe/:id', controller.unsubscribe);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;
