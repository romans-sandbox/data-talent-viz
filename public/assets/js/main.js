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
  var data = {
    "t": "0",
    "children": [
      {
        "t": "00",
        "value": 2
      },
      {
        "t": "01",
        "children": [
          {
            "t": "010",
            "value": 1
          },
          {
            "t": "011",
            "value": 1
          },
          {
            "t": "012",
            "value": 1
          },
          {
            "t": "013",
            "value": 1
          }
        ]
      },
      {
        "t": "02",
        "children": [
          {
            "t": "020",
            "value": 2
          },
          {
            "t": "021",
            "value": 1
          },
          {
            "t": "022",
            "value": 1
          },
          {
            "t": "023",
            "value": 1
          },
          {
            "t": "024",
            "value": 1
          },
          {
            "t": "025",
            "value": 2
          }
        ]
      },
      {
        "t": "03",
        "children": [
          {
            "t": "030",
            "value": 2
          },
          {
            "t": "031",
            "value": 2
          },
          {
            "t": "032",
            "value": 2
          },
          {
            "t": "033",
            "value": 2
          }
        ]
      },
      {
        "t": "04",
        "value": 5
      }
    ]
  };

  function preparePack() {
    pack = d3.layout.pack()
      .size([availWidth, availHeight]);

    packNodes = pack.nodes(data);

    itemsSel = mainGroup.selectAll('circle')
      .data(packNodes);

    itemsEnter = itemsSel.enter();

    itemCircles = itemsEnter.append('circle')
      .attr('cx', function(d) {
        return d.x
      })
      .attr('cy', function(d) {
        return d.y
      })
      .attr('r', function(d) {
        return d.r
      })
      .attr('stroke', 'black')
      .attr('stroke-width', '1')
      .attr('fill', 'white');

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
