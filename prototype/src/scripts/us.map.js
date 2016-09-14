/**
 * d3 v.4 US map UI component.
 **/ 
function USMap(usMapDataService, statusBar, dataPanel, window) {

  // status bar for app messages display
  this.statusBar = statusBar;

  // data panel for geo data text ang graphs display
  this.dataPanel = dataPanel;

  // save window ref for map sizing
  this.window = window;

  // data side panel margin for map resize
  this.margin = this.dataPanel.width;

  // size to window - data panel margin
  this.width = window.innerWidth - this.margin; // 720

  // Note: width/3*2 - approximate usa map size ratio
  this.height = this.width / 3 * 2; // 480 

  // map scale for default 720x480 usa map size
  this.scale = 800;

  // USA map data service for getting all USA states 
  // and regions geo data, names and codes for plotting the map 
  this.usMapDataService = usMapDataService;

  // USA topology TopoJSON with land, states, and all counties
  this.usTopology = {};

  // simple states Geo JSON data loaded first
  // since we will be loading zips, counties, and districts
  // on state click from us.json and others later 
  this.statesGeoData = [];

  // us counties FIPS codes and names keyd by state code
  this.stateCounties = {};

  // show all counties borders toggle for initial map load
  this.showAllCounties = true;

  // us states population data
  this.statesPopulation = []

  // major USA cities with population info
  this.usCities = [];

  // state capitals names and coordinates
  this.stateCapitals = [];

  // state capitals display toggle
  this.showStateCapitals = true;

  // total USA pop data count
  this.totalPopulation = 321418820;

  // total USA house seats for elections data viz
  this.houseSeats = 435;

  // selected state code for state selection tracking
  // and county regions geo data load
  this.selectedStateCode = '';

  // number format for display
  this.numberFormat = d3.format(',');

  // add window resize event handler
  this.window.addEventListener('resize', this.onWindowResize);

  // TODO: get rid of this hack with callbacks later
  var _map = this;

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

  // create quantize scale for pop data map choropleth
  this.quantize = d3.scaleQuantize()
    .domain([0, 0.4]) // 40mils tops for Cali
    .range( d3.range(9).map( 
      function(i) {return i;}
      ));

  // create map tiles layer
  this.tile = d3.tile()
    .size([this.width, this.height]);

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

  // create map tiles raster layer svg group
  this.raster = this.svg.append('g');

  // create us states map svg group
  this.g = this.svg.append('g');

  // create d3 map zoom behavior
  this.zoom = d3.zoom()
      .scaleExtent([1, 8])
      .translateExtent([[0, 0], [this.width, this.height]])
      .on('zoom', function() {
        _map.onZoom();
      });

  // add d3 svg map zoom behavior
  this.svg.call(this.zoom);

  // show loading data message
  this.statusBar.message.text('loading USA map data...');

  // load us geo and pop data async with d3 queue
  var q = d3.queue();
  q.defer(this.usMapDataService.getUSTopology, this.onUSTopologyLoaded, this);
  q.defer(this.usMapDataService.getUSPopulationData, this.onUSPopulationDataLoaded, this);      
  q.defer(this.usMapDataService.getStatesGeoData, this.onStatesGeoDataLoaded, this);
  // TODO: merge with states geo data ???  
  q.defer(this.usMapDataService.getStateCapitals, this.onStateCapitalsLoaded, this);
  q.awaitAll( function(error) {
    if (error) {
      console.error(error);
      throw error;
    }
    // draw map
    console.log('USMap::drawing map...');
    //_map.redraw(_map);
  });

  console.log('USMap::created');

} // end of USMap() constructor


/**----------- USA States and Counties Geo Data Load Event Handlers ------------------- */

/**
 * USA topology data load complete handler.
 */
USMap.prototype.onUSTopologyLoaded = function(usTopology, map) {  
  map.usTopology = usTopology;
  //console.log(Object.keys(map));
  console.log('USMap::onUSATopologyLoaded::US topology loaded!');
  //console.log(usTopology);

  // get US counties data
  map.usMapDataService.getUSCounties(
    map.usTopology,
    map.onUSCountiesLoaded, map);

  // draw states map
  //this.drawStates(this);  
}


