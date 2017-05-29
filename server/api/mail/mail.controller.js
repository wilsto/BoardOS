'use strict';

var sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
var schedule = require('node-schedule');
var _ = require('lodash');
var Mail = require('./mail.model');
var getData = require('../../config/getData');
var User = require('../user/user.model');
var TaskFull = require('../taskFull/taskFull.model');

var Q = require('q');
var moment = require('moment');
var usersList = [];
var kpiList = [];
var indexalert = [];
var textUser;

var j = schedule.scheduleJob({
  dayOfWeek: [new schedule.Range(1, 5)],
  hour: 6,
  minute: 0
}, function() {
  SendMails(function() {});
});

function SendMails(callback) {
  Q()
    .then(function() {
      // Get a single user
      var deferred = Q.defer();
      User.find({
        name: 'Willy Stophe',
        active: {
          $ne: false
        }
      }, '-salt -hashedPassword', function(err, user) {
        console.log('user', user);
        usersList = user;
        deferred.resolve(usersList);
      })
      return deferred.promise;
    })
    .then(function() {
      var deferred = Q.defer();
      var startdate = moment().subtract(21, "days").toISOString();
      TaskFull.find({
        $or: [{
          'metrics.status': 'In Progress'
        }, {
          'metrics.status': 'Not Started'
        }, {
          $and: [{
            'metrics.status': 'Finished',
            'metrics.endDate': {
              $gte: startdate
            }
          }]
        }]
      }).sort({
        endDate: 'asc'
      }).lean().exec(function(err, myTasks) {
        console.log('myTasks', myTasks.length);
        deferred.resolve(myTasks);
      });
      return deferred.promise;
    })
    .then(function(myTasks) {
      var deferred = Q.defer();

      // envoi de mail à chaque acteur
      _.each(usersList, function(user, indexUser) {
        textUser = '<h3>Hello ' + user.name + '</h3> ';
        textUser += '<p>Please find below current tasks where you have interest as owner, actor or watcher</p>';
        textUser += '<hr>';
        _.each(myTasks, function(task) {
          _.each(task.actors, function(actor) {
            if (actor.toString() === user._id.toString()) {
              console.log(task.name);

              var filteredPlanTasks = _.filter([task], function(task) {
                return task.metrics[task.metrics.length - 1].status === 'Not Started';
              });
              console.log('filteredPlanTasks', filteredPlanTasks);
              var filteredInProgressTasks = _.filter([task], function(task) {
                return task.metrics[task.metrics.length - 1].status === 'In Progress';
              });
              console.log('filteredInProgressTasks', filteredInProgressTasks);
              var filteredFinishedTasks = _.filter([task], function(task) {
                var a = moment(new Date());
                var b = moment(new Date(task.metrics[task.metrics.length - 1].endDate));
                return (7 >= a.diff(b, 'days')) && (task.metrics[task.metrics.length - 1].status === 'Finished') && (task.reviewTask === undefined || task.reviewTask === false);
              });
              console.log('filteredFinishedTasks', filteredFinishedTasks);
              var filteredReviewedTasks = _.filter([task], function(task) {
                var a = moment(new Date());
                var b = moment(new Date(task.metrics[task.metrics.length - 1].endDate));
                return (7 >= a.diff(b, 'days')) && (task.metrics[task.metrics.length - 1].status === 'Finished') && (task.reviewTask === true);
              });
              console.log('filteredReviewedTasks', filteredReviewedTasks);
            }
          });
        });
        textUser += '<p>If you work on other tasks, Please create, follow and manage your task.</p>';
        textUser += '<p>Thanks</p>';
        textUser += '<p>BOSS</p>';

        var email = new sendgrid.Email({
          to: user.email,
          from: 'willy' + '@' + 'stophe' + '.' + 'fr',
          fromname: 'BOSS',
          subject: moment().format('DD MMMM YYYY'),
          text: 'BOSS Reminder',
          html: textUser,
        });
        console.log('email', email);
        email.setFilters({
          'templates': {
            'settings': {
              'enable': 1,
              'template_id': '1e8065d5-58ac-4663-bc13-5c964c39e900',
            }
          }
        });
        // sendgrid.send(email, function(err, json) {
        //   if (err) {
        //     return err;
        //   }
        //   deferred.resolve(json);
        // });
      });

    })
    .then(function(json) {
      callback(json);
    });
}

// Get list of mails
exports.index = function(req, res) {
  console.log('Send Mail Start');
  SendMails(function(json) {
    console.log('Send Mail End');
    return res.json(json);
  });
};

// Get a single mail
exports.show = function(req, res) {
  Mail.findById(req.params.id, function(err, mail) {
    if (err) {
      return handleError(res, err);
    }
    if (!mail) {
      return res.send(404);
    }
    return res.json(mail);
  });
};

// Creates a new mail in the DB.
exports.create = function(req, res) {
  Mail.create(req.body, function(err, mail) {
    if (err) {
      return handleError(res, err);
    }
    return res.json(201, mail);
  });
};

// Updates an existing mail in the DB.
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Mail.findById(req.params.id, function(err, mail) {
    if (err) {
      return handleError(res, err);
    }
    if (!mail) {
      return res.send(404);
    }
    var updated = _.merge(mail, req.body);
    updated.save(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200, mail);
    });
  });
};

// Deletes a mail from the DB.
exports.destroy = function(req, res) {
  Mail.findById(req.params.id, function(err, mail) {
    if (err) {
      return handleError(res, err);
    }
    if (!mail) {
      return res.send(404);
    }
    mail.remove(function(err) {
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
