'use strict';

var User = require('./user.model');
var DashboardComplete = require('../dashboardComplete/dashboardComplete.model');


var passport = require('passport');
var config = require('../../config/environment');
var jwt = require('jsonwebtoken');
var _ = require('lodash');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_APIKEY);

var validationError = function(res, err) {
  return res.status(422).json(err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function(req, res) {
  User.find({}, '-salt -hashedPassword').sort({
    name: 1
  }).exec().then(function(users) {

    _.each(users, function(user) {
      user.avatar = (user.avatar) ? user.avatar : 'assets/images/avatars/' + user._id + '.png';
    });

    res.status(200).json(users);
  });
};

/**
 * Get list of members
 * restriction: 'none'
 */
exports.members = function(req, res) {
  User.find({
    active: {
      $ne: false
    }
  }, '_id name avatar').sort({
    name: 1
  }).exec().then(function(users) {

    _.each(users, function(user) {
      user.avatar = (user.avatar) ? user.avatar : 'assets/images/avatars/' + user._id + '.png';
    });

    res.status(200).json(users);
  });
};

/**
 * Creates a new user
 */
exports.create = function(req, res, next) {
  var newUser = new User(req.body);
  newUser.provider = 'local';
  newUser.role = 'user';
  newUser.save(function(err, user) {
    if (err) return validationError(res, err);
    var token = jwt.sign({
      _id: user._id
    }, config.secrets.session, {
      expiresIn: '24h'
    });

    var email = {
      to: user.email,
      from: 'willy' + '@' + 'stophe' + '.' + 'fr',
      fromname: 'BOSS',
      subject: 'Registration to BOSS',
      text: 'Registration to BOSS',
      html: 'Hello ' + user.name + ', <br/> Thanks to your registration to BOSS.',
    };
    sgMail.send(email);

    var emailAdmin = {
      to: 'willy' + '.' + 'stophe' + '@' + 'fr' + '.' + 'netgrs' + '.' + 'com',
      from: 'willy' + '@' + 'stophe' + '.' + 'fr',
      fromname: 'BOSS',
      subject: 'New Registration to BOSS',
      text: 'New Registration to BOSS',
      html: 'A new user [' + user.name + '] (' + user.email + ') has registered to BOSS'
    };
    sgMail.send(emailAdmin);

    res.status(200).json({
      token: token
    });
  });
};

/**
 * Get a single user
 */
exports.show = function(req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function(err, user) {
    if (err) return next(err);
    if (!user) return res.send(401);
    res.status(200).json(user.profile);
  });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function(req, res) {
  User.findByIdAndRemove(req.params.id, function(err, user) {
    if (err) return res.send(500, err);
    return res.send(204);
  });
};

/**
 * Change a users password
 */
exports.changePassword = function(req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function(err, user) {
    if (user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function(err) {
        if (err) return validationError(res, err);
        res.status(200).send('User Change password');
      });
    } else {
      res.send(403);
    }
  });
};

/**
 * Change a users role
 */
exports.changeRole = function(req, res, next) {
  var userId = String(req.body.userId);
  var newRole = String(req.body.newRole);
  User.findById(userId, function(err, user) {
    user.role = newRole;
    user.save(function(err) {
      if (err) return validationError(res, err);
      res.status(200).send('User Change role');
    });
  });
};

/**
 * Change a users role
 */
exports.changeGroups = function(req, res, next) {
  var userId = String(req.body.userId);
  var newGroups = req.body.newGroups;
  User.findById(userId, function(err, user) {
    user.groups = newGroups;
    user.save(function(err) {
      if (err) return validationError(res, err);
      res.status(200).send('User Change group');
    });
  });
};


/**
 * Desactivate a user
 */
exports.desactivate = function(req, res, next) {
  var userId = String(req.body.userId);
  User.findById(userId, function(err, user) {
    user.active = false;

    user.save(function(err) {
      if (err) return validationError(res, err);

      DashboardComplete.find({
        'owner._id': userId
      }, function(err, dashboards) {
        if (err) {
          return handleError(res, err);
        }
        _.each(dashboards, function(dashboard) {
          dashboard.remove(function(err) {
            if (err) {
              return handleError(res, err);
            }
            process.emit('dashboardRemoved', dashboard);
          });
        });
      });
      res.status(200).send('User desactivate');
    });
  });
};

/**
 * Change a users update
 */

// Updates an existing user in the DB.
exports.update = function(req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  User.findById(req.params.id, function(err, user) {
    if (err) {
      return handleError(res, err);
    }
    if (!user) {
      return res.send(404);
    }
    var updated = _.merge(user, req.body);
    updated.save(function(err) {
      if (err) {
        return handleError(res, err);
      }
      return res.status(200).json(user);
    });
  });
};


/**
 * Get my info
 */
exports.me = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.status(401).json({
      err: 'No User'
    });
    user.avatar = (user.avatar) ? user.avatar : 'assets/images/avatars/' + user._id + '.png';
    res.status(200).json(user);
  });
};

/**
 * Get roles
 */
exports.getRoles = function(req, res, next) {
  res.status(200).json(config.userRoles);
};

/**
 * Authentication callback
 */
exports.authCallback = function(req, res, next) {
  res.redirect('/');
};

function handleError(res, err) {
  return res.send(500, err);
}
