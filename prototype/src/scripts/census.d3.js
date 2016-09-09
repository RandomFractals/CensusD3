/**
 * Main app module.
 */
function CensusD3(window) {
  this.window = window;
  this.map = new USMap(this.window, 264); // windonw + margin for map and data side panel resizing
}
