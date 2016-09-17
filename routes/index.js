var express = require('express');
var router = express.Router();
var path = require('path');
var async = require('async');

var CensusDataKey = process.env.CENSUS_DATA_API_KEY;

// Expose tweets endpoint for ang2 app
router.get('/app/population/:query?', function(request, response, next) {
  // inject search query from client
  var query = 'USA';
  if (request.params.query) {
    query = request.params.query;
  }
  log('population query: ', query );
});



/**
 * Quick obj log func.
 */
function log(msg, obj) {
  console.log(msg + JSON.stringify(obj, null, 2) );         
}


module.exports = router;
