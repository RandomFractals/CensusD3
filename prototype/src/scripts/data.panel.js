/**
 * App data panel UI component.
 **/ 
function DataPanel(window) {

  // save window ref. for panel sizing on window resize
  this.window = window;

  // fixed data panel width
  this.width = 264;

  // fixed data panel top + bottom margin
  // for app toolbar, status bar, and footer content
  this.margin = 80;

  // data panel container ref for sizing on window resize
  this.dataPanel = d3.select('#data');

  // data section title ref 
  this.dataTitle = d3.select('#data-title');

  // data image ref
  this.dataImage = d3.select('#data-image');

  // data list section ref 
  this.dataList = d3.select('#data-list');

  // create list data display
  this.list = this.dataList.append('ul');

  // data table section ref 
  this.dataTable = d3.select('#data-table')
    .attr('height', this.width.innerHeight / 4);

  // data graph section ref 
  this.dataGraph = d3.select('#data-graph');

  // graph data ref for graphs type toggles
  this.graphData = {};

  // number format for display
  this.numberFormat = d3.format(',');

  // update data panel height
  this.dataPanel.attr('height', this.window.innerHeight - this.margin);

  // add window resize event handler
  this.window.addEventListener('resize', this.onWindowResize);

} // end of DataPanel() constructor



/**
 * Updates data panel and graphs section height on window resize.
 */
DataPanel.prototype.onWindowResize = function() {
  console.log('DataPanel::onWindowResize::height: ' + this.window.innerHeight);

  // update data panel containter height
  this.dataPanel.attr('height', this.window.innerHeight - this.margin);

  // TODO: redraw graphs when they are added
  // this.drawGraph()
}


/**
 * Updates app data title, region/data type image, 
 * data list and data graph with the selection region
 * or census data type geo data.
 */
DataPanel.prototype.update = function (title, 
  listData, tableData, graphData){
  console.log('DataPanel::update'); 

  // update data section title
  this.dataTitle.text(title);

  // update data section image   
  this.dataImage.attr('src', '../images/flags/' + 
    title.split(' ').join('_') + '.svg.png'); // convert spaces to _

  // update list data display
  this._updateListData(listData);

  // save graph data for table and graph types toggle render
  this.graphData = graphData;

  // update table data display
  this._updateTableData(tableData);

  // update graphs
  this._updateGraphs(graphData);
}

/*----------------- Private Data Panel Update Methods --------------------*/

/**
 * Updates data panel list data.
 */
DataPanel.prototype._updateListData = function (listData){
  console.log('DataPanel::_updateListData'); //, listData
  // create list data items for display
  var dataItems = [];
  var item;
  for (var propertyName in listData) {
    item = {id: propertyName, 
      label: propertyName.split('_').join(' '),
      data: this.numberFormat( listData[propertyName] )
    };
    dataItems.push(item)
  }

  // display list data
  this.list.selectAll('li').remove();
  this.list.selectAll('li')
    .data(dataItems)
    .enter()
    .append('li')
    .attr('id', function(d, i) { return d.id; })
    .attr('class', 'list-tem')
    .html( function(d, i) {
      return d.label + ': <span class="data-text">' + d.data + '</span>';
    });
}

/**
 * Updates table data display.
 */
DataPanel.prototype._updateTableData = function (tableData){
  console.log('DataPanel::_updateTableData:dimensions: ' + tableData.dimensions);
  //console.log( JSON.stringify(tableData.data) );
  
  // TODO: create sortable columns table 
  this.dataTable.selectAll('table').remove();
  var table = this.dataTable.append('table');
  var thead = table.append('thead');
  var tbody = table.append('tbody');
  var columns = tableData.dimensions.split(',');
  var numberFormat = d3.format(',');

  // append table header row
  thead.append('tr')
       .selectAll('th')
       .data(columns)
       .enter()
       .append('th')
       .text( function(column) { return column; } );

  // create table data rows 
  var dataRows = tbody.selectAll('tr')
      .data(tableData.data)
      .enter()
      .append('tr');

  // create table data row cells
  var dataCells = dataRows.selectAll('td')
      .data( function(row) {
        return columns.map( function(column) {
          var dataText = row[column];
          if (column.indexOf('+') >= 0) {
            // format number value
            dataText = numberFormat( row[column.substring(1)] );
          }
          return {column: column, value: dataText};
        });
      })
      .enter()
      .append('td')
      .html( function(d) {
        return d.value; 
      });
    
  return table;
}


/**
 * Updates data panel graphs.
 */
DataPanel.prototype._updateGraphs = function (graphData){
  console.log('DataPanel::_updateGraphs:dimensions: ' + graphData.dimensions);
  //console.log( JSON.stringify(graphData.data) );

  // TODO: create bar, line, area, etc. data graphs for graph data display 
}

