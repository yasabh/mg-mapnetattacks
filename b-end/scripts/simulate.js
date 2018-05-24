var config = require('../database.config.js')
var mapdatadir = __dirname + '/../mapdata/';
var mysql = require('mysql')
var fs = require('fs')
var mqtt  = require('mqtt').connect('mqtt://mqtt_host')
var countryCodes = require('country-code')
var con = mysql.createConnection(config),
  run = function(date) {
    // var dirs = "2018-01-25",
    //   datedir = date.replace(/-/g, '/'),
    var queryLine = function(offset, limit){
        return "SELECT INET_NTOA(ip_src) AS src_ip, INET_NTOA(ip_dst) AS dst_ip, " +
        "signature_id AS sig_id, signature_name AS sig_name, signature_priority AS priority " +
        "FROM `event` LIMIT " + offset + ", " + limit;
      }, randomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }, offset = 0, countSend = 0, attack;

    mqtt.on('connect', function () {
      setInterval(function(){
        var randLimit = randomInt(0, 1);
        // console.log(offset, randLimit);
        con.query(queryLine(offset, randLimit), function(err, rows, fields) {
          if (err) throw err
    
          countSend += rows.length;
          for (i in rows) {
            // attack = !attack ? rows[3] : attack ;
            attack = rows[i];
            attack.timestamp = (new Date().getTime()) / 1000;
            mqtt.publish('snort/test', JSON.stringify(attack));
          }
        })
        offset += randLimit;
        // console.info("Sent:", countSend);
      }, 200);
    })

    setInterval(function(){
      console.info("Sent (per second) :", countSend);
      countSend = 0;
    }, 1000)
  };
run();