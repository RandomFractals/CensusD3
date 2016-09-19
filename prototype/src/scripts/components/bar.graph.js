/**
 * Bar graph data panel UI component.
 **/ 
function BarGraph(window) {

  // save window ref. for graph containter 
  // sizing and redraw on app window resize
  this.window = window;

  // fixed data panel width
  this.width = 264;

  // fixed app header + footer + table data vertical spacing margin
  this.margin = 80 + 264; 

  // data graph section ref 
  this.dataGraph = d3.select('#data-graph');

  // graph data ref for graphs type toggles
  this.graphData = {};

  // number format for display
  this.numberFormat = d3.format(',');

  // add window resize event handler
  var graphContainer = this;
  this.window.addEventListener('resize', function() {
    console.log('BarGraph::onWindowResize::height: ' + this.window.innerHeight);
    // update bar grapth panel containter height
    graphContainer.attr('height', this.window.innerHeight - graphContainer.margin);

    // TODO: redraw graphs when they are added
    // graphContainer.redraw()
  });

} // end of BarGraph() constructor


/**
 * Updates bar graph data display.
 */
BarGraph.prototype.redraw = function (graphData){
  console.log('BarGraph::redraw:dimensions: ' + graphData.dimensions);
  //console.log( JSON.stringify(graphData.data) );

  // TODO: create bar, line, area, etc. data graphs for graph data display 
}

