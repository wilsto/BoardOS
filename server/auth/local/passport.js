var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

exports.setup = function(User, config) {
  passport.use(new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password' // this is the virtual field on the model
    },
    function(email, password, done) {
      console.log('email', email);
      console.log('password', password);
      User.findOne({
          $or: [{
            "visa": email.toUpperCase()
          }, {
            "email": email.toLowerCase()
          }]
        },
        function(err, user) {
          if (err) return done(err);

          if (!user) {
            return done(null, false, {
              message: 'This email is not registered.'
            });
          }
          if (!user.authenticate(password)) {
            return done(null, false, {
              message: 'This password is not correct.'
            });
          }
          if (!user.active) {
            return done(null, false, {
              message: 'This user is no longer active.'
            });
          }
          user.last_connection_date = Date.now();
          user.save(function(err) {});
          return done(null, user);
        });
    }
  ));
};