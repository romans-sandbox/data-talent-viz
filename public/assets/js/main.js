d3.selection.prototype.moveToFront = function() {
  return this.each(function() {
    this.parentNode.appendChild(this);
  });
};

d3.selection.prototype.moveToBack = function() {
  return this.each(function() {
    var firstChild = this.parentNode.firstChild;
    if (firstChild) {
      this.parentNode.insertBefore(this, firstChild);
    }
  });
};

var tweetPack = function() {
  var module = {};

  var diameter = 1150;
  var margins = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  };

  var options = {
    durations: {
      itemMorph: 500
    }
  };

  var availWidth = diameter - margins.left - margins.right;
  var availHeight = diameter - margins.top - margins.bottom;

  var cont, innerCont;
  var pack, packNodes;
  var itemContainersSel, itemContainersEnter, itemContainersExit;

  module.run = function() {
    cont = d3.select('#tweet-pack-cont')
      .style('width', diameter + 'px')
      .style('height', diameter + 'px');

    innerCont = cont.append('div')
      .attr('class', 'inner')
      .style('left', margins.left + 'px')
      .style('top', margins.top + 'px');

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

    itemContainersSel = innerCont.selectAll('div.item-container')
      .data(packNodes);

    // update

    itemContainersSel
      .filter(function(d) {
        return !!d.id;
      })
      .attr('id', function(d) {
        return d.id;
      });

    itemContainersSel
      .transition()
      .duration(options.durations.itemMorph)
      .style('left', function(d) {
        return d.x - d.r + 'px';
      })
      .style('top', function(d) {
        return d.y - d.r + 'px';
      });

    itemContainersSel.select('img.item-image')
      .transition()
      .duration(options.durations.itemMorph)
      .attr('width', function(d) {
        return d.r * 2;
      })
      .attr('height', function(d) {
        return d.r * 2;
      });

    // enter

    itemContainersEnter = itemContainersSel.enter()
      .append('div')
      .attr('class', 'item-container')
      .filter(function(d) {
        return !!d.id;
      });

    itemContainersEnter
      .each(function(d) {
        this.addEventListener('click', function() {
          alert(d.text);
        }, false);
      });

    itemContainersEnter
      .style('left', function(d) {
        return d.x + 'px';
      })
      .style('top', function(d) {
        return d.y + 'px';
      })
      .transition()
      .duration(options.durations.itemMorph)
      .style('left', function(d) {
        return d.x - d.r + 'px';
      })
      .style('top', function(d) {
        return d.y - d.r + 'px';
      });

    itemContainersEnter
      .append('img')
      .attr('class', 'item-image')
      .attr('src', function(d) {
        return d.image;
      })
      .attr('width', '0')
      .attr('height', '0')
      .transition()
      .duration(options.durations.itemMorph)
      .attr('width', function(d) {
        return d.r * 2;
      })
      .attr('height', function(d) {
        return d.r * 2;
      });

    // exit

    itemContainersExit = itemContainersSel.exit();

    itemContainersExit
      .transition()
      .duration(options.durations.itemMorph)
      .style('left', function(d) {
        return d.x + 'px';
      })
      .style('top', function(d) {
        return d.y + 'px';
      });

    itemContainersExit
      .select('img.item-image')
      .transition()
      .duration(options.durations.itemMorph)
      .attr('width', '0')
      .attr('height', '0')
      .each('end', function(d) {
        d3.select(this.parentNode).remove();
      });
  };

  return module;
}();

