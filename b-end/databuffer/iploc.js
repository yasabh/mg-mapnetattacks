var iplocs = [], get = function(ip){
  var dtStart = new Date(),
   d = iplocs.filter(function(o){ return o.ip == ip })[0],
   time = new Date() - dtStart;
  if(time > 100){
    iplocs = [];      
    console.log(" Warning!! "
     + "IP Locations database cleared : " + size());
  };
  return d;
}, size = function(){
  return iplocs.length;
}, push = function(d){
  return !get(d.ip) && !!iplocs.push(d);
}

module.exports = {
  get: get,
  size: size,
  push: push
}