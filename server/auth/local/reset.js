var url = require('url');
var jwt = require('jsonwebtoken');
var config = require('../../config/environment');
var User = require('../../api/user/user.model');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_APIKEY);

function resetPassword(req, res) {
  var token = req.query.token;
  var password = req.query.password;
  var confirm = req.query.confirm;

  var decoded = jwt.verify(token, config.secrets.session);
  var email = decoded.email;
  var iatdate = decoded.iat;
  var expdate = decoded.exp;
  var now = Date.now() / 1000;
  var valid = now - expdate < 0;

  if (password !== confirm) {
    res.end('Your passwords do not match');
  } else {
    // update db here
    User.findOne({
      email: email
    }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
      if (user === null) {
        res.status(200).send('User not found. Please retry or contact admin.');
      } else {
        user.password = password;
        user.save(function(err) {

          const msg = {
            to: email,
            from: 'willy' + '@' + 'stophe' + '.' + 'fr',
            fromname: 'BOSS',
            subject: 'BOSS Changed Password Confirmation',
            text: 'BOSS Changed Password Confirmation',
            html: 'Hello ' + user.name + ', <br/><br/> The password for your BOSS account was recently changed.<br/><br/> If you made this change, then we\'re all set!<br/><br/> If not, please contact me at admin.boardos@free.fr ' +
              '<br><br>BOSS'
          };
          sgMail.send(msg, function(err, json) {
            if (err) {
              res.status(200).send(err);
            } else {
              res.status(200).send('Your password has been updated, please login.');
            }
          });
        });
      }
    });
  }
}

exports.resetPassword = resetPassword;