var tweetsClient = function() {
  var module = {};

  var socket = null;

  var topFiveTweets = [];
  var allTweets;

  function parseTweets(tweets) {
    var data = [], i;

    if (tweets) {
      for (i = 0; i < tweets.length; i++) {
        data.push(
          {
            id: tweets[i].id_str,
            value: tweets[i].score,
            image: tweets[i].user.profile_image_url_https.replace('_normal', ''), // original size
            text: tweets[i].text,
            user_name: tweets[i].user.name,
            screen_name: tweets[i].user.screen_name,
            media_url: tweets[i].entities && tweets[i].entities.media && tweets[i].entities.media.length ? tweets[i].entities.media[0].media_url_https : null
          }
        );
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

      socket.on('all tweets', function(tweets) {
        var data;

        data = parseTweets(tweets);

        if (data) {
          topFiveTweets = data.slice(0, 5);
          allTweets = data;
          tweetPack.update(data);
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

  module.getTopThreeTweets = function() {
    return topFiveTweets;
  };

  module.getAllTweets = function() {
    return allTweets;
  };

  return module;
}();

var tweetPresenter = function() {
  var module = {};

  var queue = [];
  var busy = false;
  var previous = [];

  var template = '<div class="tweetie"><div class="inner"><div class="top"><div class="image"><img src="%image"></div><div class="profile-name">%profile-name</div><div class="screen-name">%screen-name</div></div><div class="text">%text</div></div><div class="embedded-image">%embedded-image</div></div>';

  var options = {
    delay: 10000,
    fading: 500
  };

  var v = {};

  v.tweeties = document.querySelector('#tweeties');

  module.present = function(tweet) {
    var content;

    if (!tweet.in_reply_to_status_id && !tweet.retweeted_status) {
      if (busy) {
        queue.push(tweet);
        previous.push(tweet);
      } else {
        content = template
          .replace('%profile-name', tweet.user.name)
          .replace('%screen-name', tweet.user.screen_name)
          .replace('%text', tweet.text)
          .replace('%image', tweet.user.profile_image_url.replace('_normal', '_bigger'));

        if (tweet.entities && tweet.entities.media && tweet.entities.media.length) {
          content = content.replace(
            '%embedded-image',
            '<img src="' + tweet.entities.media[0].media_url_https + '">'
          );
        } else {
          content = content.replace('%embedded-image', '');
        }

        v.tweeties.innerHTML = content;

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
              } else {
                module.present(previous[Math.floor(Math.random() * (previous.length - 1))]);
              }
            }, options.fading);
          }, options.delay);
        }, options.fading);
      }
    }
  };

  return module;
}();

var topTweetsPresenter = function() {
  var module = {};

  var template = '<div class="tweetie"><div class="inner"><div class="top"><div class="image"><img src="%image"></div><div class="profile-name">%profile-name</div><div class="screen-name">%screen-name</div></div><div class="text">%text</div></div><div class="embedded-image">%embedded-image</div></div>';

  var options = {
    delay: 3000,
    fading: 500,
    retryAfter: 1000
  };

  var ordinalInfo = [
    ['1', 'st'],
    ['2', 'nd'],
    ['3', 'rd']
  ];

  var top, current = 0;

  var v = {};

  v.topTweet = document.querySelector('#top-tweet-container');
  v.topTweetOuter = document.querySelector('#top-tweets-outer');
  v.topTweetOrdinalNumber = document.querySelector('#top-tweet-ordinal-number');
  v.topTweetOrdinalIndicator = document.querySelector('#top-tweet-ordinal-indicator');

  function showNext() {
    var tweet, content;

    if (current > 4) {
      current = 0;
    }

    top = tweetsClient.getTopThreeTweets();

    if (current in top) {
      tweet = top[current];
    } else {
      current = 0;

      if (current in top) {
        tweet = top[current];
      } else {
        window.setTimeout(function() {
          showNext();
        }, options.retryAfter);

        return;
      }
    }

    content = template
      .replace('%profile-name', tweet.user_name)
      .replace('%screen-name', tweet.screen_name)
      .replace('%text', tweet.text)
      .replace('%image', tweet.image);

    if (tweet.media_url) {
      content = content.replace(
        '%embedded-image',
        '<img src="' + tweet.media_url + '">'
      );
    } else {
      content = content.replace('%embedded-image', '');
    }

    v.topTweet.innerHTML = content;

    v.topTweetOrdinalNumber.innerHTML = ordinalInfo[current][0];
    v.topTweetOrdinalIndicator.innerHTML = ordinalInfo[current][1];

    window.setTimeout(function() {
      v.topTweetOuter.classList.remove('invisible');

      window.setTimeout(function() {
        v.topTweetOuter.classList.add('invisible');

        window.setTimeout(function() {
          v.topTweet.innerHTML = '';

          current++;
          showNext();
        }, options.fading);
      }, options.delay);
    }, options.fading);
  }

  module.present = function() {
    showNext();
  };

  return module;
}();
