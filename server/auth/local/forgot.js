var url = require('url');
var jwt = require('jsonwebtoken');
var config = require('../../config/environment');
var User = require('../../api/user/user.model');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_APIKEY);

/**
 * Set token cookie directly for oAuth strategies
 */
function forgotPassword(req, res) {
  var email = req.query.email;

  User.findOne({
    email: email
  }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
    if (user === null) {
      res.status(200).send('User not found. Verify your email address.');
    } else {
      var token = jwt.sign({
        email: email
      }, config.secrets.session, {
        expiresIn: '1h'
      });

      var uri = url.parse('http://' + req.headers.host + '/reset/' + token);

      const msg = {
        to: email,
        from: 'willy' + '@' + 'stophe' + '.' + 'fr',
        fromname: 'BOSS',
        subject: 'BOSS Password Reset Link',
        text: 'BOSS Password Reset Link',
        html: 'Hello ' + user.name + ', <br/><br/> You recently requested a link to reset your BOSS password. <br/>Please set a new password by following the link below: <br/><br/>' +
          '<a href="' + uri.href + '">' + uri.href + '</a>' +
          '<br><br>BOSS'
      };
      sgMail.send(msg, function(err, json) {
        if (err) {
          res.status(200).send(err);
        } else {
          res.status(200).send('You\'ve got mail. Check your inbox for a password reset link, valid 1 hour.');
        }
      });
    }
  });
}

exports.forgotPassword = forgotPassword;
