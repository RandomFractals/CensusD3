/**
 * Main USA map data viz app module.
 */
function USMapApp(window) {

  // get window ref of map sizing
  this.window = window;

  // create app status bar
  this.statusBar = new StatusBar();

  // create data panel for census data and graphs display
  this.dataPanel = new DataPanel(264); // fixed panel width

  // create us map
  this.map = new USMap( new USMapDataService(), // for map geo data
    this.statusBar, // for app message updates
    this.dataPanel, // for census data and graphs display
    this.window); // windonw for map sizing on window resize
}
