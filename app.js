var fs = require('fs'),
    path = require('path'),
    http = require('http'),
    _  = require('underscore'),
    express = require('express'),
    twitter = require('ntwitter'),
    config = require('jsonconfig'),
    socketio = require('socket.io'),
    sentimental = require('Sentimental');

path.exists("config.json", function(exists) {
  if (exists) config.load(['config.json']);
});

function main() {
  var app = express();
  var server = http.createServer(app);
  var io = socketio.listen(server);

  app.configure(function() {
    app.use(express.static(__dirname + '/public'));
  });

  // heroku specific configuration
  io.configure('production', function () {
    io.set("transports", ["xhr-polling"]); 
    io.set("polling duration", 10); 
    config.consumer_key = process.env.TWITTER_CONSUMER_KEY;
    config.consumer_secret = process.env.TWITTER_CONSUMER_SECRET;
    config.access_token_key = process.env.TWITTER_ACCESS_TOKEN_KEY;
    config.access_token_secret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
    config.port = process.env.PORT;
  });

  var tweets = new twitter(config);
  tweets.stream('statuses/filter', {track: 'obama,romney'}, function(stream) {
    stream.on('data', function(t) {
      io.sockets.emit('tweet', {
        created: t.created_at,
        text: t.text,
        user: t.user.screen_name,
        name: t.user.name,
        avatar: t.user.profile_image_url,
        retweeted: t.retweeted || t.text.match(/RT:? /),
        url: "http://twitter.com/" + t.user.screen_name + "/statuses/" + t.id_str,
        score: sentimental.analyze(t.text).score
      });
    });
    stream.on('error', function(err, code) { 
      console.log('uhoh got a twitter stream error: ' + err + ' ; ' + code);
    });
    stream.on('limit', function(l) {
      console.log('whoops we got limited by twitter: ' + l);
    });
  });

  server.listen(process.env.PORT || config.port || 3000);
}

if (! module.parent) {
  main();
}
