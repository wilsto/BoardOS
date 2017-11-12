/*jshint sub:true*/
/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /hierarchies              ->  index
 * POST    /hierarchies              ->  create
 * GET     /hierarchies/:id          ->  show
 * PUT     /hierarchies/:id          ->  update
 * DELETE  /hierarchies/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Q = require('q');

var Hierarchy = require('./hierarchy.model');
var TaskFull = require('../taskFull/taskFull.model');
var DashboardComplete = require('../dashboardComplete/dashboardComplete.model');

var tools = require('../../config/tools');

// Get list of hierarchies
exports.index = function(req, res) {
  Hierarchy.find(function(err, hierarchies) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(hierarchies);
  });
};

// Get a single hierarchy
exports.show = function(req, res) {
  Hierarchy.findById(req.params.id, function(err, hierarchy) {
    if (err) {
      return handleError(res, err);
    }
    if (!hierarchy) {
      return res.send(404);
    }
    return res.status(200).json(hierarchy);
  });
};

// Get a single hierarchy
exports.list = function(req, res) {
  Hierarchy.find({
    name: req.params.id
  }, function(err, hierarchy) {
    if (err) {
      return handleError(res, err);
    }
    if (!hierarchy) {
      return res.send(404)
    }
    //if(hierarchy[0]) {tools.buildHierarchy(hierarchy[0].list,'list')}
    return res.status(200).json(hierarchy[0]);
  });
};

