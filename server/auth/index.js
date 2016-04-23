'use strict';

var express = require('express');
var passport = require('passport');
var forgot = require('./local/forgot');
var reset = require('./local/reset');
var config = require('../config/environment');
var User = require('../api/user/user.model');

// Passport Configuration
require('./local/passport').setup(User, config);
require('./google/passport').setup(User, config);

var router = express.Router();

router.use('/local', require('./local'));
router.use('/google', require('./google'));

router.get('/forgot', forgot.forgotPassword);
router.get('/reset', reset.resetPassword);

module.exports = router;