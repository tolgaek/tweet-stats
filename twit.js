'use strict';
/**
 * @module Twit
 *
 * Collects tweets through the Twitter Stream API
 * Provides a sorted list of most popular tags
 */

/**
 * Module Dependencies
 */
var Twit = require('twit');
var stream;
var _isStreaming = false;

var hashtags = {};

/**
 * @private
 *
 * Increments or initializes the count for a given tag
 * @param {Object} tagData - Contains info about the hashtag
 * @param {String} tagData.text - Name of the tag
 */
var _trackHashtag = function(tagData) {
  var tag = tagData.text;
  if(hashtags[tag]) {
    hashtags[tag] = hashtags[tag] + 1;
  } else {
    hashtags[tag] = 1;
  }
};

/**
 * @public
 *
 * Starts the stream to start collecting tweets
 *
 * @param {String} token - OAuth token of user
 * @param {String} tokenSecret - OAuth secret of user
 */
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

/**
 * @public
 *
 * Stops the twitter stream
 */
var stopStream = function() {
  stream.stop();
  _isStreaming = false;
};

/**
 * @public
 *
 * Sorts the hashtags by popularity and returns it in array
 *
 * @return {Array} Array of tag data array. Each tag is an array
 * [0] is the name of the array, [1] is the attribute
 *
 */
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

/**
 * @public
 *
 * @return {Boolean} indicates whether twitter API is currently streaming
 */
var isStreaming = function() {
  return _isStreaming;
};

module.exports = {
  startStream: startStream,
  getHashtagStats: getHashtagStats,
  stopStream: stopStream,
  isStreaming: isStreaming
};
