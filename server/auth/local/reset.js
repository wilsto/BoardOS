
var url = require('url');
var jwt = require('jsonwebtoken');
var postmark = require('postmark')
var clientMail = new postmark.Client('308974d8-3847-4675-8666-9dd2feadcfc4');
var config = require('../../config/environment');
var User = require('../../api/user/user.model');

function resetPassword(req, res) {
        var token = req.query.token;
        var password = req.query.password;
        var confirm = req.query.confirm;

		var decoded = jwt.verify(token, config.secrets.session);
		var email = decoded.email;
		var iatdate = decoded.iat;
		var expdate = decoded.exp;
		var now = Date.now()/1000;
		var valid = now-expdate < 0;

        if (password !== confirm) {
        	res.end('Your passwords do not match');
        } else {
        	// update db here
        	User.findOne({
            	email: email
		    }, '-salt -hashedPassword', function(err, user) { // don't ever give out the password or salt
	            if (user === null) {
	                res.send(200, 'User not found. Please retry or contact admin.');
	            } else {
					user.password = password;
			        user.save(function(err) {
		                clientMail.send({
		                    'From': 'willy' + '@' + 'stophe' + '.' + 'fr',
		                    'To': email,
		                    'Subject': 'BOSS Changed Password Confirmation',
		                    'HtmlBody': 'Hello ' + user.name + ', <br/><br/> The password for your BOSS account was recently changed.<br/><br/> If you made this change, then we\'re all set!<br/><br/> If not, please contact me at admin.boardos@free.fr '+
		                        '<br><br>BOSS'
		                }, function (err, to) {
		                    if (err) {
		                        res.send(200, err);
		                    } else {
		                        res.send(200, 'Your password has been updated, please login.');
		                    }
		                });
			        });
	        	}
		    });
        }
}

exports.resetPassword = resetPassword;

