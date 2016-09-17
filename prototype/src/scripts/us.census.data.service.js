/**
 * US census data service.
 * 
 * TODO: some data can be lazy loaded later.
 **/ 
function USCensusDataService() {
  console.log('USCensusDataService::created');
}


/**
 * Gets the latest (2015) USA states population data from ../data/us-state-population.csv.
 */
USCensusDataService.prototype.getUSPopulationData = function(onDataReady, map) {
  console.log('USCensusDataService::getUSPopulationData::loading ../data/us-state-population.csv...');
  d3.csv('../data/us-state-population.csv')
    .row( function(d) { 
      return {
        population: +d.population, // + to convert to numbers :)
        state: d.state,        
        region: d.region,
        coast: d.coast 
      }; 
    }) 
    .get( function(error, usPopulation) {
      // update map comp.
      //console.log(usPopulation);
      onDataReady(usPopulation, map);
  });  
}


/**
 * Gets states population data from census data service.
 */
USCensusDataService.prototype.getStatesPopulation = function(onDataReady, map) {
  console.log('USCensusDataService::getStatesPopulation::loading ./census/population/state:*');  
  d3.json('./census/population/state:*', function(responseData) {
    console.log('USCensusDataService::getStatesPopulation::loaded states population: count: ' + 
      (responseData.length - 1) ); // - header record

    // format results
    var statesPopData = [];
    var statePopulation = {};
    var stateData;
    var geoNames = [];
    // Note: response data contains ['POP', 'GEONAME', 'REGION', 'DENSITY', 'state'] header record
    for (var i=1; i < responseData.length - 1; i++) { // skip 1st metadata record & last (Puerto Rico)
      stateData = responseData[i];
      // Note: geoname format: county, state, region, coast
      geoNames = stateData[1].split(',');
      statePopulation = {
        population: Number(stateData[0]),
        state: geoNames[0],
        regionId: stateData[2],
        density: stateData[3],
        stateId: stateData[4],
        regionName: geoNames[2].substring(1),
        coast: geoNames[3].substring(1)
      };
      statesPopData.push( statePopulation );
    }

    //console.log(statesPopData);
   
    // update map comp.
    onDataReady(statesPopData, map);
  });
}


/**
 * Gets state counties population data from census data service.
 */
USCensusDataService.prototype.getStateCountiesPopulation = function(stateId, onDataReady, map) {
  var query = 'county:*&in=state:' + stateId;
  console.log('USCensusDataService::getStateCountiesPopulation::loading ' +
    './census/population/' + query);  
  d3.json('./census/population/' + query, function(responseData) {
    console.log('USCensusDataService::getStatesPopulation::loaded state counties population: count: ' + 
      (responseData.length - 1) ); // - header record

    // format results
    var statePopData = [];
    var countyPopulation = {};
    var countyData = [];
    var geoNames = [];
    // Note: response data contains ['POP', 'GEONAME', 'REGION', 'DENSITY', 'state', 'county'] header record
    for (var i=1; i < responseData.length; i++) { // skip 1st metadata record
      countyData = responseData[i];
      // Note: geoname format: county, state, region, coast
      geoNames = countyData[1].split(',');
      countyPopulation = {
        population: Number(countyData[0]),
        county: geoNames[0],
        regionId: countyData[2],
        density: countyData[3],
        stateId: countyData[4],
        stateName: geoNames[1].substring(1), // strip out leading white space
        countyId: countyData[5],
        regionName: geoNames[2].substring(1),
        coast: geoNames[3].substring(1)
      };
      statePopData.push( countyPopulation );
    }

    //console.log(statePopData);

    // update map comp.
    onDataReady(statePopData, map);
  });
}
