tweetPackChart = function() {
  var module = {};

  var width = 500;
  var height = 500;
  var margins = {
    top: 1,
    right: 1,
    bottom: 1,
    left: 1
  };

  var options = {};

  var availWidth = width - margins.left - margins.right;
  var availHeight = height - margins.top - margins.bottom;

  var svg, mainGroup;
  var pack, packNodes;
  var itemsSel, itemsEnter, itemCircles;

  // sample data
  var data = [
    {
      value: 123
    },
    {
      value: 234
    },
    {
      value: 345
    },
    {
      value: 456
    },
    {
      value: 567
    },
    {
      value: 678
    }
  ];

  function preparePack() {
    pack = d3.layout.pack()
      .size([availWidth, availHeight])
      .value(function(d) {
        return d.value;
      });

    packNodes = pack.nodes({children: data});

    itemsSel = mainGroup.selectAll('circle')
      .data(packNodes);

    itemsEnter = itemsSel.enter();

    itemCircles = itemsEnter.append('circle')
      .attr('class', function(d) {
        return d.children ? 'item' : 'item leaf';
      })
      .attr('cx', function(d) {
        return d.x
      })
      .attr('cy', function(d) {
        return d.y
      })
      .attr('r', function(d) {
        return d.r
      });
  }

  module.run = function() {
    svg = d3.select('#tweet-pack-chart')
      .attr('width', width)
      .attr('height', height);

    mainGroup = svg.append('g')
      .attr('class', 'main-group')
      .attr('transform', 'translate(' + margins.left + ', ' + margins.top + ')');

    preparePack();
  };

  return module;
}();

tweetPackChart.run();
