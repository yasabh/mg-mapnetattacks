var data = [], getAll = function(){
  return data;
}, get = function(timestamp){
  var dtStart = new Date(),
   d = data.filter(function(o){
      return (o.timestamp == timestamp)
    })[0],
   time = new Date() - dtStart;
  if(time > 100){
    data = [];      
    console.log(" Warning!! "
     + "Events database cleared : " + size());
  };
  return d;
}, getTheLastSame = function(e){
  return data.filter(function(o){
      return (o.src.ip == e.src.ip) &&
       (o.dst.ip == e.dst.ip) &&
       (o.sigid == e.sigid);
    })[0];
}, remove = function(timestamp){
  data = data.filter(function(o) {
    return o.timestamp !== timestamp;
  });
}, size = function(){
  return data.length;
}, push = function(d){
  var e = getTheLastSame(d);
  // if exist
  if(!!e){ remove(d.timestamp); e.count++; }
  else{ e = d; e.count = 1; }
  return !!data.push(e);
}

module.exports = {
  getAll: getAll,
  get: get,
  remove: remove,
  size: size,
  push: push
}