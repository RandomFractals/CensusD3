/**
 * App data panel UI component.
 **/ 
function DataPanel(width) {

  // fixed data panel width
  this.width = width;

  // data section title ref 
  this.dataTitle = d3.select('#dataTitle');

  // data image ref
  this.dataImage = d3.select('#dataImage');

  // data list section ref 
  this.dataList = d3.select('#dataList');

  // data graph section ref 
  this.dataGraph = d3.select('#dataGraph');

  // number format for display
  this.numberFormat = d3.format(',');

} // end of DataPanel() constructor


/**
 * Updates app data title, region/data type image, 
 * data list and data graph with the selection region
 * or census data type geo data.
 */
DataPanel.prototype.update = function (title, listData, graphData){
  console.log('DataPanel::update', listData, graphData);

  // update data section title
  this.dataTitle.text(title);

  // update data section image   
  this.dataImage.attr('src', '../images/flags/' + 
    title.split(' ').join('_') + '.svg.png'); // convert spaces to _

  // TODO: gen ul/li for list data display
  this.dataList.text( JSON.stringify(listData) );

  // TODO: create data graph for graph data display
  this.dataGraph.text('[todo: create data.graph UI component]\n' +
    JSON.stringify(graphData) );
}

