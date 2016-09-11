var express = require('express');
var app = express();
var path = require('path');

// __dirname will use the current path from where you run this file 
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'prototype/src')));

app.listen(8000);
console.log('Listening on port 8000');