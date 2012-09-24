function main() {
  romneyCount = 0;
  romneyScore = 0;
  obamaCount = 0;
  obamaScore = 0;
  pause = false;
  tweetTemplate = $("#tweet-template").html();

  $(document).bind('keyup', 'p', togglePause);

  var socket = io.connect();
  socket.on('connect', function() {
    socket.on('tweet', function(tweet) {
      addTweet(tweet);
    });
  });
}

function addTweet(tweet) {
  if (pause) return; 

  tweet.textWithLinks = makeLinks(tweet.text);

  if (tweet.score < 0) {
    tweet.sentimentClass = "negative";
  } else if (tweet.score > 0) {
    tweet.sentimentClass = "positive";
  } else {
    tweet.sentimentClass = "neutral";
  }

  var item = $(Mustache.render(tweetTemplate, tweet));
  var obama = tweet.text.match(/obama/i);
  var romney = tweet.text.match(/romney/i);

  if (obama && romney) {
    $("#obama header.column").after(item);
    $("#romney header.column").after(item.clone());
    romneyCount += 1;
    romneyScore += tweet.score;
    obamaCount += 1;
    obamaScore += tweet.score;
  } else if (obama) {
    obamaCount += 1;
    obamaScore += tweet.score;
    $("#obama header.column").after(item);
  } else if (romney) {
    romneyCount += 1;
    romneyScore += tweet.score;
    $("#romney header.column").after(item);
  }

  // updateCounters
  $("#obama header .count").text(obamaCount);
  $("#romney header .count").text(romneyCount);

  // update scores
  $("#obama header .score").text(obamaScore);
  $("#romney header .score").text(romneyScore);

  // update averages
  var obamaAvg = avg(obamaScore, obamaCount);
  $("#obama header .average").text(obamaAvg);
  var romneyAvg = avg(romneyScore, romneyCount);
  $("#romney header .average").text(romneyAvg);

  updateRunningClasses();

  // remove old updates so the DOM doesn't bloat memory when 
  // someone leaves their browser open :-)
  $("#obama article.tweet:gt(100)").detach();
  $("#romney article.tweet:gt(100)").detach();
}

function avg(score, total) {
  if (total == 0) return 0;
  return (score / total).toFixed(2);
}

var urlPattern = new RegExp('(http://t.co/[^ ]+)', 'g');
function makeLinks(text) {
  return text.replace(urlPattern, '<a href="$1">$1</a>');
}

function togglePause() {
  if (pause) { 
    pause = false;
    $("#pause").html("&nbsp;");
  } else {
    pause = true;
    $("#pause").text('paused ... type "p" to unpause');
  }
}

function updateRunningClasses() {
  ["obama", "romney"].forEach(function (s) {
    var id = "#" + s;
    var e = $(id + " header .runningStats");
    var avg = parseFloat($(id + " .average").text())
    if (avg > 0) {
      e.removeClass("negative");
      e.addClass("positive");
    } else if (avg == 0) {
      e.removeClass("negative");
      e.removeClass("positive");
    } else if (avg < 0) {
      e.removeClass("positive");
      e.addClass("negative");
    }
  });
}

$(document).ready(main);
