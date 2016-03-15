var tweetPackChart = function() {
  var module = {};

  var width = window.innerWidth;
  var height = window.innerHeight;
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

  var svg, mainGroup, defs;
  var pack, packNodes;
  var itemsSel, itemContainers;

  module.run = function() {
    svg = d3.select('#tweet-pack-chart')
      .attr('width', width)
      .attr('height', height);

    defs = svg.append('defs');

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

    itemsSel = mainGroup.selectAll('g.item-container circle.item')
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

    itemContainers = itemsSel.enter()
      .append('g')
      .attr('class', 'item-container')
      .on('click', function(d) {
        alert(d.text);
      });

    itemContainers
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

    itemContainers.each(function(d, i) {
      if (d.id) {
        // create

        defs
          .append('clipPath')
          .attr('id', 'item-clip-' + d.id)
          .append('circle')
          .attr('cx', function() {
            return d.x
          })
          .attr('cy', function() {
            return d.y
          })
          .attr('r', '0')
          .transition()
          .duration(options.durations.itemMorph)
          .attr('r', function() {
            return d.r
          });

        d3.select(this)
          .append('image')
          .attr('xlink:href', d.image)
          .attr('clip-path', 'url(#item-clip-' + d.id + ')')
          .attr('x', function() {
            return d.x;
          })
          .attr('y', function() {
            return d.y;
          })
          .attr('width', '0')
          .attr('height', '0')
          .transition()
          .duration(options.durations.itemMorph)
          .attr('x', function() {
            return d.x - d.r;
          })
          .attr('y', function() {
            return d.y - d.r;
          })
          .attr('width', function() {
            return d.r * 2;
          })
          .attr('height', function() {
            return d.r * 2;
          });
      }
    });

    mainGroup.selectAll('g.item-container')
      .data(packNodes)
      .each(function(d) {
        // update

        if (d.id) {
          defs.select('#item-clip-' + d.id)
            .select('circle')
            .transition()
            .duration(options.durations.itemMorph)
            .attr('cx', function() {
              return d.x
            })
            .attr('cy', function() {
              return d.y
            })
            .attr('r', function() {
              return d.r
            });

          d3.select(this)
            .select('image')
            .transition()
            .duration(options.durations.itemMorph)
            .attr('x', function() {
              return d.x - d.r;
            })
            .attr('y', function() {
              return d.y - d.r;
            })
            .attr('width', function() {
              return d.r * 2;
            })
            .attr('height', function() {
              return d.r * 2;
            });
        }
      })
      .exit()
      .each(function(d) {
        // exit

        defs.select('#item-clip-' + d.id)
          .select('circle')
          .transition()
          .duration(options.durations.itemMorph)
          .attr('r', '0')
          .each('end', function() {
            d3.select(this.parentNode).remove();
          });

        d3.select(this)
          .select('image')
          .transition()
          .duration(options.durations.itemMorph)
          .attr('x', function() {
            return d.x;
          })
          .attr('y', function() {
            return d.y;
          })
          .attr('width', '0')
          .attr('height', '0');
      });

    itemsSel.exit()
      .transition()
      .duration(options.durations.itemMorph)
      .attr('r', '0')
      .each('end', function(d) {
        d3.select(this.parentNode).remove();
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
              value: tweets[id].favorite_count + tweets[id].retweet_count + 1,
              image: tweets[id].user.profile_image_url_https.replace('_normal', ''), // original size
              text: tweets[id].text
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

  module.run2 = function() {
    if ('io' in window) {
      // connect to the server
      socket = io.connect('/');

      // listen to new tweets
      socket.on('new tweet', function(tweet) {
        tweetPresenter.present(tweet);
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

var tweetPresenter = function() {
  var module = {};

  var queue = [];
  var busy = false;

  var template = '<div class="tweetie"><div class="top"><div class="image"><img src="%image"></div><div class="profile-name">%profile-name</div><div class="screen-name">%screen-name</div></div><div class="text">%text</div></div>';

  var options = {
    delay: 3000,
    fading: 500
  };

  var v = {};

  v.tweeties = document.querySelector('#tweeties');

  module.present = function(tweet) {
    if (busy) {
      queue.push(tweet);
    } else {
      v.tweeties.innerHTML = template
        .replace('%profile-name', tweet.user.name)
        .replace('%screen-name', tweet.user.screen_name)
        .replace('%text', tweet.text)
        .replace('%image', tweet.user.profile_image_url.replace('_normal', '_bigger'));

      busy = true;

      window.setTimeout(function() {
        v.tweeties.classList.remove('invisible');

        window.setTimeout(function() {
          v.tweeties.classList.add('invisible');

          window.setTimeout(function() {
            v.tweeties.innerHTML = '';
            busy = false;

            if (queue.length) {
              module.present(queue.pop());
            }
          }, options.fading);
        }, options.delay);
      }, options.fading);
    }
  };

  return module;
}();
