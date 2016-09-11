/**
 * Main us map data viz app module.
 */
function USMapApp(window) {

  // get window ref of map sizing
  this.window = window;

  // creates app status bar
  this.statusBar = new StatusBar();

  // create us map
  this.map = new USMap( new USMapDataService(), // for map geo data
    this.statusBar, // for app message updates
    this.window, 264); // windonw + margin for map and data side panel resizing
}
