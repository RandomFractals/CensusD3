/**
 * Main us map data viz app module.
 */
function USMapApp(window) {
  this.window = window;
  this.map = new USMap( new USMapDataService(), // for map geo data
    this.window, 264); // windonw + margin for map and data side panel resizing
}
