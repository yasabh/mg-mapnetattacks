// Pick date to generate from beginning till now
var fromDate = '2017-10-18i';

require("datejs")
var cron = require('node-cron')
var generator = require('./generator.js')
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