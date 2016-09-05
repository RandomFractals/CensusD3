/**
 * Main app module.
 */
function CensusD3() {
  this.map = new USMap(720, 480); // widht, height
}


/**
 * Loads us map and initial data.
 */
CensusD3.prototype.load = function() {

  // load US topology
  this.map.load();
  
  // TODO: load some census data here
}

