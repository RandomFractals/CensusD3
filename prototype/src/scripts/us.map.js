/**
 * US map d3.
 **/ 
var _map;
function USMap(window) {

  // save window ref for handling resize later
  this.window = window;

  // data panel margin for map resize
  this.margin = 264;

  // size to window
  this.width = window.innerWidth - this.margin; // 720
  // Note: width/3*2 - approximate usa map size ratio
  this.height = this.width / 3 * 2; // 480 

  // map scale for default 720x480 usa map size
  this.scale = 800;

  // US topology TopoJSON with land, states, and all counties
  this.usTopology = {};

  // state names and codes; can append more data :)  
  this.stateData = [];

  // TODO: simple states GeoJSON loaded first
  // since we will be loading zips, counties, and districts
  // on state click from us.json and others later. TBD 
  this.statesTopology = [];

  // TODO: get rid of this hack with callbacks later
  _map = this;

  // active region ref. for zoom in/out
  this.active = d3.select(null);

  // add map tooltip div for map regions mouseovers
  this.tooltip = d3.select("body")
		  .append("div")   
    	.attr("class", "tooltip")               
    	.style("opacity", 0);

  // create Albers USA map projection
  this.projection = d3.geoAlbersUsa()
    .scale(this.scale)
    .translate([this.width / 2, this.height / 2]); // center

  // create geo path for map projection
  this.geoPath = d3.geoPath()
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

  // create d3 map zoom behavior
  this.zoom = d3.zoom()
      .scaleExtent([1, 8])
      .translateExtent([[-100, -100], [this.width + 90, this.height + 100]])
      .on('zoom', function() {
        _map.onZoom();
      });

  /* old d3 v3 zoom behavior hookup
  this.zoom = d3.behavior.zoom()
      .translate([0, 0])
      .scale(1)
      .scaleExtent([1, 8])
      .on('zoom', function() {
        _map.onZoom();
      });*/
      
  // add d3 svg map zoom behavior
  this.svg.call(this.zoom);

  // old d3 v3 svg zoom hookup:
  //this.svg
  //    .call(this.zoom) // delete this line to disable free zooming
  //    .call(this.zoom.event);
  
  this.loadStateData(this);

  this.loadStatesGeoData(this);

  this.loadUSTopology(this);

} // end of USMap() constructor


/**
 * Loads state data from ../data/us-states.csv.
 */
USMap.prototype.loadStateData = function(map) {
  console.log('USMap::loadStateData::loading ../data/us-states.csv...');

  // load state names and codes; can append more data :)
  d3.csv('../data/us-states.csv')
    .row( function(d) { 
      return {name: d.state, code: d.code}; })
    .get( function(error, statesData) {
      map.statesData = statesData;
      console.log('USMap::loadStateData::loaded states: ' + map.statesData.length);      
  });
}

/**
 * Loads light 86kb ../data/us-states.json geo data
 * for initial usa map display.
 */
USMap.prototype.loadStatesGeoData = function(map) {
  console.log('USMap::loadStatesGeoData::loading ../data/us-states.json...');
  
  d3.json('../data/us-states.json', function(statesGeoData) {

    map.statesTopology = statesGeoData.features;
    console.log('USMap::loadStatesGeoData::loaded states geo data: ' + map.statesTopology.length);   

    // show states
    map.redraw(map);   
  });
}


/**
 * Loads US topology from ../data/us.json topoJSON file
 * with land, state, and counties boundaries
 * for zoom to state counties data load and graphs display later.
 */
USMap.prototype.loadUSTopology = function(map) {
  console.log('USMap::loadUSTopology::loading ../data/us.json...');

  // load US topology with land, state, and counties boundaries
  d3.json('../data/us.json', function(error, usTopology) {

    if (error) {
      console.error(error);
      // TODO: show error message
      throw error;
    }

    // save it for counties boundaries and data display later
    map.usTopology = usTopology;

    console.log('USMap::loadUSTopology::us.json topology loaded!');
  });
}


/**
 * Draws US map with interactive states
 * using loaded states geo data.
 */
USMap.prototype.redraw = function (map){  

  // create states paths
  console.log('USMap::redraw::creating state paths...');  
  this.g.selectAll('path')
        .data( map.statesTopology )
        .enter().append('path')
        .attr('d', this.geoPath)
        .attr('class', 'feature')
        .attr('id', function(d) {
          return 'state-' + d.id
        })
        .on('mouseover', function(d) {
          // show map tooltip
          map.tooltip.transition()
              .duration(200)      
              .style("opacity", .9);

          // display state name in tooltip
          map.tooltip.text(d.properties.name)
              .style("left", (d3.event.pageX) + "px")     
              .style("top", (d3.event.pageY - 28) + "px");  
        })
        .on('click', function(d) {
          if (map.active.node() === this) {
            // reset to zoom out on active region click
            return map.reset();
          }
          map.onClick(d, this); // selected region
        });

  // create state labels
  console.log('USMap::redraw::creating state labels...');
  this.g.selectAll(".state-label")
        .data( map.statesTopology )
        .enter().append("text")
        .attr("class", function(d) { return "state-label " + d.id; })
        .attr("transform", function(d) { return "translate(" + map.geoPath.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .text( function(d, i) {
          return map.statesData[i].code;
        });

  console.log('USMap::redraw::state paths and labels added to DOM!');

} // end of redraw ()


/**
 * d3 path click event handler.
 */
USMap.prototype.onClick = function (d, region) {

  // toggle active region selection
  this.active.classed('active', false);
  this.active = d3.select(region).classed('active', true);

  // get selected region bounds
  var bounds = this.geoPath.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2;

  // calculate new viewport scale based on region bounds
  var scale = Math.max(1, 
    Math.min(8, 0.9 / Math.max(dx / this.width, dy / this.height)));

  // determine translate coordinates for zoom
  var translate = [this.width / 2 - scale * x, this.height / 2 - scale * y];

  // zoom in
  /*this.svg.transition()
      .duration(750)
      .call(this.zoom.translate(translate).scale(scale).event);*/
}


/**
 * Resets active map feature and zooms out.
 */
USMap.prototype.reset = function() {

  console.log('reset');

  // clear active region selection
  this.active.classed('active', false);
  this.active = d3.select(null);

  // reset state labels font size
  this.g.selectAll(".state-label")
        .style('font-size', '12px');

  // zoom out
  this.svg.transition()
      .duration(750)
      .call(this.zoom.translate([0, 0]).scale(1).event);
}


/**
 * Map zoom behaviour event handler.
 */
USMap.prototype.onZoom = function() {

  // scale regions group stoke width on zoom
  this.g.style('stroke-width', 1.5 / d3.event.scale + 'px');

  // scale state labels font size
  this.g.selectAll(".state-label")
        .style('font-size', 12 / d3.event.scale + 'px');

  // transform states group for zoom
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

