'use strict';

var express = require('express');
var controller = require('./hierarchy.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/listContext', controller.listContext);
router.get('/:id', controller.show);
router.get('/merge/:id', controller.merge);
router.get('/list/:id', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;
