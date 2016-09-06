/**
 * Main app module.
 */
function CensusD3(window) {
  this.window = window;
  this.map = new USMap(this.window); // for map sizing
}
