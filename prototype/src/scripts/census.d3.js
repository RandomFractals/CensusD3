/**
 * Main app module.
 */
function CensusD3(window) {
  this.window = window;
  this.map = new USMap(this.window);
}


/**
 * Loads us map and initial data.
 */
CensusD3.prototype.load = function() {

  // load US topology
  this.map.load();

  // TODO: load some census data here
}

