/**
 * Bar table data panel UI component.
 **/ 
function BarTable(window) {

  // save window ref. for bar table sizing 
  // and redraw on window resize
  this.window = window;

  // fixed data panel width
  this.width = 264;

  // fixed data panel top + bottom margin
  // for app toolbar, status bar, and footer content
  this.margin = 80;

  // data table section ref 
  this.dataTable = d3.select('#data-table')
    .attr('height', this.width.innerHeight / 4);

  // table sort column 
  this.sortColumn = null;

  // number format for display
  this.numberFormat = d3.format(',');

} // end of BarTable() constructor


/**
 * Updates bar table data display.
 */
BarTable.prototype.redraw = function (tableData, sortOn){
  console.log('BarTable::redraw: ' + tableData.dimensions +
    ' sortOn: ' + sortOn);
  //console.log( JSON.stringify(tableData.data) );

  // create data table elements
  this.dataTable.selectAll('table').remove();
  var table = this.dataTable.append('table');
  var thead = table.append('thead');
  var tbody = table.append('tbody');
  var columns = tableData.dimensions.split(',');
  var numberFormat = d3.format(',');

  // create pop data bar x scale
  var x = d3.scaleLinear()
    .domain([0, d3.max(tableData.data, function(d) {return d.population} ) ])
    .range([0, 100]);

  // append table header row
  var barTable = this;  
  thead.append('tr')
       .selectAll('th')
       .data(columns)
       .enter()
       .append('th')
       .text( function(column) { 
         return column.replace('+', ''); // strip out + 
        })
       .on('click', function(d) {
         return barTable.redraw(tableData, 
          d.replace('+', '')); // sort column name - + for number columns
       });

  // create table data rows 
  var tr = tbody.selectAll('tr')
      .data( tableData.data.sort( function(a,b){
        return d3.descending(a.population, b.population);
      }))
      .enter()
      .append('tr');

  // create table data row cells
  var td = tr.selectAll('td')
      .data( function(row) {
        return columns.map( function(column) {
          var html = row[column];
          if (column.indexOf('+') >= 0) {
            var propertyName = column.substring(1); // strip out +
            var barWidth = x( row[propertyName] );
            // format number property data and gen. horizontal bar html
            html = numberFormat( row[propertyName] ) +
            '<div class="bar" style="width: ' + barWidth + 'px"></div>';
          }
          return {column: column, html: html};
        });
      })
      .enter()
      .append('td')
      .html( function(d) {
        return d.html; 
      });

  // simple strings and numbs sort
  var sort = function sort(a, b) {
    if (typeof a == 'number') {
      return a > b ? 1 : a == b ? 0 : -1;
    }
    return a.localeCompare(b); 
  }

  // update sort  
  if (sortOn != null) {
    if (sortOn != table.sortColumn) {
      tr.sort( function(a, b) { 
        return sort(a[sortOn], b[sortOn]); 
      });
      barTable.sortColumn = sortOn;
    }
    else {
      tr.sort( function(a,b) { 
        return sort(b[sortOn], a[sortOn]);
      });
      panel.sortColumn = null;
    }

    // update cells
    td.html( function(d, i) {
      return d.html;
    });
  }
    
  return table;

} // end of BarTable.redraw()
