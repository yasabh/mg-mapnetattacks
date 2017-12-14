var data = [], get = function(ip){
  var dtStart = new Date(),
   d = data.filter(function(o){ return o.ip == ip })[0],
   time = new Date() - dtStart;
  if(time > 100){
    data = [];      
    console.log(" Warning!! "
     + "IP Locations database cleared : " + size());
  };
  return d;
}, size = function(){
  return data.length;
}, push = function(d){
  // console.info("Data: ",data);
  return !get(d.ip) && !!data.push(d);
}

module.exports = {
  get: get,
  size: size,
  push: push
}