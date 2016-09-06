/**
 * US map d3
 **/ 
var _map;
function USMap(window) {

  // set map viewport size and scale
  this.window = window;
  this.width = window.innerWidth - 240; // 720
  this.height = this.width / 3 * 2; // 480
  this.scale = 800;
  this.topology = {};
  this.states = [];
  this.statesTopology = [];
  _map = this;

  // active feature for zoom in/out
  this.active = d3.select(null);

  // create Albers USA map projection
  this.projection = d3.geo.albersUsa()
    .scale(this.scale)
    .translate([this.width / 2, this.height / 2]); // center

  // create geo path for map projection
  this.geoPath = d3.geo.path()
      .projection(this.projection);

  // create map svg
  this.svg = d3.select('#map').append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .on('click', this.onSvgClick, true);

  // create map bg rect 
  this.svg.append('rect')
      .attr('class', 'background')
      .attr('width', this.width)
      .attr('height', this.height)
      .on('mouseover', function(d) {
        // hide map tooltip on bg rect mouse over
        _map.tooltip.style("opacity", 0)
      })
      .on('click', function (d) {
        // reset to zoom out on map bg rect click
        _map.reset();
      });

  // create us states map svg group
  this.g = this.svg.append('g');

  // create Zoom behavior
  this.zoom = d3.behavior.zoom()
      .translate([0, 0])
      .scale(1)
      .scaleExtent([1, 8])
      .on('zoom', function() {
        _map.onZoom();
      });

  // add map zoom behavior
  this.svg
      .call(this.zoom) // delete this line to disable free zooming
      .call(this.zoom.event);

  // add tooltip div
  this.tooltip = d3.select("body")
		  .append("div")   
    	.attr("class", "tooltip")               
    	.style("opacity", 0);

  // load state names and codes
  d3.csv('../data/us-states.csv')
    .row( function(d) { 
      return {name: d.state, code: d.code}; })
    .get( function(error, rows) {
      _map.states = rows;
      console.log(rows);
    });
}


USMap.prototype.onStatesLoad = function(error, statesData) {
  console.log(statesData);
}

/**
 * Loads US topology.
 */
USMap.prototype.load = function() {
  // load US topology
  d3.json('../data/us.json', function(error, us) {
    if (error) {
      console.error(error);
      throw error;
    }

    // draw US topology
    _map.redraw(us);
  });

}


/**
 * Draws US map.
 */
USMap.prototype.redraw = function (topoData){
  
  if (topoData) {
    this.topology = topoData;
  }

  //console.log(topoData);
  console.log('states: ' + this.states.length);

  // creates states
  this.g.selectAll('path')
        .data( topojson.feature(this.topology, this.topology.objects.states).features )
        .enter().append('path')
        .attr('d', this.geoPath)
        .attr('class', 'feature')
        .attr('id', function(d) {
          return 'state-' + d.id
        })
        .on('mouseover', function(d) {
          // show map tooltip
          _map.tooltip.transition()
              .duration(200)      
              .style("opacity", .9);

          // display state name
          _map.tooltip.text(d.id) // TODO: show state name, when it's in topojson
              .style("left", (d3.event.pageX) + "px")     
              .style("top", (d3.event.pageY - 28) + "px");  
        })
        .on('click', function(d) {
          if (_map.active.node() === this) {
            // reset to zoom out on same region click
            return _map.reset();
          }
          _map.onClick(d, this); // selected region
        });

  // create state borders
  this.g.append('path')
        .datum( topojson.mesh(this.topology, 
          this.topology.objects.states, function(a, b) { return a !== b; }) )
        .attr('class', 'mesh')
        .attr('d', this.geoPath);

  // create state labels
  console.log('creating state labels...');
  this.g.selectAll(".state-label")
        .data( topojson.feature(this.topology, this.topology.objects.states).features )
        .enter().append("text")
        .attr("class", function(d) { return "state-label " + d.id; })
        .attr("transform", function(d) { return "translate(" + _map.geoPath.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .text(function(d) {
          if (d.id <= _map.states.length)
            return _map.states[d.id-1].code;  
            console.log(d.id);
          return d.id; 
        });
}


/**
 * d3 path click event handler.
 */
USMap.prototype.onClick = function (d, region) {

  // toggle selection
  this.active.classed('active', false);
  this.active = d3.select(region).classed('active', true);

  // get selected region bounds
  var bounds = this.geoPath.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2;

  // calculate new viewport scale 
  var scale = Math.max(1, 
    Math.min(8, 0.9 / Math.max(dx / this.width, dy / this.height)));

  // determine translate coordinates for zoom
  var translate = [this.width / 2 - scale * x, this.height / 2 - scale * y];

  // zoom
  this.svg.transition()
      .duration(750)
      .call(this.zoom.translate(translate).scale(scale).event);

  // get region id
  console.log(region);
}


/**
 * Resets active map feature.
 */
USMap.prototype.reset = function() {
  this.active.classed('active', false);
  this.active = d3.select(null);

  this.svg.transition()
      .duration(750)
      .call(this.zoom.translate([0, 0]).scale(1).event);
}


/**
 * Zooms map to the selected state region.
 */
USMap.prototype.onZoom = function() {
  // scale regions group stoke width on zoom
  this.g.style('stroke-width', 1.5 / d3.event.scale + 'px');
  // TODO: scale state labels font size too

  // transform states group to zoom in on selected state
  this.g.attr('transform', 
    'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
}


/**
 * Svg click stop handler for smooth dragging.
 */
USMap.prototype.onSvgClick = function() {
  // If the drag behavior prevents the default click,
  // also stop propagation so we don’t click-to-zoom  
  if (d3.event.defaultPrevented) {
    d3.event.stopPropagation();
  }
}

