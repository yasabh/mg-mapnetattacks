// Pick date to generate from beginning till now
var fromDate = '2018-01-01';

require("datejs")
var cron = require('node-cron')
var generator = require('./generator.js')
var child = require('child_process')
var getDateFormattedStr = function(dt) {
    return dt.toString("yyyy-MM-dd");
  },
  generateFromDate = function(date) {
    var dt = new Date(date),
      dtToCompare = new Date();
    while (dt <= dtToCompare) {
      var dtStr = getDateFormattedStr(dt);
      generator.doJobJson(dtStr);
      dt.setDate(dt.getDate() + 1);
    }
  }
!isNaN((new Date(fromDate)).getTime()) & generateFromDate(fromDate);
// Crob job every 1 hour
cron.schedule('0 * * * *', function() {
  var dtStr = getDateFormattedStr(new Date());
  generator.doJobJson(dtStr);
});
// Crob job every 1 week in Sunday
cron.schedule('0 0 * * 0', function() {
  var updateCommand = "node " + __dirname + "/../node_modules/geoip-lite/scripts/updatedb.js";
  console.log("SCHEDULER : It is time to update geoip database..");
  console.log(child.execSync(updateCommand, { encoding: 'utf8' }));
});