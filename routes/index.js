var express = require('express');
var router = express.Router();
var path = require('path');
var async = require('async');
var http = require('http');
var CensusDataKey = process.env.CENSUS_DATA_API_KEY;

/**
 * Gets population data from http://api.census.gov/data service.
 */
router.get('/census/population/:query?', function(request, response, next) {
  // inject search query from client
  var query = 'us:*';
  if (request.params.query) {
    query = request.params.query;
  }
  if (query.indexOf(':') < 0) {
    // append :*
    query += ':*';
  }
  log('census/population query: ', query );
  var year = 2015;  
  var queryParams = {
    year: year,
    get: 'POP,GEONAME,REGION,DENSITY',
    for: query,
    key: CensusDataKey
  }

  // get census data
  var requestPath = '/data/' + queryParams.year +
                '/pep/population' +
                '?get=' + queryParams.get +
                '&for=' + queryParams.for +
                '&key=' + queryParams.key; 
  http.request({
        host: 'api.census.gov',
        method: 'GET',
        path: requestPath
    }, 
    function (dataResponse) {
      var responseData = '';
      dataResponse.on('data', function(chunk) {
        responseData += chunk;
      });
      dataResponse.on('end', function() {
        var data = JSON.parse(responseData);
        log('response: ', data);
        response.send(data);
      });      
    }).end();

});


/**
 * Quick obj log func.
 */
function log(msg, obj) {
  console.log(msg + JSON.stringify(obj, null, 2) );         
}


module.exports = router;
