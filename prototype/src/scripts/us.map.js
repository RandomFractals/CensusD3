/**
 * US map d3.
 **/ 
function USMap(window, margin) {

  // save window ref for map sizing
  this.window = window;

  // data side panel margin for map resize
  this.margin = margin;

  // size to window - data panel margin
  this.width = window.innerWidth - this.margin; // 720

  // Note: width/3*2 - approximate usa map size ratio
  this.height = this.width / 3 * 2; // 480 

  // map scale for default 720x480 usa map size
  this.scale = 800;

  // us map data service for getting all us states 
  // and regions geo data, names and codes for plotting the map 
  this.usMapDataService = new USMapDataService();

  // US topology TopoJSON with land, states, and all counties
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
  this.usPopulation = []

  // major us cities with population info
  this.usCities = [];

  // state capitals names and coordinates
  this.stateCapitals = [];

  // state capitals display toggle
  this.showStateCapitals = false;

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

  // app status message ref
  this.message = d3.select('#message');

  // region name section title ref 
  this.regionTitle = d3.select('#region');

  // region data section refs 
  this.regionData = d3.select('#regionData');
  this.populationData = d3.select('#populationData');
  this.houseSeatsData = d3.select('#houseSeatsData');

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
  this.message.text('loading USA map data...');

  // load us data async with d3 queue
  var q = d3.queue();
  q.defer(this.usMapDataService.getUSTopology, this.onUSTopologyLoaded, this);  
  q.defer(this.loadUSPopulationData, this);
  q.defer(this.loadStatesGeoData, this);
  // TODO: merge with states geo data ???  
  q.defer(this.loadStateCapitals, this);
  q.awaitAll( function(error) {
    if (error) {
      console.error(error);
      throw error;
    }
    // draw map
    console.log('USMap::drawing map...');
    //_map.redraw(_map);
  });

} // end of USMap() constructor


/**
 * US topology data load complete handler.
 */
USMap.prototype.onUSTopologyLoaded = function(usTopology, map) {
  console.log('USMap::onUSTopologyLoaded::US topology loaded!');
  console.log(usTopology);

  map.usTopology = usTopology;
  //console.log(Object.keys(map));

  // get US counties data
  map.getUSCounties(map);

  // draw states map
  //this.drawStates(this);  
}


/**
 * Gets US counties FIPS codes and names from ../data/us-counties.json file
 * for zoom to state counties data load and graphs display later.
 */
USMap.prototype.getUSCounties = function(map) {
  console.log('USMap::getUSCounties::loading ../data/us-counties.json...');

  // load US counties data
  d3.json('../data/us-counties.json', function(error, usCounties) {

    if (error) {
      console.error(error);
      // TODO: show error message ???
      throw error;
    }

    //console.log(usCounties);
    var state, lastState = '';
    var stateCounties = {};
    var stateCounty;
    var countyCount = 0;
    for (var countyId in usCounties) {
      state = usCounties[countyId].state
      if (state !== lastState) {
        lastState = state;
        // create new state counties data map and 
        // add topology for state counties topojson load later
        stateCounties[state] = {
          counties: {}, 
          topology: {
            type: 'GeometryCollection',
            // copy bounding box from us counties topojson
            bbox: map.usTopology.objects.counties.bbox,
            geometries: []
          }
        };
        //console.log('USMap::getUSCounties::adding counties for state: ' + state);
      }
      // set county id and add it to the state counties collection
      usCounties[countyId].id = countyId;
      stateCounties[state].counties[Number(countyId)] = usCounties[countyId]; 
      countyCount++;
    }

    console.log('USMap::getUSCounties::loaded counties: ' + countyCount);
    console.log('USMap::getUSCounties::loaded county states: ' + Object.keys(stateCounties).length );
    //console.log(stateCounties);

    // save loaded state counties data
    // for counties boundaries and data display 
    // on state selection
    map.stateCounties = stateCounties;    
  });
}


/**
 * Loads US population data from ../data/us-population.json.
 */
