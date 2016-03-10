var tweetPackChart = function() {
  var module = {};

  var width = 500;
  var height = 500;
  var margins = {
    top: 1,
    right: 1,
    bottom: 1,
    left: 1
  };

  var options = {
    durations: {
      itemMorph: 500
    }
  };

  var availWidth = width - margins.left - margins.right;
  var availHeight = height - margins.top - margins.bottom;

  var svg, mainGroup;
  var pack, packNodes;
  var itemsSel;

  module.run = function() {
    svg = d3.select('#tweet-pack-chart')
      .attr('width', width)
      .attr('height', height);

    mainGroup = svg.append('g')
      .attr('class', 'main-group')
      .attr('transform', 'translate(' + margins.left + ', ' + margins.top + ')');

    pack = d3.layout.pack()
      .size([availWidth, availHeight])
      .value(function(d) {
        return d.value;
      })
      .padding(10)
      .sort(null);
  };

  module.update = function(data) {
    packNodes = pack.nodes({children: data});

    itemsSel = mainGroup.selectAll('circle')
      .data(packNodes);

    itemsSel
      .transition()
      .duration(options.durations.itemMorph)
      .attr('cx', function(d) {
        return d.x
      })
      .attr('cy', function(d) {
        return d.y
      })
      .attr('r', function(d) {
        return d.r
      });

    itemsSel.enter()
      .append('circle')
      .attr('class', function(d) {
        return d.children ? 'item' : 'item leaf';
      })
      .attr('cx', function(d) {
        return d.x
      })
      .attr('cy', function(d) {
        return d.y
      })
      .attr('r', '0')
      .transition()
      .duration(options.durations.itemMorph)
      .attr('r', function(d) {
        return d.r
      });

    itemsSel.exit()
      .transition()
      .duration(options.durations.itemMorph)
      .attr('r', '0')
      .each('end', function() {
        d3.select(this).remove();
      });
  };

  return module;
}();

var tweetsClient = function() {
  var module = {};

  var socket = null;

  function parseTweets(tweets) {
    var data = [], id;

    if (tweets) {
      for (id in tweets) {
        if (tweets.hasOwnProperty(id)) {
          data.push(
            {
              id: tweets[id].id_str,
              value: tweets[id].favorite_count + tweets[id].retweet_count + 1
            }
          );
        }
      }
    }

    if (!data.length) {
      return null;
    }

    return data;
  }

  module.run = function() {
    if ('io' in window) {
      // connect to the server
      socket = io.connect('/');

      // listen to new tweets
      socket.on('new tweet', function(tweet) {
        // console.log(tweet);
      });

      // listen to old tweets
      socket.on('latest tweets', function(tweets) {
        var i;

        tweets.statuses = tweets.statuses.reverse();

        for (i = 0; i < tweets.statuses.length; i++) {
          // console.log(tweets.statuses[i]);
        }
      });

      socket.on('all tweets', function(tweets) {
        var data;

        data = parseTweets(tweets);

        if (data) {
          tweetPackChart.update(data);
        } else {
          console.log('Could not parse all tweets.');
        }
      });

      socket.on('connected', function(req) {
        console.log('Listening to tweets matching ' + req.tracking + '...');

        // tell the server to start the streaming
        socket.emit('start stream');
      });
    }
  };

  return module;
}();

tweetPackChart.run();
tweetsClient.run();
