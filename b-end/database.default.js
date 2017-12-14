var mysql = require('mysql')
var config = {
    connectionLimit: 30, //important
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '1dS1Rtii5432',
    database: 'MG17_1',
    debug: false
  },
  pool = mysql.createPool(config),
  errorResponse = {
    "code": 100,
    "status": "Error in connection database"
  },
  handleSignatureSearch = function(req, res) {
    var query = 'SELECT DISTINCT signature_id AS id, signature_name AS name ' +
      'FROM monthly_event_aggregation ' +
      "WHERE date = '" + req.query.date + "' " +
      "AND signature_name LIKE '%" + req.query.q + "%'";

    pool.getConnection(function(err, connection) {
      if (err) {
        connection.release();
        res.json(errorResponse);
        return;
      }
      console.log('Connected as id ' + connection.threadId);
      connection.query(query, function(err, rows) {
        connection.release();
        if (!err) {
          res.json(rows);
        }
      });
      connection.on('error', function(err) {
        res.json(errorResponse);
        return;
      });
    });
  }
module.exports = {
  config: config,
  handleSignatureSearch: handleSignatureSearch,
}