var events = [], getAll = function(){
  return events;
}, get = function(timestamp){
  var dtStart = new Date(),
   d = events.filter(function(o){
      return (o.timestamp == timestamp)
    })[0],
   time = new Date() - dtStart;
  if(time > 100){
    events = [];      
    console.log(" Warning!! "
     + "Events database cleared : " + size());
  };
  return d;
}, getTheLastSame = function(e){
  return events.filter(function(o){
      return (o.src.ip == e.src.ip) &&
       (o.dst.ip == e.dst.ip) &&
       (o.sigid == e.sigid);
    })[0];
}, remove = function(e){
  events = events.filter(function(o) {
    return (o.src.ip != e.src.ip) &&
     (o.dst.ip != e.dst.ip) &&
     (o.sigid != e.sigid);
  });
}, clear = function(){
  events = [];
}, size = function(){
  return events.length;
}, push = function(d){
  var e = getTheLastSame(d);
  // if exist
  if(!!e){ remove(d); e.count++; }
  else{ e = d; e.count = 1; }
  return !!events.push(e);
}

module.exports = {
  getAll: getAll,
  get: get,
  clear: clear,
  size: size,
  push: push
}