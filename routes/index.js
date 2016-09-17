var express = require('express');
var router = express.Router();
var path = require('path');
var async = require('async');
var http = require('http');
var CensusDataKey = process.env.CENSUS_DATA_API_KEY;

// Expose tweets endpoint for ang2 app
router.get('/census/population/:query?', function(request, response, next) {
  // inject search query from client
  var query = 'us';
  if (request.params.query) {
    query = request.params.query;
  }
  log('population query: ', query );
  var year = 2015;  
  var queryParams = {
    year: year,
    get: 'POP,GEONAME',
    for: query,
    key: CensusDataKey
  }

  // get census data
  var requestPath = '/data/' + queryParams.year +
                '/pep/population' +
                '?get=' + queryParams.get +
                '&for=' + queryParams.for + ':*' +
                '&key=' + queryParams.key; 
  http.request({
        host: 'api.census.gov',
        method: 'GET',
        path: requestPath
    }, onCensusDataResponse).end();

});


/**
 * Processes census data service response.
 */
function onCensusDataResponse(response) {
  var responseData = '';
  response.on('data', function(chunk) {
    responseData += chunk;
  });

  response.on('end', function() {
    log('response: ', responseData);
  });
}

/**
 * Quick obj log func.
 */
function log(msg, obj) {
  console.log(msg + JSON.stringify(obj, null, 2) );         
}


module.exports = router;
