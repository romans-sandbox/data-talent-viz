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

  var diameter = 1250;
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
      .sort(function(a, b) {
        return b.value - a.value;
      });
  };

  module.update = function(data) {
    packNodes = pack.nodes({children: data});

    itemContainersSel = innerCont.selectAll('div.item-container')
      .data(packNodes, function(d) {
        return d.id;
      });

    // update

    itemContainersSel
      .filter(function(d) {
        return !!d.id;
      })
      .attr('id', function(d) {
        return 'item' + d.id;
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

    itemContainersSel.select('div.number')
      .text(function(d) {
        return d.number;
      });

    // enter

    itemContainersEnter = itemContainersSel.enter()
      .append('div')
      .filter(function(d) {
        return !!d.id;
      })
      .attr('class', 'item-container')
      .attr('id', function(d) {
        return 'item' + d.id;
      });

    itemContainersEnter
      .each(function(d) {
        this.addEventListener('click', function() {
          alert(d.user_name + ': ' + d.text + '; https://twitter.com/' + d.screen_name + '/status/' + d.id);
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

    itemContainersEnter
      .append('div')
      .attr('class', 'number')
      .text(function(d) {
        return d.number;
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

  var topTenTweets = [];
  var allTweets;
  var yinYang = false;

  var v = {};

  v.hashtagMessage = document.querySelector('#hashtag-message');
  v.questionMessage = document.querySelector('#question-message');

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
            media_url: tweets[i].entities && tweets[i].entities.media && tweets[i].entities.media.length ? tweets[i].entities.media[0].media_url_https : null,
            number: tweets[i].number
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
          topTenTweets = data.slice(0, 10);
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

  module.run2 = function(silent) {
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

    if (!silent) {
      window.setInterval(function() {
        if (yinYang) {
          v.hashtagMessage.classList.add('visible');
          v.questionMessage.classList.remove('visible');
        } else {
          v.hashtagMessage.classList.remove('visible');
          v.questionMessage.classList.add('visible');
        }

        yinYang = !yinYang;
      }, 5000);
    }
  };

  module.getTopTenTweets = function() {
    return topTenTweets;
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
  v.tweetiesPrize = document.querySelector('#tweeties-prize');

  module.present = function(tweet) {
    queue.push(tweet);
  };

  module.getQueue = function() {
    return queue;
  };

  module.popQueue = function() {
    return queue.pop();
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
    ['3', 'rd'],
    ['4', 'th'],
    ['5', 'th'],
    ['6', 'th'],
    ['7', 'th'],
    ['8', 'th'],
    ['9', 'th'],
    ['10', 'th']
  ];

  var top, current = 0;

  var v = {};

  v.topTweet = document.querySelector('#top-tweet-container');
  v.topTweetOuter = document.querySelector('#top-tweets-outer');
  v.topTweetOrdinalNumber = document.querySelector('#top-tweet-ordinal-number');

  function showNext() {
    var tweet, content, allTweetCircles, tweetCircle, i, isNewTweet = false, newTweet;

    newTweet = tweetPresenter.popQueue();

    if (newTweet) {
      isNewTweet = true;

      newTweet.image = newTweet.user.profile_image_url.replace('_normal', '_bigger');

      if (newTweet.entities && newTweet.entities.media && newTweet.entities.media.length) {
        newTweet.media_url = newTweet.entities.media[0].media_url_https;
      }

      newTweet.user_name = newTweet.user.name;
      newTweet.screen_name = newTweet.user.screen_name;

      tweet = newTweet;

      v.topTweet.classList.add('new');
    } else {
      v.topTweet.classList.remove('new');

      if (current > 9) {
        current = 0;
      }

      top = tweetsClient.getTopTenTweets();

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

    // v.topTweetOrdinalNumber.innerHTML = ordinalInfo[current][0];

    allTweetCircles = document.querySelectorAll('div.item-container');

    if (allTweetCircles) {
      for (i = 0; i < allTweetCircles.length; i++) {
        allTweetCircles[i].classList.remove('active');
      }
    }

    tweetCircle = document.querySelector('#item' + tweet.id);

    if (tweetCircle) {
      tweetCircle.classList.add('active');
    }

    window.setTimeout(function() {
      v.topTweetOuter.classList.remove('invisible');

      window.setTimeout(function() {
        v.topTweetOuter.classList.add('invisible');

        window.setTimeout(function() {
          v.topTweet.innerHTML = '';

          !isNewTweet && current++;
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

(function() {
  var bank = [
/*    'How do you keep up with security threats?',
    'What cyber threat concerns you the most?',
    'How can we build a safer cyber world?',
    'Can you truly be anonymous online? Should you?',
    'What is your response plan in the event of a data breach?',
    'Do you regularly audit your user-access privileges?',
    'Do you update your software often? Why is it important?',
    'How do you train your staff to protect against threats?',
    'What monitoring strategies you use to identify unusual activity?',
    'Do cyber risks matter to your company?',
    'Is your business prepared for a major breach?',
    'Are you managing your supply chain risk?'*/
  ], current = 0, cont;

  cont = document.querySelector('#question-message');

  function change() {
    if (!cont) {
      return;
    }

    cont.innerHTML = bank[current];

    current++;
    if (current > bank.length - 1) {
      current = 0;
    }
  }

  change();
  window.setInterval(change, 5 * 60 * 1000); // every 5 minutes
})();

(function() {
  var plane;

  plane = document.querySelector('#plane');

  function f() {
    plane.classList.add('flying');

    window.setTimeout(function() {
      plane.classList.add('flying-2');
    }, 5000);

    window.setTimeout(function() {
      plane.classList.remove('flying');
      plane.classList.remove('flying-2');
    }, 7000);
  }

  if (plane) {
    window.setInterval(f, 20000);
    f();
  }
})();
