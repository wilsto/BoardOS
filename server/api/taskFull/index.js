'use strict';

var express = require('express');
var controller = require('./taskFull.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/list/hierarchies', controller.listHierarchies);
router.get('/execute', controller.updateAllTask);
router.get('/search', controller.search);
router.get('/standardPERT', controller.standardPERT);
router.get('/exportXLS', controller.exportXLS);
router.get('/countByMonth', controller.countByMonth);
router.get('/countByActivity', controller.countByActivity);
router.get('/:id', controller.show);
router.post('/', controller.create);
router.put('/:id/:blnexecuteDashboard', controller.update);
router.patch('/:id', controller.update);
router.delete('/noRegen/:id', controller.destroyNoRegen);
router.delete('/:id', controller.destroy);

module.exports = router;