tweetPackChart = function() {
  var module = {};

  var width = 500;
  var height = 500;
  var margins = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  };

  var options = {};

  var availWidth = width - margins.left - margins.right;
  var availHeight = height - margins.top - margins.bottom;

  var svg, mainGroup;

  module.run = function() {
    svg = d3.select('#tweet-pack-chart')
      .attr('width', width)
      .attr('height', height);

    mainGroup = svg.append('g')
      .attr('class', 'main-group')
      .attr('transform', 'translate(' + margins.left + ', ' + margins.top + ')');
  };

  return module;
}();

tweetPackChart.run();