// ***********************
// Get a single hierarchy
// ***********************
exports.sublist = function(req, res) {

  function getPosition(string, subString, index) {
    return string.split(subString, index).join(subString).length;
  }

  function findWithAttr(array, attr, value, attr2, value2) {
    for (var i = 0; i < array.length; i += 1) {
      if (array[i][attr2] === value2 && array[i][attr] === value) {
        return i;
      }
    }
    return -1;
  }

  var filterPerimeter = [];
  var sublist = []
  var filterTaskPerimeter = {
    $or: [],
    metrics: {
      $elemMatch: {
        status: 'Finished'
      }
    }
  };

  Q()
    // Get dashboards
    .then(function() {
      var deferred = Q.defer();

      DashboardComplete.findById(req.params.dashboardId, {
        __v: false
      }).lean().exec(function(err, dashboard) {
        if (dashboard.perimeter.length > 0) {

          filterPerimeter = dashboard.perimeter;

          _.each(filterPerimeter, function(perimeter) {
            if (perimeter.activity === null || perimeter.activity === undefined) {
              perimeter.activity = '';
            }
            if (perimeter.context === null || perimeter.context === undefined) {
              perimeter.context = '';
            }
            filterTaskPerimeter['$or'].push({
              activity: {
                '$regex': perimeter.activity || '',
                $options: '-im'
              },
              context: {
                '$regex': perimeter.context || '',
                $options: '-im'
              }
            });
          });

          deferred.resolve(filterTaskPerimeter);
        }
      });

      return deferred.promise;

    })
    // Get hierarchy
    .then(function() {
      var deferred = Q.defer();

      Hierarchy.find({
          name: req.params.id
        },
        function(err, hierarchy) {
          if (err) {
            return handleError(res, err);
          }
          if (!hierarchy) {
            return res.send(404)
          }

          _.each(filterPerimeter, function(perimeter, index) {
            var filter, filterlength;
            if (req.params.id === 'Activity') {

              filter = perimeter.activity.replace('^', '');
              if (filter.charAt(filter.length - 1) === '.') {
                filter = filter.substring(0, filter.length - 1);
              }

              _.each(hierarchy[0].list, function(activity) {
                var posFilter = activity.longname.indexOf(filter);
                filterlength = (filter.length === 0) ? -1 : filter.length;


                if (posFilter > -1) {
                  // position du prochain point post root
                  var position = getPosition(activity.longname.substring(posFilter + filterlength + 1), '.', 1);
                  var subactivity = activity.longname.substring(posFilter + filterlength + 1, posFilter + filterlength + position + 1);
                  if (findWithAttr(sublist, 'root', activity.longname.substring(0, posFilter + filterlength + 1), 'name', subactivity) === -1) {
                    sublist.push({
                      name: subactivity,
                      root: activity.longname.substring(0, posFilter + filterlength + 1),
                      code: activity.description,
                      value: activity.value,
                      abs: true
                    });
                  }
                }
              });
            }

            if (req.params.id === 'Context') {

              filter = perimeter.context.replace('^', '');
              if (filter.charAt(filter.length - 1) === '.') {
                filter = filter.substring(0, filter.length - 1);
              }

              _.each(hierarchy[0].list, function(context) {
                var posFilter = context.longname.indexOf(filter);
                filterlength = (filter.length === 0) ? -1 : filter.length;
                if (posFilter > -1) {
                  // position du prochain point post root
                  var position = getPosition(context.longname.substring(posFilter + filterlength + 1), '.', 1);
                  var subcontext = context.longname.substring(posFilter + filterlength + 1, posFilter + filterlength + position + 1);
                  if (findWithAttr(sublist, 'root', context.longname.substring(0, posFilter + filterlength + 1), 'name', subcontext) === -1) {
                    sublist.push({
                      name: subcontext,
                      root: context.longname.substring(0, posFilter + filterlength + 1),
                      abs: true
                    });
                  }
                }
              });
            }

            if (index === filterPerimeter.length - 1) {
              deferred.resolve(sublist);
            }
          });
          return deferred.promise;

        });
    })
    // Get Tasks
    .then(function() {
      var deferred = Q.defer();

      TaskFull.find(filterTaskPerimeter, 'activity context metrics needToFeed kpis alerts').sort({
        date: 'asc'
      }).lean().exec(function(err, findtasks) {

        _.each(filterPerimeter, function(perimeter, index2) {

          if (req.params.id === 'Activity') {
            perimeter.activity = perimeter.activity.replace('^', '');
            if (perimeter.activity.charAt(perimeter.activity.length - 1) === '.') {
              perimeter.activity = perimeter.activity.substring(0, perimeter.activity.length - 1);
            }
          } else {
            perimeter.context = perimeter.context.replace('^', '');
            if (perimeter.context.charAt(perimeter.context.length - 1) === '.') {
              perimeter.context = perimeter.context.substring(0, perimeter.context.length - 1);
            }
          }

          _.each(findtasks, function(task, index) {
            var posFilter, position, subactivity, subcontext, filterlength;

            if (req.params.id === 'Activity') {

              // si l'activité est dans la liste
              posFilter = task.activity.indexOf(perimeter.activity);
              filterlength = (perimeter.activity.length === 0) ? -1 : perimeter.activity.length;

              if (posFilter > -1) {
                // position du prochain point post root
                position = getPosition(task.activity.substring(posFilter + filterlength + 1), '.', 1);
                subactivity = task.activity.substring(posFilter + filterlength + 1, posFilter + filterlength + position + 1);
                if (subactivity === '') {
                  subactivity = '$';
                }
                if (findWithAttr(sublist, 'root', task.activity.substring(0, posFilter + filterlength + 1), 'name', subactivity) === -1) {
                  sublist.push({
                    name: subactivity,
                    root: task.activity.substring(0, posFilter + filterlength + 1),
                    abs: false
                  });
                }
              }

            }

            if (req.params.id === 'Context') {

              // si l'activité est dans la liste
              posFilter = task.context.indexOf(perimeter.context);
              filterlength = (perimeter.context.length === 0) ? -1 : perimeter.context.length;

              if (posFilter > -1) {
                // position du prochain point post root
                position = getPosition(task.context.substring(posFilter + filterlength + 1), '.', 1);
                subcontext = task.context.substring(posFilter + filterlength + 1, posFilter + filterlength + position + 1);
                if (subcontext === '') {
                  subcontext = '$';
                }
                if (findWithAttr(sublist, 'root', task.context.substring(0, posFilter + filterlength + 1), 'name', subcontext) === -1) {
                  sublist.push({
                    name: subcontext,
                    root: task.context.substring(0, posFilter + filterlength + 1),
                    abs: false
                  });
                }
              }

            }

            if (index === findtasks.length - 1 && index2 === filterPerimeter.length - 1) {
              deferred.resolve(sublist);
              return res.status(200).json(sublist);

            }
          });
          ///

        });
      });
      return deferred.promise;

    });
};


// Get a single hierarchy
exports.listContext = function(req, res) {
  TaskFull.distinct('context', function(err, hierarchy) {
    if (err) {
      return handleError(res, err);
    }
    if (!hierarchy) {
      return res.send(404)
    }
    return res.status(200).json(_.sortBy(hierarchy));
  });
};


// Creates a new hierarchy in the DB.
exports.create = function(req, res) {
  var newHierarchy = new Hierarchy(req.body, false);
  newHierarchy.save(function(err, doc) {
    res.send(200, doc);
  });
};

// Updates an existing hierarchy in the DB.
exports.update = function(req, res) {
  var upsertData = {
    name: req.params.id,
    list: req.body
  };
  Hierarchy.update({
    name: req.params.id
  }, upsertData, {
    upsert: true
  }, function(err, hierarchy) {
    return res.status(200).json(hierarchy);
  });
};

exports.merge = function(req, res) {

}

// Deletes a hierarchy from the DB.
exports.destroy = function(req, res) {
  Hierarchy.findById(req.params.id, function(err, hierarchy) {
    if (err) {
      return handleError(res, err);
    }
    if (!hierarchy) {
      return res.send(404);
    }
    hierarchy.remove(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