USMap.prototype.loadUSPopulationData = function(map) {
  console.log('USMap::loadUSPopulationData::loading ../data/us-population.json...');
  d3.json('../data/us-population.json', function(usPopulation) {
    // save us population data
    map.usPopulation = usPopulation;

    // update app message
    map.message.html('USA population: <span class="data-text">' + 
      map.numberFormat(usPopulation.total) + '</span>');

    // update app data panel
    map.regionTitle.text('USA');
    map.populationData.text(
      map.numberFormat( map.usPopulation.total) );
    map.houseSeatsData.text(map.houseSeats);

    console.log('USMap::loadUSPopulationData::loaded states population data: ' + 
      map.usPopulation.states.length);   
  });
}


/**
 * Loads light 86kb ../data/us-states.json geo data
 * for initial usa map display.
 */
USMap.prototype.loadStatesGeoData = function(map) {
  console.log('USMap::loadStatesGeoData::loading ../data/us-states.json...');
  
  d3.json('../data/us-states.json', function(statesGeoData) {
    map.statesGeoData = statesGeoData.features;
    console.log('USMap::loadStatesGeoData::loaded states geo data: ' + map.statesGeoData.length);   

    // show states
    map.drawStates(map);   
  });
}


/**
 * Loads state capitals data from ../data/us-state-capitals.csv.
 */
USMap.prototype.loadStateCapitals = function(map) {
  console.log('USMap::loadStateCapitals::loading ../data/us-state-capitals.csv...');

  // load state capital names and lat/longs; can append more data :)
  d3.csv('../data/us-state-capitals.csv')
    .row( function(d) { 
      return {state: d.state, capital: d.capital, 
        latitude: +d.latitude, longitude: +d.longitude}; })
    .get( function(error, capitalsData) {
      map.stateCapitals = capitalsData;
      console.log('USMap::loadStateCapitals::loaded state capitals: ' + map.stateCapitals.length);      
  });
}


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
          if ( i < map.usPopulation.states.length) {
            return 'q' + map.quantize( map.usPopulation.states[i][0] / 40000000 );
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
                map.numberFormat( map.usPopulation.states[i][0] ) + 
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
  this.populationData.text(
    this.numberFormat( this.usPopulation.states[i][0] ) );
  this.houseSeatsData.text(d.properties.houseSeats);

  // update region data panel
  this.regionTitle.text(d.properties.name);

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
 * Draws selected state counties on state path click.
 */
USMap.prototype.drawCounties = function (stateCode, map){  

  // create state county paths
  console.log('USMap::drawCounties::' + stateCode + 
    ' counties: ' + Object.keys(this.stateCounties[stateCode].counties).length );

  var stateCountiesTopology = this.getStateCountiesTopology(stateCode);

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
 * Gets state counties topology for display on state click.
 */
USMap.prototype.getStateCountiesTopology = function(stateCode) {
  if (this.stateCounties[stateCode].topology.geometries.length > 0) {
    return this.stateCounties[stateCode].topology;
  }

  // create state counties geometry collection
  var countyKeys = Object.keys(this.stateCounties[stateCode].counties);
  console.log('USMap::getStateCountiesTopology::creating ' + stateCode +
    ' counties topology...'); // for: ' + countyKeys);
  //console.log(this.stateCounties[stateCode].counties);  
  //console.log(this.usTopology.objects.counties.geometries);

  // lazy load state counties geometries from us topology geo data
  var county;
  var countyGeo;  
  var countiesGeo = this.usTopology.objects.counties.geometries; 
  for (var i=0; i < countiesGeo.length; i++) {

    // get county geo data
    countyGeo = countiesGeo[i];
    //console.log(countyGeo.id);

    // look up county info
    county = this.stateCounties[stateCode].counties[countyGeo.id]; 
    if (county !== null && county !== undefined) {
      // set county geo data properties for tooltip display
      countyGeo.properties = county;
      // add it to the state counties topology geometries
      this.stateCounties[stateCode].topology.geometries.push(countyGeo); 
      //console.log(countyGeo);
    }
  }

  console.log('USMap::getStateCountiesTopology::created ' + stateCode + ' counties topology!');
  //console.log(this.stateCounties[stateCode].topology);

  return this.stateCounties[stateCode].topology;
}


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
  this.regionTitle.text('USA');
  this.populationData.text(
    this.numberFormat( this.usPopulation.total) );
  this.houseSeatsData.text(this.houseSeats);


  // zoom out
  this.svg.transition()
      .duration(750)
      .call(this.zoom.transform, d3.zoomIdentity);
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

