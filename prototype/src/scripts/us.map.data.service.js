/**
 * Sateful US map geo data service.
 * 
 * TODO: some data can be lazy loaded later.
 **/ 
function USMapDataService() {
  // US topology TopoJSON with land, states, and all counties
  this.usTopology = {};  

  // us state counties with names, fips codes, 
  // and topojson for drawing state counties path
  // keyed by state code/abbreviation
  this.stateCounties = {};

  console.log('USMapDataService::created');
}


/**
 * Gets US topology from ../data/us.json topoJSON file
 * with land, state, and counties boundaries
 * for zoom to state counties data load and graphs display later.
 */
USMapDataService.prototype.getUSTopology = function(onDataReady, map) {

  // load US topology with land, state, and counties boundaries
  console.log('USMapDataService::getUSTopology::loading ../data/us.json...');  
  d3.json('../data/us.json', function(error, usTopology) {
    if (error) {
      console.error(error);
      throw error;
    }

    // save it for state counties geo data load and topojson mapping later
    this.usTopology = usTopology;

    // update map comp.
    onDataReady(usTopology, map);
  });
}


/**
 * Gets US counties FIPS codes and names from ../data/us-counties.json file
 * for zoom to state counties data load and graphs display later.
 */
USMapDataService.prototype.getUSCounties = function(onDataReady, map) {

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
            bbox: this.usTopology.objects.counties.bbox,
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

    // save it for state counties topojson inject/mapping later
    this.stateCounties = stateCounties;

    // update map comp.
    onDataReady(stateCounties, map);
  });
}
