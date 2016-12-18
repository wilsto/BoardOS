'use strict';

var sendgrid = require('sendgrid')(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
var schedule = require('node-schedule');
var _ = require('lodash');
var Mail = require('./mail.model');
var getData = require('../../config/getData');
var User = require('../user/user.model');
var TaskComplete = require('../taskComplete/taskComplete.model');

var Q = require('q');
var moment = require('moment');
var usersList = [];
var kpiList = [];
var indexalert = [];
var textUser;

var j = schedule.scheduleJob({
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
        active: {
          $ne: false
        }
      }, '-salt -hashedPassword', function(err, user) {
        usersList = user;
        deferred.resolve(usersList);
      })
      return deferred.promise;
    })
    .then(function() {
      var deferred = Q.defer();
      TaskComplete.find({
        $or: [{
          'lastmetric.status': 'In Progress'
        }, {
          'lastmetric.status': 'Not Started'
        }]
      }).sort({
        endDate: 'asc'
      }).lean().exec(function(err, myTasks) {
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
          if (_.contains(_.pluck(task.actors, '_id'), user._id.toString())) {

            var sumAlert = 0;
            _.each(task.alerts, function(kpisAlert) {
              if (kpisAlert.calcul.task !== null && !isNaN(kpisAlert.calcul.task)) {
                sumAlert += kpisAlert.calcul.task;
              }
            });

            var meanGoal = null;
            var nbGoal = 0;
            _.each(task.kpis, function(kpisGoal) {
              if (kpisGoal.calcul.task !== null && !isNaN(kpisGoal.calcul.task)) {
                meanGoal = (meanGoal === null) ? kpisGoal.calcul.task : meanGoal + kpisGoal.calcul.task;
                nbGoal += 1;
              }
            });
            meanGoal = parseInt(meanGoal / nbGoal);

            // text
            textUser += '<h4 style=\'margin-bottom:-10px;\'><a href=\'http://boardos.herokuapp.com/task/' + task._id + '\'>' + task.name + '</a></h4>';
            textUser += '<div style=\'float:right;text-align:right\'>';
            if (task.lastmetric.status === 'In Progress') {
              textUser += '<span style=\'background:#89c4f4;padding:5px;color:black\'>' + task.lastmetric.status + '</span>'
            }
            if (task.lastmetric.status === 'Not Started') {
              textUser += '<span style=\'background:grey;padding:5px;color:white\'>' + task.lastmetric.status + '</span>'
            }
            textUser += (task.needToFeed) ? '<br><br><span style=\';color:red;\'> New metric needed</span>' : '';
            if (meanGoal > 66 && meanGoal < 133) {
              textUser += '<br><br><span style=\'margin-right:5px;background:green;padding:5px;color:white\'> Goals : ' + meanGoal + '%</span>';
            } else {
              textUser += '<br><br><span style=\'margin-right:5px;background:#FFA500;padding:5px;color:black\'> Goals : ' + meanGoal + '%</span>';
            }
            if (sumAlert === 0) {
              textUser += '<span style=\'background:grey;padding:5px;color:white\'> Alerts : ' + sumAlert + '</span>';
            } else {
              textUser += '<span style=\'background:red;padding:5px;color:white\'> Alerts : ' + sumAlert + '</span>';

            }

            textUser += '</div>';

            textUser += '<p style=\'font-size:13px;padding-top:-10px\'> <span style=\'color:grey;\'>Context : </span>' + task.context + '<br/>'
            textUser += '<span style=\'color:grey;\'>Activity : </span>' + task.activity + '</p>';
            textUser += '<p style=\'margin-bottom:-15px\'>TARGET INFOS : <span style=\'color:grey;\'>from </span>' + moment(new Date(task.startDate)).format('DD MMMM YYYY') + ' <span style=\'color:grey;\'> to </span>' + moment(new Date(task.endDate)).format('DD MMMM YYYY') + ' <span style=\'color:grey;\'> with </span>' + task.load + '<span style=\'color:grey;\'> working days </span></p>';
            textUser += '<p>LAST BEST INFOS: <span style=\'color:grey;\'>from </span>' + moment(new Date(task.lastmetric.startDate)).format('DD MMMM YYYY') + ' <span style=\'color:grey;\'> to </span>' + moment(new Date(task.lastmetric.endDate)).format('DD MMMM YYYY') + ' <span style=\'color:grey;\'> with </span>' + task.lastmetric.projectedWorkload + '<span style=\'color:grey;\'> working days </span></p>';

            textUser += '<hr>';
          }
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
        email.setFilters({
          'templates': {
            'settings': {
              'enable': 1,
              'template_id': '1e8065d5-58ac-4663-bc13-5c964c39e900',
            }
          }
        });
        sendgrid.send(email, function(err, json) {
          if (err) {
            return err;
          }
          deferred.resolve(json);
        });
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
