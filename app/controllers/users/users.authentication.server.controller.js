'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	errorHandler = require('../errors'),
	mongoose = require('mongoose'),
	passport = require('passport'),
	User = mongoose.model('User'),
    nodemailer = require('nodemailer'),
    Q = require('q'),
    crypto = require('crypto'),
    config = require('../../../config/config');

/**
 * Signup
 */
exports.signup = function(req, res) {
	// For security measurement we remove the roles from the req.body object
	delete req.body.roles;

	// Init Variables
	var user = new User(req.body);
	var message = null;

	// Add missing user fields
	user.provider = 'local';
	user.displayName = user.firstName + ' ' + user.lastName;

	// Then save the user 
	user.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			// Remove sensitive data before login
			user.password = undefined;
			user.salt = undefined;

			req.login(user, function(err) {
				if (err) {
					res.status(400).send(err);
				} else {
					res.jsonp(user);
				}
			});
		}
	});
};

/**
 * Send signup email
 */

exports.sendSignupEmail = function(req,res) {
    debugger;
    checkDuplicateEmail(req).then(function(req){ return generateActivateEmailToken(req)})
                            .then(function(data){ return saveSignUpUser(data)})
                            .then(function(user){return sendAccountActiviateEmail(user)})
                            .then(function(data){
                                    res.jsonp(data);
                                        }).fail(function(err){
                                            res.status(400).send(err);
                             });
//    smtpTransport.sendMail(mailOptions, function(err) {
//        if (!err) {
//            res.redirect('/');
//        }else{
//            console.log(err);
//        }
//    });
};

function checkDuplicateEmail(req) {
    var defer = Q.defer();
    var user = new User(req.body);
    User.findOne({'email':user.email},function(err,user){
        //Email not used
        if(err || !user){
            console.log('email not exised');
            defer.resolve(req);
        }//Email already used
        else {
            defer.reject({'message':'Email address is already taken'});
        }
    });
    return defer.promise;
}

function generateActivateEmailToken(req) {
    var defer = Q.defer();
    crypto.randomBytes(20, function(err, buffer){
        if(err)
        {
            defer.reject({'message' : err});
        }
        else{
            var token = buffer.toString('hex');
            var obj = {'request':req,token:token};
            console.log('generate token');
            defer.resolve(obj);
        }
    });
    return defer.promise;
}

function saveSignUpUser(obj){
    var defer = Q.defer();
    // For security measurement we remove the roles from the req.body object
    var req = obj.request;
    var token = obj.token;
    delete req.body.roles;

    // Init Variables
    var user = new User(req.body);
    user.activateAccountToken = token;
    var message = null;

    // Add missing user fields
    user.provider = 'local';
    user.displayName = user.lastName + ' ' + user.firstName;

    // Then save the user
    user.save(function(err) {
        if (err) {
            console.log(err);
           defer.reject(err);
        } else {
            console.log('save user');
            defer.resolve(user);
        }
    });
    return defer.promise;
}

function sendAccountActiviateEmail(user) {
    var defer = Q.defer();
    var smtpTransport = nodemailer.createTransport(config.mailer.options);
    var activationUrl = 'http://172.26.142.234:3000/auth/activation/' + user.activateAccountToken;
    console.log(activationUrl)
    var mailOptions = {
        to: user.email,
        from: config.mailer.from,
        subject: 'Please Activate Your Account',
        html: '<h3>Click the following link to activate your account</h3><br/><a' + ' href=' + activationUrl + ' target="blank"> Click Here' + '<a/>'
    };
    smtpTransport.sendMail(mailOptions, function(err) {
        if (!err) {
            console.log('send mail');
            defer.resolve(user);
        }else{
            defer.reject({'message' : err});
        }
    });
    return defer.promise;
}

/**
 * Signin after passport authentication
 */
