'use strict';

var Twit = require('twit');
var stream;
var _isStreaming = false;

var hashtags = {};

var _trackHashtag = function(tagData) {
  var tag = tagData.text;
  if(hashtags[tag]) {
    hashtags[tag] = hashtags[tag] + 1;
  } else {
    hashtags[tag] = 1;
  }
};

var startStream = function(token, tokenSecret) {
  var twit = new Twit({
    consumer_key: process.env.TWITTER_KEY,
    consumer_secret: process.env.TWITTER_SECRET,
    access_token: token,
    access_token_secret: tokenSecret
  });

  // Reset hashtags
  hashtags = {};

  stream = twit.stream('statuses/sample');

  _isStreaming = true;
  stream.on('tweet', function (tweet) {
    tweet.entities.hashtags.forEach(_trackHashtag);
  });
};

var stopStream = function() {
  stream.stop();
  _isStreaming = false;
};

var getHashtagStats = function() {
  // Sort the hashtags by popularity (count)
  var sortedTags = [];
  for (var tag in hashtags) {
    // Only include tags that have a more than one mention
    if(hashtags[tag] > 1) {
      sortedTags.push([tag, hashtags[tag]]);
    }
  }

  sortedTags.sort(function(a, b) {
    return b[1] - a[1];
  });

  return sortedTags;
};

var isStreaming = function() {
  return _isStreaming;
};

module.exports = {
  startStream: startStream,
  getHashtagStats: getHashtagStats,
  stopStream: stopStream,
  isStreaming: isStreaming
};
