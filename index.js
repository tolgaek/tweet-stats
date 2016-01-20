'use strict';

var passport = require('passport');
var express = require('express');
var session = require('express-session');
var TwitterStrategy = require('passport-twitter').Strategy;

var app = express();

app.use(session({
  secret: 'DONT_KEEP_SECRETS_IN_YOUR_CODE'
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_KEY,
    consumerSecret: process.env.TWITTER_SECRET,
    callbackURL: 'http://127.0.0.1:8085/auth/twitter/callback'
  },
  function(token, tokenSecret, profile, done) {
    var user = {
      token: token,
      name: profile.displayName,
      username: profile.username,
      id: profile.id
    };

    done(null, user);
  }
));

app.get('/', function(req, res) {
  var response = 'Click <a href="/auth/twitter">here</a> ' +
                 'to authenticate yourself on Twitter';

  return res.send(response);
});

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { successRedirect: '/',
                                     failureRedirect: '/' }));

app.listen(8085);
