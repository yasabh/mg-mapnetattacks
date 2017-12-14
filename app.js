const express = require('express')
const path = require('path')
const app = express()
const db = require('./b-end/database.js')
var cp = require('child_process');
var portNumber = 8081;

cp.fork(__dirname + '/b-end/scheduler.js');
cp.fork(__dirname + '/b-end/serve.js');

app.use('/', express.static(path.join(__dirname, 'f-end')))
app.use('/mapdata', express.static(path.join(__dirname, 'mapdata')))
app.get('/signature/search', function (req, res) {
  db.handleSignatureSearch(req, res);
})
app.listen(portNumber, () => console.log('Webserver running on port ' + portNumber))