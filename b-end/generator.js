var db = require('./database.js')
var mapdatadir = __dirname + '/../mapdata/';
var mysql = require('mysql')
var fs = require('fs')
var con = mysql.createConnection(db.config),
  doJobJson = function(date) {
    var dirs = date.split('-'),
      datedir = date.replace(/-/g, '/'),
      query = "SELECT " +
      " m1.latitude AS ip_src_latitude, " +
      " m1.longitude AS ip_src_longitude, " +
      " m1.city AS ip_src_city, " +
      " m1.stateprov AS ip_src_stateprov, " +
      " m1.country AS ip_src_country, " +
      " m2.latitude AS ip_dst_latitude, " +
      " m2.longitude AS ip_dst_longitude, " +
      " m2.city AS ip_dst_city, " +
      " m2.stateprov AS ip_dst_stateprov, " +
      " m2.country AS ip_dst_country, " +
      " d.signature_name AS sig_name, " +
      " d.signature_priority AS sig_priority, " +
      " d.signature_id AS sig_id, " +
      " d.date " +
      "FROM " +
      " daily_event_aggregation d " +
      "JOIN ip_map m1 ON d.ip_src > 0 AND m1.country != '' AND m1.ip_addr = d.ip_src " +
      "JOIN ip_map m2 ON d.ip_dst > 0 AND m2.country != '' AND m2.ip_addr = d.ip_dst " +
      "WHERE d.date = '" + date + "' " +
      "GROUP BY " +
      " ip_src_stateprov, " +
      " ip_dst_stateprov, " +
      " d.signature_name";
    if (!fs.existsSync(mapdatadir + dirs[0])) {
      fs.mkdirSync(mapdatadir + dirs[0]);
      console.log('Directory created : ' + dirs[0]);
    }
    if (!fs.existsSync(mapdatadir + dirs[0] + '/' + dirs[1])) {
      fs.mkdirSync(mapdatadir + dirs[0] + '/' + dirs[1]);
      console.log('Directory created : ' + dirs[0] + '/' + dirs[1]);
    }

    currentProcess = true;
    console.log('Generating : ' + datedir + '.json');
    con.query(query, function(err, rows, fields) {
      if (err) throw err
      currentProcess = false;

      var attacks = [];
      for (i in rows) {
        attacks[i] = {};
        attacks[i].src = {};
        attacks[i].src.lon = rows[i].ip_src_longitude;
        attacks[i].src.lat = rows[i].ip_src_latitude;
        attacks[i].src.loc = rows[i].ip_src_city + ', ' + rows[i].ip_src_country;
        attacks[i].dst = {};
        attacks[i].dst.lon = rows[i].ip_dst_longitude;
        attacks[i].dst.lat = rows[i].ip_dst_latitude;
        attacks[i].dst.loc = rows[i].ip_dst_city + ', ' + rows[i].ip_dst_country;
        attacks[i].sigid = rows[i].sig_id;
        attacks[i].signame = rows[i].sig_name;
        attacks[i].sigpriority = rows[i].sig_priority;
      }

      var data = JSON.stringify(attacks);
      fs.writeFileSync(mapdatadir + datedir + '.json', data)
      console.log(' File generated : ' + datedir + '.json');
    })
  };
module.exports = {
  doJobJson: doJobJson
}