/**
 * USA counties data load complete handler.
 */
USMap.prototype.onUSCountiesLoaded = function(stateCounties, map) {
  map.stateCounties = stateCounties;
  console.log('USMap::onUSACountiesLoaded::US state counties data loaded!');
  //console.log(stateCounties);  
}



/**
 * Displays loaded us states geo data.
 */
USMap.prototype.onStatesGeoDataLoaded = function(statesGeoData, map) {
  map.statesGeoData = statesGeoData;
  console.log('USMap::onStatesGeoData::states geo json loaded!');
  // show states
   map.drawStates(map);   
}


/**
 * State capitals data load complete handler.
 */
USMap.prototype.onStateCapitalsLoaded = function(statesCapitals, map) {
  map.stateCapitals = statesCapitals;
  console.log('USMap::onStateCapitalsLoaded::state capitals count: ' + map.stateCapitals.length);   
}



/**
 * USA population data load complete handler.
 */
USMap.prototype.onUSPopulationDataLoaded = function(statesPopulation, map) {
  map.statesPopulation = statesPopulation;
  console.log('USMap::loadUSPopulationData::loaded states population data: ' + 
    map.statesPopulation.length);

  // reset region data display to total USA data stats
  map.resetRegionData();
}


/**------------ USA Map Draw/Click/Zoom/Reset Methods -----------------------*/

/**
 * Updates map svg width on window resize.
 */
USMap.prototype.onWindowResize = function() {
  console.log('USMap::onWindowResize:width: ' + this.window.innerWidth);

  // update map containter width
  this.width = this.window.innerWidth;

  // TODO: update constructor and redraw to make this work properly
  drawStates(this);
}


/**
 * Draws US map with interactive states
 * using loaded states geo data.
 */
