var config = require('./database.config.js')
var mapdatadir = __dirname + '/../mapdata/';
var mysql = require('mysql')
var fs = require('fs')
var countryCodes = require('country-code')
var con = mysql.createConnection(config),
  doJobJson = function(date) {
    var dirs = date.split('-'),
      datedir = date.replace(/-/g, '/'),
      queryLine = "SELECT " +
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
        " d.signature_name",
      queryStats = "(SELECT 'csrc' AS type, '' AS name, m.country AS code, '' AS city, " +
        "SUM(counter) count FROM daily_event_aggregation d JOIN ip_map m ON d.ip_src > 0 " +
        "AND m.country != '' AND m.ip_addr = d.ip_src WHERE date = '" + date + "' GROUP BY " +
        "m.country ORDER BY count DESC LIMIT 10) UNION (SELECT 'cdst' AS type, '' AS name, " +
        "m.country AS code,'' AS city, SUM(counter) count FROM daily_event_aggregation d " +
        "JOIN ip_map m ON d.ip_dst > 0 AND m.country != '' AND m.ip_addr = d.ip_dst WHERE " +
        "date = '" + date + "' GROUP BY m.country ORDER BY count DESC LIMIT 10) UNION (SELECT " +
        "'isrc' AS type, INET_NTOA(ip_src) AS name, country AS location, m.city AS city, " +
        "SUM(counter) count FROM daily_event_aggregation d JOIN ip_map m ON d.ip_src > 0 " +
        "AND m.country != '' AND m.ip_addr = d.ip_src WHERE date = '" + date + "' GROUP BY " +
        "ip_src ORDER BY count DESC LIMIT 10) UNION (SELECT 'idst' AS type, INET_NTOA(ip_dst) " +
        "AS name, country AS location, m.city AS city, SUM(counter) count FROM daily_event_aggregation d " +
        "JOIN ip_map m ON d.ip_dst > 0 AND m.country != '' AND m.ip_addr = d.ip_dst WHERE date = '" + 
        date + "' GROUP BY ip_dst ORDER BY count DESC LIMIT 10) UNION (SELECT 'sign' AS type, " +
        "signature_name AS name, signature_id AS id, '' AS city, SUM(counter) count FROM " +
        "daily_event_aggregation WHERE date = '" + date + "' GROUP BY signature_name ORDER BY " +
        "count DESC LIMIT 10)";

    if (!fs.existsSync(mapdatadir + dirs[0])) {
      fs.mkdirSync(mapdatadir + dirs[0]);
      console.log('Directory created : ' + dirs[0]);
    }
    if (!fs.existsSync(mapdatadir + dirs[0] + '/' + dirs[1])) {
      fs.mkdirSync(mapdatadir + dirs[0] + '/' + dirs[1]);
      console.log('Directory created : ' + dirs[0] + '/' + dirs[1]);
    }

    console.log('Generating : ' + datedir + '.json');
    con.query(queryLine, function(err, rows, fields) {
      if (err) throw err

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

    console.log('Generating : ' + datedir + '-stats.json');
    con.query(queryStats, function(err, rows, fields) {
      if (err) throw err

      var csrc = [], cdst = [], isrc = [], idst = [], sign = [];
      for (var i = 0; i < rows.length; i++) {
        var type = rows[i].type;
        delete rows[i].type;

        if(['csrc', 'cdst'].indexOf(type) > -1){          
          rows[i].name = countryCodes.find({alpha2: rows[i].code}).name;
        } else if(['isrc', 'idst'].indexOf(type) > -1){
          rows[i].location = rows[i].city + ', ' + countryCodes.find({alpha2: rows[i].code}).name
            + ' (' + rows[i].code + ')';
          delete rows[i].code;
        } else {
          rows[i].id = rows[i].code;
          delete rows[i].code;
        }
        delete rows[i].city;

        switch(type){
          case 'csrc':
            csrc.push(rows[i]);
            break;
          case 'cdst':
            cdst.push(rows[i]);
            break;
          case 'isrc':
            isrc.push(rows[i]);
            break;
          case 'idst':
            idst.push(rows[i]);
            break;
          case 'sign':
            sign.push(rows[i]);
            break;
        }
      }

      var results = {
        csrc: csrc,
        cdst: cdst,
        isrc: isrc,
        idst: idst,
        sign: sign
      }, data = JSON.stringify(results);
      fs.writeFileSync(mapdatadir + datedir + '-stats.json', data)
      console.log(' File generated : ' + datedir + '-stats.json');
    })
  };
module.exports = {
  doJobJson: doJobJson
}