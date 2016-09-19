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

  // number format for display
  this.numberFormat = d3.format(',');

  // data panel bar table
  this.barTable = new BarTable(this.window);

  // data panel bar graph
  this.barGraph = new BarGraph(this.window);

  // update data panel height
  this.dataPanel.attr('height', this.window.innerHeight - this.margin);

  // add window resize event handler
  var panel = this;
  this.window.addEventListener('resize', function() {
    console.log('DataPanel::onWindowResize::height: ' + this.window.innerHeight);
    // update data panel containter height
    panel.dataPanel.attr('height', this.window.innerHeight - panel.margin);

    // TODO: redraw graphs when they are added
    // panel.drawGraph()
  });

} // end of DataPanel() constructor


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
  this.redraw(listData);

  // redraw bar table data display
  this.barTable.redraw(tableData, null); // sort column

  // update graphs
  this.barGraph.redraw(graphData);

  // TODO: add line and area graphs here
}


/**
 * Updates data panel list data.
 */
DataPanel.prototype.redraw = function (listData){
  console.log('DataPanel::redraw'); //, listData
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
    .attr('class', 'list-item')
    .html( function(d, i) {
      return d.label + ': <span class="data-text">' + d.data + '</span>';
    });
}