exports.signin = function(req, res, next) {
    debugger;
	passport.authenticate('local', function(err, user, info) {
        //Account not existed
		if (err || !user ) {
            console.log('signin err err' + err);
            console.log('signin err user' + user);
            console.log(info);
			res.status(400).send(info);
		}
        //Found
        else {
            //Account existed but not activated
            if(!user.activeAccountFlag) {
                var msg = {'message':'Your account has not been activated! Please check your activation email'};
               res.status(400).send(msg);
            }else {
                //Account existed and activated
                // Remove sensitive data before login
                user.password = undefined;
                user.salt = undefined;

                req.login(user, function (err) {
                    if (err) {
                        res.status(400).send(err);
                    } else {
                        res.jsonp(user);
                    }
                });
            }
		}
	})(req, res, next);
};

/**
 * Signout
 */
exports.signout = function(req, res) {
	req.logout();
	res.redirect('/');
};

/**
 * OAuth callback
 */
exports.oauthCallback = function(strategy) {
	return function(req, res, next) {
		passport.authenticate(strategy, function(err, user, redirectURL) {
			if (err || !user) {
				return res.redirect('/#!/signin');
			}
			req.login(user, function(err) {
				if (err) {
					return res.redirect('/#!/signin');
				}

				return res.redirect(redirectURL || '/');
			});
		})(req, res, next);
	};
};

/**
 * Helper function to save or update a OAuth user profile
 */
exports.saveOAuthUserProfile = function(req, providerUserProfile, done) {
	if (!req.user) {
		// Define a search query fields
		var searchMainProviderIdentifierField = 'providerData.' + providerUserProfile.providerIdentifierField;
		var searchAdditionalProviderIdentifierField = 'additionalProvidersData.' + providerUserProfile.provider + '.' + providerUserProfile.providerIdentifierField;

		// Define main provider search query
		var mainProviderSearchQuery = {};
		mainProviderSearchQuery.provider = providerUserProfile.provider;
		mainProviderSearchQuery[searchMainProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

		// Define additional provider search query
		var additionalProviderSearchQuery = {};
		additionalProviderSearchQuery[searchAdditionalProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

		// Define a search query to find existing user with current provider profile
		var searchQuery = {
			$or: [mainProviderSearchQuery, additionalProviderSearchQuery]
		};

		User.findOne(searchQuery, function(err, user) {
			if (err) {
				return done(err);
			} else {
				if (!user) {
					var possibleUsername = providerUserProfile.username || ((providerUserProfile.email) ? providerUserProfile.email.split('@')[0] : '');

					User.findUniqueUsername(possibleUsername, null, function(availableUsername) {
						user = new User({
							firstName: providerUserProfile.firstName,
							lastName: providerUserProfile.lastName,
							username: availableUsername,
							displayName: providerUserProfile.displayName,
							email: providerUserProfile.email,
							provider: providerUserProfile.provider,
							providerData: providerUserProfile.providerData
						});

						// And save the user
						user.save(function(err) {
							return done(err, user);
						});
					});
				} else {
					return done(err, user);
				}
			}
		});
	} else {
		// User is already logged in, join the provider data to the existing user
		var user = req.user;

		// Check if user exists, is not signed in using this provider, and doesn't have that provider data already configured
		if (user.provider !== providerUserProfile.provider && (!user.additionalProvidersData || !user.additionalProvidersData[providerUserProfile.provider])) {
			// Add the provider data to the additional provider data field
			if (!user.additionalProvidersData) user.additionalProvidersData = {};
			user.additionalProvidersData[providerUserProfile.provider] = providerUserProfile.providerData;

			// Then tell mongoose that we've updated the additionalProvidersData field
			user.markModified('additionalProvidersData');

			// And save the user
			user.save(function(err) {
				return done(err, user, '/#!/settings/accounts');
			});
		} else {
			return done(new Error('User is already connected using this provider'), user);
		}
	}
};

/**
 * Remove OAuth provider
 */
exports.removeOAuthProvider = function(req, res, next) {
	var user = req.user;
	var provider = req.param('provider');

	if (user && provider) {
		// Delete the additional provider
		if (user.additionalProvidersData[provider]) {
			delete user.additionalProvidersData[provider];

			// Then tell mongoose that we've updated the additionalProvidersData field
			user.markModified('additionalProvidersData');
		}

		user.save(function(err) {
			if (err) {
				return res.status(400).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				req.login(user, function(err) {
					if (err) {
						res.status(400).send(err);
					} else {
						res.jsonp(user);
					}
				});
			}
		});
	}
};