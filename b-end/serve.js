var Server = require('ws').Server,
  port = process.env.PORT || 9030,
  ws = new Server({port: port}),
  sockets = [], sendClientData = function(){};

// var request = require('sync-request')
var cron = require('node-cron')
var geoip = require('geoip-lite')
var countryCodes = require('country-code')
var subscriber = require('./subscriber.js')
var event = require('./databuffer/event.js')
var ipLoc = require('./databuffer/iploc.js')
var stats = require('./databuffer/statistic.js')

// Clear stats every beginning day at 12pm
cron.schedule('0 0 * * *', function() {
  stats.clear();
});

var clients = 0, incomingEvents = 0;
ws.on('connection', function(w, r){
  var id = r.headers['sec-websocket-key'];
  sockets[id] = w;
  console.log('WEBSOCKET : New Connection id', id + ' : clients ' + (++clients));

  setTimeout(function(){
    var data = { type: 'stats', data: stats.getLimit(10)};
    // console.info("Sending on first connection =>", data);
    sendClientData(data);
  }, 1500);

  w.on('close', function() {
    var id = r.headers['sec-websocket-key'];
    delete sockets[id];
    console.log('WEBSOCKET : Closing id', id + ' : clients ' + (--clients));
  });
  
  w.on('error', () => console.log('WEBSOCKET : Error'));

  sendClientData = function(data){
    try {
      for (var key in sockets) {
        if(!sockets[key]) return;
        sockets[key].send(JSON.stringify(data));
      }
    } catch(err) {
      console.log('WEBSOCKET : Exception %s', err);
    }
  }
});

var getLocation = function(ip){
    // var apiLoc = '',
    //  loc = JSON.parse(request('GET',
    //   'http://geoip.nekudo.com/api/' + apiLoc + '/' + ip).body.toString('utf-8')),
    //   data = {
    //     ip: loc.ip,
    //     lat: parseFloat(loc.location.latitude),
    //     lon: parseFloat(loc.location.longitude),
    //     city: loc.city,
    //     countryName: loc.country.name,
    //     countryCode: loc.country.code
    //   };
    var loc = geoip.lookup(ip), isNull = !loc,
      countryCode = isNull ? '' : countryCodes.find({alpha2: loc.country}),
      data = {
        ip: ip,
        lat: isNull ? null : loc.ll[0],
        lon: isNull ? null : loc.ll[1],
        city: isNull ? '' : loc.city,
        countryName: (!isNull && !!countryCode ? countryCode.name : ''),
        countryCode: isNull ? '' : loc.country
      };
    return data;
 }, sendAllEvents = function(){
    var events = event.getAll();
    event.clear();

    var processedEvents = 0;
    events.forEach(function(item){
      processedEvents += item.count;
    })
    console.info("incoming: " + incomingEvents + " processed: " + processedEvents + " unique: " + events.length);
    incomingEvents = 0;
    // console.info("Events =>", events);

    // if exists
    if(!!events.length){
      // console.info("Sending statistics =>", stats);
      sendClientData({ type: 'stats', data: stats.getLimit(10)});
      // console.info("Sending events =>", events);
      for(i in events){
        sendClientData({ type: 'event', data: events[i] });
      }
    }
 };

subscriber.consume.on('message', function (message) {
  try {
    var data = JSON.parse(message.value),
      dataEvent = JSON.parse((new Buffer.from(data.payload, 'base64')).toString());
  } catch(e){
    console.info(' Warning ::', 'Unexpected value in JSON');
    return;
  }
  // console.log("New data is coming.");

  var ipSrc = ipLoc.get(dataEvent.src_ip);
  if(!!ipSrc){
    dataEvent.src = ipSrc;
  }else{
    dataEvent.src = getLocation(dataEvent.src_ip);
    ipLoc.push(dataEvent.src);
  }

  var ipDst = ipLoc.get(dataEvent.dst_ip);
  if(!!ipDst){
    dataEvent.dst = ipDst;
  }else{
    dataEvent.dst = getLocation(dataEvent.dst_ip);
    ipLoc.push(dataEvent.dst);
  }

  dataEvent = {
    // timestamp: parseInt(dataEvent.timestamp),
    timestamp: dataEvent.timestamp,
    src: dataEvent.src,
    dst: dataEvent.dst,
    sigid: dataEvent.sig_id,
    signame: dataEvent.sig_name,
    sigpriority: dataEvent.priority,
  };

  if(!dataEvent.signame || !dataEvent.src.ip || !dataEvent.dst.ip) return;
  event.push(dataEvent);
  stats.push(dataEvent);
  incomingEvents++;
  // console.info("Events =>", dataEvent);
});

setInterval(function(){
  sendAllEvents();
}, 1000);