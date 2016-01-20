'use strict';

var passport = require('passport');
var express = require('express');
var session = require('express-session');
var TwitterStrategy = require('passport-twitter').Strategy;
var twit = require('./twit');

var app = express();

app.use(session({
  secret: 'DONT_KEEP_SECRETS_IN_YOUR_CODE'
}));

app.use(passport.initialize());
app.use(passport.session());

// Disable etag to avoid caching issues while reloading tags
app.disable('etag');

// Dummy serialize/deserialize functions since we dont have a DB to store
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

// Configure twitter strategy
passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_KEY,
    consumerSecret: process.env.TWITTER_SECRET,
    callbackURL: 'http://127.0.0.1:8085/auth/twitter/callback'
  },
  function(token, tokenSecret, profile, done) {
    var user = {
      token: token,
      tokenSecret: tokenSecret,
      name: profile.displayName,
      username: profile.username,
      id: profile.id
    };

    done(null, user);
  }
));

// Endpoints
app.get('/', function(req, res) {
  if(!req.user) {
    var response = 'Oops, you are not logged in. Click ' +
                   '<a href="/auth/twitter">here</a> ' +
                   'to authenticate yourself on Twitter';

    return res.send(response);
  }

  twit.startStream(req.user.token, req.user.tokenSecret);
  return res.send('Hello ' + req.user.name + '<br />' +
                  'Collecting tweet data now. Head to ' +
                  '<a href="/popular-tags">popular tags</a> ' +
                  'to see the trending tags');
});

app.get('/popular-tags', function(req, res) {
  if (!req.user) {
    return res.redirect('/');
  }

  var response;
  if (twit.isStreaming()) {
    response = '<html><head><meta http-equiv="refresh" content="3" />' +
               '</head><body>Following is the trending tags. ' +
               'Only tags with more than 1 mention is displayed. This ' +
               'page will refresh every 3 seconds<br /><br />' +
               'Click <a href="/stop-stream">here</a> to stop ' +
               'streaming tweets<br /><br />';
  } else {
    response = '<html><body>Streaming stopped. Following was the trending ' +
               'tags collected during stream<br /><br />';
  }

  var tags = twit.getHashtagStats();
  // Format tags
  tags.forEach(function(tagData) {
    response += tagData[0] + ': ' + tagData[1] + '<br />';
  });

  response += '</body></html>';
  res.send(response);
});

app.get('/stop-stream', function(req, res) {
  twit.stopStream();
  res.redirect('/popular-tags');
});

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { successRedirect: '/',
                                     failureRedirect: '/' }));

app.listen(8085);
