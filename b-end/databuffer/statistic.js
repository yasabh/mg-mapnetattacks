var stats = {
  csrc : [],
  cdst : [],
  isrc : [],
  idst : [],
  sign : []
}, getAll = function(){
  return stats;
}, getLimit = function(limit){
  return {
    csrc: stats.csrc.slice(0, limit),
    cdst: stats.cdst.slice(0, limit),
    isrc: stats.isrc.slice(0, limit),
    idst: stats.idst.slice(0, limit),
    sign: stats.sign.slice(0, limit)
  }
}, getTheLastSame = function(e, type){
  return stats[type].filter(function(o){
      return o.name == e.name;
    })[0];
}, remove = function(name, type){
  if(!name) stats[type] = [];
  stats[type] = stats[type].filter(function(o) {
    return o.name !== name;
  });
}, clear = function(){
  console.info('Statistics cleared on', new Date());
  remove(null, 'csrc');
  remove(null, 'cdst');
  remove(null, 'isrc');
  remove(null, 'idst');
  remove(null, 'sign');
}, pushToType = function(d, type){
  var e = getTheLastSame(d, type);
  // if exist
  if(!!e){ remove(d.name, type); e.count++; }
  else{ e = d; e.count = 1; }
  !!stats[type].push(e);
  stats[type].sort(function(a, b){ return b.count - a.count; });
}, push = function(d){
  var csrc = {
      code: d.src.countryCode,
      name: d.src.countryName
    }, cdst = {
      code: d.dst.countryCode,
      name: d.dst.countryName
    }, isrc = {
      name: d.src.ip,
      location: d.src.city + (!d.src.city ? '' : ', ') +
        d.src.countryName + ' (' + d.src.countryCode + ')'
    }, idst = {name: d.dst.ip,
      location: d.dst.city + (!d.dst.city ? '' : ', ') +
        d.dst.countryName + ' (' + d.dst.countryCode + ')'
    },
    sign = {name: d.signame};
  pushToType(csrc, 'csrc');
  pushToType(cdst, 'cdst');
  pushToType(isrc, 'isrc');
  pushToType(idst, 'idst');
  pushToType(sign, 'sign');
}

module.exports = {
  getAll: getAll,
  getLimit: getLimit,
  clear: clear,
  push: push
}