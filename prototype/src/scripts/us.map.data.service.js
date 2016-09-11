/**
 * US map geo data service.
 * 
 * TODO: some data can be lazy loaded later.
 **/ 
function USMapDataService() {
  console.log('USMapDataService::created');
}


/**
 * Gets 642Kb US topology from ../data/us.json topoJSON file
 * with land, state, and counties boundaries
 * for zoom to state counties map display.
 */
USMapDataService.prototype.getUSTopology = function(onDataReady, map) {

  // load US topology with land, state, and counties boundaries
  console.log('USMapDataService::getUSTopology::loading ../data/us.json...');
  d3.json('../data/us.json', function(error, usTopology) {
    if (error) {
      console.error(error);
      throw error;
    }
    // update map comp.
    onDataReady(usTopology, map);
  });
}



/**
 * Gets light 90+kb ../data/us-states.json geo data
 * for initial usa states map display.
 */
USMapDataService.prototype.getStatesGeoData = function(onDataReady, map) {
  console.log('USMapDataService::getStatesGeoData::loading ../data/us-states.json...');  
  d3.json('../data/us-states.json', function(statesGeoData) {
    console.log('USMapDataService::getStatesGeoData::loaded states geo data: ' + 
      statesGeoData.features.length);   
    // update map comp.
    onDataReady(statesGeoData.features, map);
  });
}


/**
 * Gets US counties FIPS codes and names from ../data/us-counties.json file
 * for zoom to state counties data load and graphs display later.
 */
USMapDataService.prototype.getUSCounties = function(usTopology, onDataReady, map) {

  // load US counties data
  console.log('USMapDataService::getUSCounties::loading ../data/us-counties.json...');
  d3.json('../data/us-counties.json', function(error, usCounties) {
    if (error) {
      console.error(error);
      throw error;
    }
    //console.log(usCounties);
    var state, lastState = '';
    var stateCounties = {};
    var stateCounty;
    var countyCount = 0;
    for (var countyId in usCounties) {
      // get county state
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
            bbox: usTopology.objects.counties.bbox,
            geometries: []
          }
        };
        //console.log('USMapDataService::getUSCounties::adding counties for state: ' + state);
      }
      // set county id and add it to the state counties collection
      usCounties[countyId].id = countyId;
      stateCounties[state].counties[Number(countyId)] = usCounties[countyId]; 
      countyCount++;
    }

    console.log('USMapDataService::getUSCounties::loaded counties: ' + countyCount);
    console.log('USMapDataService::getUSCounties::loaded county states: ' + 
      Object.keys(stateCounties).length );
    //console.log(stateCounties);

    // update map comp.
    onDataReady(stateCounties, map);
  });
} // end of getUSCounties()



/**
 * Gets state counties topology from usTopology
 * for plotting state counties paths on state click.
 */
USMapDataService.prototype.getStateCountiesTopology = 
  function(usTopology, stateCounties, stateCode) {
  if (stateCounties[stateCode].topology.geometries.length > 0) {
    // state counties topology already loaded
    return stateCounties[stateCode].topology;
  }

  // create state counties geometry collection
  var countyKeys = Object.keys(stateCounties[stateCode].counties);
  console.log('USMapDataService::getStateCountiesTopology::creating ' + stateCode +
    ' counties topology...'); // for: ' + countyKeys);
  //console.log(stateCounties[stateCode].counties);  
  //console.log(usTopology.objects.counties.geometries);

  // lazy load state counties geometries from us topology geo data
  var county;
  var countyGeo;  
  var countiesGeo = usTopology.objects.counties.geometries; 
  for (var i=0; i < countiesGeo.length; i++) {
    // get county geo data
    countyGeo = countiesGeo[i];
    //console.log(countyGeo.id);

    // look up county info
    county = stateCounties[stateCode].counties[countyGeo.id]; 
    if (county !== null && county !== undefined) {
      // set county geo data properties for tooltip display
      countyGeo.properties = county;
      // add it to the state counties topology geometries
      stateCounties[stateCode].topology.geometries.push(countyGeo); 
      //console.log(countyGeo);
    }
  }

  console.log('USMapDataService::getStateCountiesTopology::created ' + 
    stateCode + ' counties topology!');
  //console.log(stateCounties[stateCode].topology);

  return stateCounties[stateCode].topology;
}