USMap.prototype.drawStates = function (map){  

  if (this.showAllCounties) {
      // draw all state counties borders
    //this.drawCounties('AK', this);
  }

  // create states paths
  console.log('USMap::drawStates::creating state paths...');
  this.g.selectAll('.state')
        .data( map.statesGeoData )
        .enter().append('path')
        .attr('d', this.geoPath)
        .attr('class', 'feature state')
        .attr('id', function(d) {
          return 'state-' + d.id
        })         
        .attr("class", function(d, i) {
          if ( i < map.statesPopulation.length) {
            return 'q' + map.quantize( map.statesPopulation[i].population / 40000000 ); // max 4 Cali
          }
          return ''; 
        })
        .on('mouseover', function(d, i) {
          // show map tooltip
          map.tooltip.transition()
              .duration(200)      
              .style("opacity", .9);

          // display state name in tooltip
          map.tooltip.html('<img height="18" src="../images/flags/' +
                d.properties.name.split(' ').join('_') + '.svg.png" /> ' + 
                '<span class="state-tooltip">' + d.properties.name + 
                '</span><br /><span class="label">population:</span><span class="data-text">' + 
                map.numberFormat( map.statesPopulation[i].population ) + 
                "</span>" 
              )
              .style("left", (d3.event.pageX + 24) + "px")     
              .style("top", (d3.event.pageY - 28) + "px")
              .style('height', '36px');         
        })
        .on('click', function(d, i) {
          console.log('click: ' + d.properties.code);          
          map.onStateClick(d, i, this); // selected region
        });

  // create state labels
  console.log('USMap::drawStates::creating state labels...');
  this.g.selectAll(".state-label")
        .data( map.statesGeoData )
        .enter().append("text")
        .attr("class", function(d) { return "state-label " + d.properties.code; }) // state code
        .attr("transform", function(d) { return "translate(" + map.geoPath.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .text( function(d, i) {
          return map.statesGeoData[i].properties.code;
        });

  this.drawStateCapitals(this);

  console.log('USMap::drawStates::state paths and labels added to DOM!');

} // end of drawStates ()


/**
 * Draws state capital bubbles.
 */
USMap.prototype.drawStateCapitals = function(map) {
  if (!this.showStateCapitals)
    return;

  console.log('USMap::drawStateCapitals::creating state capitals...');  
  this.g.selectAll('circle')
        .data( map.stateCapitals )
        .enter().append('circle')
        .attr('cx', function (d) { 
          return map.projection( [d.longitude, d.latitude] )[0]; 
        })
        .attr('cy', function (d) { 
          return map.projection( [d.longitude, d.latitude] )[1]; 
        })
        .attr('r', 4)
        .attr('class', 'city')
        .attr('id', function(d) {
          return 'city-' + d.capital
        })
        .on('mouseover', function(d) {
          // show map tooltip
          map.tooltip.transition()
              .duration(200)      
              .style("opacity", .9);

          // display state capital name in tooltip
          map.tooltip.text(d.capital)
              .style("left", (d3.event.pageX + 24) + "px")     
              .style("top", (d3.event.pageY - 28) + "px")
              .style('height', '16px'); 
        }); /* 
        .on('click', function(d) {
          if (map.active.node() === this) {
            // reset to zoom out on active region click
            return map.reset();
          }
          // TODO: implement city click
          map.onCityClick(d, this); // selected city
        });*/        
} // end of drawStateCapitals()


/**
 * State path click event handler.
 */
USMap.prototype.onStateClick = function (d, i, region) {

  // toggle active region selection
  this.active.classed('active', false);
  this.active = d3.select(region).classed('active', true);

  // save current state selection code
  this.selectedStateCode = d.properties.code;
  console.log('USMap::onStateClick::selected state: ' + this.selectedStateCode); 

  // draw state counties
  this.drawCounties(this.selectedStateCode, this);

  // show state population data for now
  this.updateRegionData(d, i);

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
  // transform states group for zoom
  this.scaleSvg(scale);
  this.transform(translate, scale);

  /*this.svg.transition()
      .duration(750)
      .call(this.zoom.translate(translate).scale(scale).event);*/
}


/**
 * Updates region data panel and 
 * app msg bar to state data stats + flag.
 */
USMap.prototype.updateRegionData = function (d, i){
  console.log('USMap::updateRegionData: ' + d.properties.name);

  // update app status bar with state data
  this.statusBar.update(d.properties.name, // state name 
    'population: ', 
    this.statesPopulation[i].population ); // state pop count

  // update data panel with state pop and house seats for now
  this.dataPanel.update(d.properties.name, { // state name 
      // list data
      population: this.statesPopulation[i].population, 
      house_seats: d.properties.houseSeats
    }, { // graph data
      dimensions: 'state,+population', //region',
      data: this.statesPopulation // graph all states pop data for now
    }, { // graph data
      dimensions: 'state,+population',
      data: this.statesPopulation // graph all states pop data for now
    });   
}


/**
 * Draws selected state counties on state path click.
 */
USMap.prototype.drawCounties = function (stateCode, map){  

  // create state county paths
  console.log('USMap::drawCounties::' + stateCode + 
    ' counties: ' + Object.keys(this.stateCounties[stateCode].counties).length );

  var stateCountiesTopology = 
    this.usMapDataService.getStateCountiesTopology(
      this.usTopology, this.stateCounties, stateCode);

  // draw selected state counties
  //console.log(this.usTopology.objects.counties);
  this.g.selectAll('.county').remove()
        .data( 
          topojson.feature(this.usTopology, stateCountiesTopology).features ) 
            //this.usTopology.objects.counties).features ) // to show all counties
        .enter().append('path')
        .attr('d', this.geoPath)
        .attr('class', 'county')
        .attr('id', function(d) {
          return 'county-' + d.properties.id;
        })
        .on('mouseover', function(d, i) {
          // show map tooltip
          map.tooltip.transition()
              .duration(200)      
              .style("opacity", .9);

          // display state name in tooltip
          map.tooltip.text( d.properties.state + ': ' + d.properties.name )
              .style("left", (d3.event.pageX + 10) + "px")     
              .style("top", (d3.event.pageY - 28) + "px")
              .style('height', '16px');

          //d3.event.stopPropagation();         
        })
        .on('click', function(d, i) {
          map.reset();
        })
        .on('dblclick', function(d, i) {
          map.reset();
        });
                 

  console.log('USMap::drawCounties::' + stateCode +  ' county paths added to DOM!');

} // end of drawCounties ()


/**
 * Resets active map feature and zooms out.
 */
USMap.prototype.reset = function() {

  console.log('USMap::reset');

  // clear active region selection
  this.selectedStateCode = '';
  this.active.classed('active', false);
  this.active = d3.select(null);

  // remove counties
  this.g.selectAll('.county').remove();

  // reset state labels font size
  this.g.selectAll(".state-label")
        .style('font-size', '12px');

  // update app data panel with total US pop data
  this.resetRegionData();

  // zoom out
  this.svg.transition()
      .duration(750)
      .call(this.zoom.transform, d3.zoomIdentity);
}



/**
 * Resets region data panel and msg bar to USA stats + flags.
 */
USMap.prototype.resetRegionData = function () {
  console.log('USMap::resetRegionData');

  // update app status bar with us pop info
  this.statusBar.update('USA', 'population: ', this.totalPopulation);

  // update data panel with total us pop and house seats for now
  this.dataPanel.update('USA', { // list data
      population: this.totalPopulation, 
      house_seats: this.houseSeats
    }, { // table data
      dimensions: 'state,+population',
      data: this.statesPopulation
    }, { // graph data
      dimensions: 'state,+population',
      data: this.statesPopulation
    });  
}


/**
 * Map zoom behaviour event handler.
 */
USMap.prototype.onZoom = function() {

  // get zoom transform vars
  var transform = d3.event.transform;

  // scale svg strokes and labels  
  this.scaleSvg(transform.k);

  // transform states group for zoom
  this.transform([transform.x, transform.y], transform.k); // scale

  // load map tiles
  //this.loadTiles(transform);
}


/** -------------- SVG Scale/Transfrom/Click Methods ----------------------*/

/**
 * Scales region paths stroke width and labels on zoom in/out.
 */
USMap.prototype.scaleSvg = function(zoomLevel) {
  // scale regions group stoke width on zoom
  this.g.style('stroke-width', 1.5 / zoomLevel + 'px');

  // scale city bubbles
  this.g.selectAll(".city")
        .attr('r', 4 / zoomLevel + 'px');

  // scale state labels font size
  this.g.selectAll(".state-label")
        .style('font-size', 12 / zoomLevel + 'px');

  if (zoomLevel > 3) {
    // show state names
    this.g.selectAll(".state-label")
        .data( this.statesGeoData )
        .text( function(d, i) {
          return d.properties.name;
        });    
  } else {
    // show state abbreviations
    this.g.selectAll(".state-label")
        .data( this.statesGeoData )
        .text( function(d, i) {
          return d.properties.code;
        });    
  }
}


/**
 * Transforms map geometry to the specified 
 * transform x,y and scale.
 */
USMap.prototype.transform = function(transform, scale) {
  // transform states group for zoom
  this.g.attr('transform', 
    'translate(' + transform[0] + ',' + transform[1] + ')scale(' + scale + ')');  
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


/** --------------- Future Map Tiles Methods --------------------------------- */

/** TODO: Figure out how to map open street map titles to US Albers projection ??? */

/**
 * Loads map tiles on zoom.
 */
USMap.prototype.loadTiles = function(transform) {
  var tiles = this.tile
      .scale(transform.k)
      .translate([transform.x, transform.y])
      ();

  var image = this.raster.attr("transform", 
      this.getTilesTransform(tiles.scale, tiles.translate))
    .selectAll("image")
    .data(tiles, function(d) { return d; });

  image.exit().remove();

  image.enter().append("image")
      .attr("xlink:href", function(d) { 
        return "http://" + "abc"[d[1] % 3] + ".tile.openstreetmap.org/" + 
          d[2] + "/" + d[0] + "/" + d[1] + ".png"; 
      })
      .attr("x", function(d) { return d[0] * 256; })
      .attr("y", function(d) { return d[1] * 256; })
      .attr("width", 256)
      .attr("height", 256);
}


/**
 * Gets tiles layer transform.
 */
USMap.prototype.getTilesTransform = function(scale, translate) {
  var k = scale / 256;
  var r = scale % 1 ? Number : Math.round;
  return "translate(" + r(translate[0] * scale) + "," + 
    r(translate[1] * scale) + ") scale(" + k + ")";
}