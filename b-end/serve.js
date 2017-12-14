var Server = require('ws').Server,
  port = process.env.PORT || 9030,
  ws = new Server({port: port}),
  sockets = [], sendClientData = function(){};

var request = require('sync-request')
var event = require('./databuffer/event.js')
var ipLoc = require('./databuffer/iploc.js')
var subscriber = require('./subscriber.js')

ws.on('connection', function(w, r){
  var id = r.headers['sec-websocket-key'];
  sockets[id] = w;
  console.log('New Connection id :: ', id);

  w.on('close', function() {
    var id = r.headers['sec-websocket-key'];
    delete sockets[id];
    console.log('Closing :: ', id);
  });

  sendClientData = function(data){
    try {
      for (var key in sockets) {
        sockets[key].send(JSON.stringify(data));
      }
    } catch(err) {
      console.log('Websocket exception : %s', err);
    }
  }
});

var requestCount = 0, getLocation = function(ip){
    requestCount++;
    var apiLoc = '',
     loc = JSON.parse(request('GET',
      'http://geoip.nekudo.com/api/' + apiLoc + '/' + ip).body.toString('utf-8')),
      data = {
        ip: loc.ip,
        lat: parseFloat(loc.location.latitude),
        lon: parseFloat(loc.location.longitude),
        city: loc.city,
        countryName: loc.country.name,
        countryCode: loc.country.code
      };
    requestCount--;
    return data;
 }, sendAllEvent = function(){
    var events = event.getAll();
    for(i in events){
      console.log(events[i]);
      sendClientData(events[i]);
      event.remove(events[i].timestamp);
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
  // console.log(dataEvent);

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
    timestamp: parseInt(dataEvent.timestamp),
    src: dataEvent.src,
    dst: dataEvent.dst,
    sigid: dataEvent.sig_id,
    signame: dataEvent.sig_name,
    sigpriority: dataEvent.priority,
  };
  event.push(dataEvent);
  console.info("Sending : ", dataEvent);

  // if there is not current event matched with timestamp
  !event.get(dataEvent.timestamp) && sendAllEvent();
});

// while(true){
//   setTimeout(function(){
//     console.log('lal');
//   }, 1);
// }

// var cities = [{
//     lon: 39.9,
//     lat: 116.3,
//     loc: "Peking"
//   }, {
//     lon: -21.0393996,
//     lat: -51.3561885,
//     loc: "Rio de Janeiro"
//   }, {
//     lon: 31.2,
//     lat: 121.4,
//     loc: "Shanghai"
//   }, {
//     lon: 22.2,
//     lat: 114.2,
//     loc: "Hongkong"
//   }, {
//     lon: 24.9,
//     lat: 121.5,
//     loc: "Taipei"
//   }, {
//     lon: 41.9,
//     lat: 12.4,
//     loc: "Roma"
//   }, {
//     lon: 48.8,
//     lat: 2.27,
//     loc: "france"
//   }, {
//     lon: 52.5,
//     lat: 13.5,
//     loc: "berlin"
//   }, {
//     lon: 51.6,
//     lat: 0,
//     loc: "London"
//   }, {
//     lon: 9,
//     lat: 38.8,
//     loc: "Addis Ababa"
//   }, {
//     lon: -25.7,
//     lat: 28.2,
//     loc: "Pretoria"
//   }, {
//     lon: -33.85,
//     lat: 151.21,
//     loc: "Sydney"
//   }, {
//     lon: 40.7,
//     lat: -74.01,
//     loc: "New York"
//   }, {
//     lon: 37.4,
//     lat: -121.88,
//     loc: "San Francisco"
//   }, {
//     lon: 35.7,
//     lat: 139.1,
//     loc: "Tokyo"
//   }], locals = [{
//     lon: -6.229728,
//     lat: 106.6894288,
//     loc: "Jakarta"
//   },{
//     lon: -7.2575,
//     lat: 112.7521,
//     loc: "Surabaya"
//   },{
//     lon: -8.6705,
//     lat: 115.2126,
//     loc: "Denpasar"
//   }], getRandomFloat = function() {
//   return Math.random() * (3 - 0) + 0;
// }
// var rand = function(){
//  setInterval(function(){
//       var a = Math.floor(3 * Math.random()),
//         b = Math.floor(3 * Math.random()), data = {};

//         data.src = cities[a];
//         data.dst = locals[b];
//         data.priority = getRandomFloat();
//         data.signature = "Bla bla";

//         sendClientData(data);
//     }, 410);
// };
// rand();