/**
 * US map data service.
 **/ 
function USMapDataService() {
  console.log('USMapDataService::created');
} // end of USMapData() constructor


/**
 * Gets US topology from ../data/us.json topoJSON file
 * with land, state, and counties boundaries
 * for zoom to state counties data load and graphs display later.
 */
USMapDataService.prototype.getUSTopology = function(onDataReady, map) {

  // load US topology with land, state, and counties boundaries
  console.log('USMapData::getUSTopology::loading ../data/us.json...');  
  d3.json('../data/us.json', function(error, usTopology) {

    if (error) {
      console.error(error);
      // TODO: show error message ???
      throw error;
    }

    onDataReady(usTopology, map);

  });
}