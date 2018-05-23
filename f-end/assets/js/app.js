var serverHost = window.location.hostname,
  conn, drawLine = function() {},
  screenWidth, screenHeight, bestConfig, fixedMap, mymap;

var lines = [],
  resConfig = [{
    width: "default",
    mapConfig: [10, 0, 2],
    signLegth: 60
  }, {
    width: 1024,
    mapConfig: [10, 0, 2],
    signLegth: 56
  }, {
    width: 1440,
    mapConfig: [10, 0, 2],
    signLegth: 66
  }, {
    width: 1680,
    mapConfig: [15, 120, 2],
    signLegth: 46
  }, {
    width: 1920,
    mapConfig: [15, 120, 2],
    signLegth: 46
  }],
  getBestConfig = function(width) {
    var filtered = resConfig.sort(function(a, b) {
      return a.width - b.width;
    }).filter(function(o) {
      return o.width <= width
    });
    return filtered[filtered.length - 1];
  },
  initWorldMap = function() {
    bestConfig = getBestConfig(screenWidth);
    fixedMap = bestConfig.mapConfig;
    console.info("Map config sets into (lat, lon, zoom)", fixedMap);
    mymap = L.mapbox.map("mapid").setView(new L.LatLng(fixedMap[0], fixedMap[1]), fixedMap[2]);
    L.mapbox.styleLayer('mapbox://styles/yasinabdh/cj68vq2ff1tz72rrnj5xkda4v').addTo(mymap);
    d3.json("./data/world_map.json", function(a, b) {
      console.log(b);
      var c = topojson.feature(b, b.objects.countries);

      L.geoJSON(c, {
        style: {
          color: "#fffd4b",
          opacity: .5,
          weight: 1,
          fillColor: "black",
          fillOpacity: .2
        }
      }).addTo(mymap);

      var d = d3.select("#mapid").select("svg");

      drawLine = function(src, dst, priority) {
        var f = [],
          anim = setInterval(function() {
            if (f.length < 1 && Math.random() < .2) {
              f.push(new Attack(mymap, d));
              var color = toColorCode(priority);
              f[f.length - 1].setPlaneColor(color);
              f[f.length - 1].setRoadColor(color);
              f[f.length - 1].setBeginColor('#dfdfdf');
              f[f.length - 1].setEndColor("#95a5a6");
              f[f.length - 1].init({
                lat: src.lat,
                lng: src.lon
              }, {
                lat: dst.lat,
                lng: dst.lon
              })
            }

            for (var x = 0; x >= 0; x--)
              (f[f.length - 1] != undefined && f[x].isEnd()) ? f[x].isCleaning || (f[x].isCleaning = !0, f[x].delete(), f.splice(x, 1)) : (f[x] != undefined) && (f[x].update(), f[x].render())

            if (f[f.length - 1] != undefined && f[f.length - 1].isEnd()) {
              clearInterval(anim);
              f[f.length - 1].delete();
              f.splice(f.length - 1, 1);
            }
          }, 25);
      }
    })
  },
  isLineNotExist = function(e) {
    return !lines.filter(function(o) {
      return (o.timestamp == e.timestamp) &&
        (o.src.lat == e.src.lat) &&
        (o.src.lon == e.src.lon) &&
        (o.dst.lat == e.dst.lat) &&
        (o.dst.lon == e.dst.lon);
    })[0] && !!lines.push(e);
  },
  sizeOfLine = function() {
    return lines.length;
  },
  removeLines = function(timestamp) {
    lines = [];
  },
  resolutionHandler = function() {
    screenWidth = $(window).width();
    screenHeight = $(window).height();

    if (screenWidth < 1024) {
      alert('Your current screen resolution is not satisfied.');
    } else {
      initWorldMap();
      $('#functional').show(500);
      $('#statistic').show(500);

      if (screenWidth >= 1680) {
        $('#detail').css('height', (screenHeight - 12) + "px").show(1000);
      } else {
        $('#detail').show(500);
      }
    }
  },
  currentOnCount = 1,
  showTime = 300000,
  realtimeOnFirst = true,
  waitDetail = '<div class="col-xs-1 col-sm-1 col-md-1 text-success" style="margin:0">Waiting on occurring event..</div>',
  connLostStats = '<tr><td class="text-danger no-wrap">Connection lost, reconnecting..</td></tr>',
  lookingStats = '<tr><td class="text-warning no-wrap">Contacting server..</td></tr>',
  retDataStats = '<tr><td class="text-success no-wrap">Retrieving data..</td></tr>',
  noDataStats = '<tr><td class="text-warning no-wrap">No data</td></tr>',
  textTrim = function(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '..' : text;
  },
  toColorCode = function(val) {
    if ([1, 2, 3].indexOf(val) == -1) return "white";
    return (val > 1) ? ((val > 2) ? "#00E640" : "yellow") : "red"
  },
  tsToTimeString = function(timestamp) {
    if (!timestamp) return "Simulation";
    var now = new Date(timestamp),
      hh = (now.getHours() > 9 ? "" : "0") + now.getHours(),
      mm = (now.getMinutes() > 9 ? "" : "0") + now.getMinutes(),
      ss = (now.getSeconds() > 9 ? "" : "0") + now.getSeconds();
    return hh + ":" + mm + ":" + ss;
  },
  addTooltip = function(text, prevText) {
    var isNeeded = text.length > prevText.length;
    return (isNeeded ? 'data-toggle="tooltip" data-placement="top" title="' +
      text + '"' : '');
  },
  writeDetail = function(e) {
    $('#detail-wait').hide();
    var maxItems = 4,
      ran = randInfoId();
    var style = "style=\"margin-right:6px;color: " + toColorCode(e.priority) + "\"";

    var det = $("#detail .container"),
      fixedSignLegth = bestConfig.signLegth,
      srcLoc = e.src.city + (!e.src.city ? '' : ', ') +
      e.src.countryName + ' (' + e.src.countryCode + ')',
      dstLoc = e.dst.city + (!e.dst.city ? '' : ', ') +
      e.dst.countryName + ' (' + e.dst.countryCode + ')',
      signature = textTrim(e.signame, fixedSignLegth) + ' (' + e.count + ')',
      information = '<div id="' + ran + '" class="row">' +
      '<div class="col-xs-1 col-sm-1 col-md-1 text-primary" style="margin:0">' +
      tsToTimeString(e.timestamp * 1000) +
      '</div><div class="col-xs-2 col-sm-2 col-md-2 text-right">' +
      '  <span class="text-secondary" ' + addTooltip(srcLoc, '') +
      '>' + e.src.ip + '</span>' + '</div><div class="col-xs-2 col-sm-2 col-md-2" ' +
      addTooltip(dstLoc, '') + '>' + '  → <span class="text-secondary">' +
      e.dst.ip + '</span>' + '</div><div ' + style + ' class="col-xs-6 col-sm-6 col-md-6"' +
      addTooltip(e.signame, signature) + '>&nbsp;' + signature + '</div></div>';
    det.prepend(information);

    var items = det.find("p");
    items.first().hide().fadeIn(500);
    setTimeout(function() {
      currentOnCount++;
      det.find("#" + ran).fadeOut(500, function() {
        $(this).remove();
        currentOnCount--;
        if (!currentOnCount)
          $('#detail-wait').html(waitDetail);
      });
    }, showTime);
    if (currentOnCount > 10) {
      det.last().fadeOut(500, function() {
        $(this).remove();
        currentOnCount--;
      });
    }
  },
  randInfoId = function() {
    return "detail-" + Math.random().toString(36).slice(2);
  },
  layers = [L.layerGroup()],
  iLayers = 0,
  clearMap = function() {
    for (var i = 0; i < layers.length; i++) {
      layers[i].clearLayers();
    }
    iLayers = 0;
  },
  drawHistoricalMap = function(path, signatureId) {
    NProgress.start();
    var url = '/mapdata/' + path + '.json';
    fetch(url).then(function(response) {
      return response.json();
    }).then(function(flightsData) {
      if (!!signatureId) {
        for (var i = 0; i < flightsData.length; i++) {
          if (flightsData[i]['sigid'] != signatureId) {
            flightsData.splice(i--, 1);
          }
        }
      }
      clearMap();

      for (var i = 0; i < flightsData.length; i++) {
        var flight = flightsData[i];
        var eventID = flight.sigid;
        var eventname = flight.signame;
        var eventpriority = flight.sigpriority;
        var pointA = new L.LatLng(flight.src.lat, flight.src.lon);
        var mapPointA = flight.src.loc;
        var pointB = new L.LatLng(flight.dst.lat, flight.dst.lon);
        var mapPointB = flight.dst.loc;

        var greenIcon = L.icon({
          iconUrl: './assets/img/marker_src.png',
          iconSize: [28, 28], // size of the icon
          shadowSize: [50, 64], // size of the shadow
          iconAnchor: [14, 27], // point of the icon which will correspond to marker's location
          shadowAnchor: [4, 62], // the same for the shadow
          popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
        });
        var mapMarkerSource = L.marker(pointA, {
          icon: greenIcon
        });
        mapMarkerSource.bindPopup(mapPointA); // source

        var greenIcon = L.icon({
          iconUrl: './assets/img/marker_dst.png',
          iconSize: [17.3, 28], // size of the icon
          shadowSize: [50, 64], // size of the shadow
          iconAnchor: [9, 27], // point of the icon which will correspond to marker's location
          shadowAnchor: [4, 62], // the same for the shadow
          popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
        });
        var mapMarkerDestination = L.marker(pointB, {
          icon: greenIcon
        });
        mapMarkerDestination.bindPopup(mapPointB); //destination

        var pointList = [pointA, pointB];
        var mapPolyline = new L.polyline(pointList, {
          color: toColorCode(eventpriority),
          weight: 2,
          opacity: 0.5,
          smoothFactor: 1
        });
        mapPolyline.bindPopup(eventname);

        layers[iLayers++] = L.layerGroup([mapMarkerSource, mapMarkerDestination])
          .addLayer(mapPolyline)
          .addTo(mymap);
      }
      NProgress.done();
    }).catch(function() {
      for (var i = 0; i < layers.length; i++) {
        layers[i].clearLayers();
      }
      NProgress.done();
    });
  },
  writeStats = function(stats) {
    var topCtSrc = '',
      topCtDst = '',
      topIpSrc = '',
      topIpDst = '',
      topSign = '';
    for (var i = 0; i < stats.csrc.length; i++) {
      var countrySrc = stats.csrc[i]['name'] + ' (' + stats.csrc[i]['code'] + ')';
      topCtSrc += '<tr><td ' + addTooltip(countrySrc, '') +
        '><span class="flag flag-' + stats.csrc[i]['code'].toLowerCase() +
        '"></span></td><th scope="row" class="text-left ' +
        'text-secondary">' + stats.csrc[i]['count'] + '</th></tr>';
    }
    for (var i = 0; i < stats.cdst.length; i++) {
      var countryDst = stats.cdst[i]['name'] + ' (' + stats.cdst[i]['code'] + ')';
      topCtDst += '<tr><td ' + addTooltip(countryDst, '') +
        '><span class="flag flag-' + stats.cdst[i]['code'].toLowerCase() +
        '"></span></td><th scope="row" class="text-left ' +
        'text-secondary">' + stats.cdst[i]['count'] + '</th></tr>';
    }
    for (var i = 0; i < stats.isrc.length; i++) {
      topIpSrc += '<tr><td ' + addTooltip(stats.isrc[i]['location'], '') +
        '>' + stats.isrc[i]['name'] + '</td><th scope="row" class="text-left ' +
        'text-secondary">' + stats.isrc[i]['count'] + '</th></tr>';
    }
    for (var i = 0; i < stats.idst.length; i++) {
      topIpDst += '<tr><td ' + addTooltip(stats.idst[i]['location'], '') +
        '>' + stats.idst[i]['name'] + '</td><th scope="row" class="text-left ' +
        'text-secondary">' + stats.idst[i]['count'] + '</th></tr>';
    }
    for (var i = 0; i < stats.sign.length; i++) {
      var signame = textTrim(stats.sign[i]['name'], 48);
      topSign += '<tr><td class="no-wrap" ' + addTooltip(stats.sign[i]['name'], signame) +
        '>' + signame + '</td><th scope="row" class="text-left text-secondary">' +
        stats.sign[i]['count'] + '</th></tr>';
    }

    $('.stat-header').show();
    $('#top-csrc-stats').html(!topCtSrc ? noDataStats : topCtSrc);
    $('#top-cdst-stats').html(!topCtDst ? noDataStats : topCtDst);
    $('#top-isrc-stats').html(!topIpSrc ? noDataStats : topIpSrc);
    $('#top-idst-stats').html(!topIpDst ? noDataStats : topIpDst);
    $('#top-sign-stats').html(!topSign ? noDataStats : topSign);
  },
  updateHistoricalStats = function(path) {
    var url = '/mapdata/' + path + '-stats.json';
    fetch(url).then(function(response) {
      return response.json();
    }).then(function(stats) {
      $('#stat-date').html(toUserDate(datePath));
      writeStats(stats);
    }).catch(function() {
      $('#top-csrc-stats').html(noDataStats);
      $('#top-cdst-stats').html(noDataStats);
      $('#top-isrc-stats').html(noDataStats);
      $('#top-idst-stats').html(noDataStats);
      $('#top-sign-stats').html(noDataStats);
    });
  },
  toUserDate = function(date) {
    var monthName = [
        'Januari', 
        'Februari', 
        'Maret', 
        'April', 
        'Mei', 
        'Juni', 
        'Juli', 
        'Agustus', 
        'September', 
        'Oktober', 
        'November', 
        'Desember'
      ],
      date = new Date(date),
      day = date.getDate(),
      month = date.getMonth(),
      year = date.getFullYear(),
      formattedDate = (day > 9 ? '' : '0') + day +
      ' ' + monthName[month] + ', ' + year;
    return formattedDate;
  },
  toStrDatePath = function(date) {
    var date = new Date(date),
      day = date.getDate(),
      month = date.getMonth() + 1,
      year = date.getFullYear(),
      formattedDate = year + '/' + (month > 9 ? '' : '0') + month + '/' +
      (day > 9 ? '' : '0') + day;
    return formattedDate;
  },
  toStrDateValue = function(date) {
    var date = new Date(date),
      day = date.getDate(),
      month = date.getMonth() + 1,
      year = date.getFullYear(),
      formattedDate = year + '-' + (month > 9 ? '' : '0') + month +
      '-' + (day > 9 ? '' : '0') + day;
    return formattedDate;
  },
  datePath = toStrDatePath(new Date()),
  dateParam = toStrDateValue(new Date()),
  statMessage = function(html) {
    $('#top-csrc-stats').html(html);
    $('#top-cdst-stats').html('');
    $('#top-isrc-stats').html('');
    $('#top-idst-stats').html('');
    $('#top-sign-stats').html('');
  },
  connectWebsocket = function() {
    conn = new WebSocket('ws://' + serverHost + ':9030')
    conn.onopen = function() {
      statMessage(retDataStats);
    };
    conn.onerror = function(error) {
      console.error('WebSocket Error ' + error);
      $statMessage(connLostStats);
      connectWebsocket();
    };
    conn.onmessage = function(e) {
      var res = JSON.parse(e.data);
      // console.log('Message from server', res);

      if (res.type == 'stats') {
        writeStats(res.data);
      } else if (res.type == 'event') {
        writeDetail(res.data);
        res.data.timestamp = parseInt(res.data.timestamp);
        // var isShowed = false;
        if (isLineNotExist(Object.assign({}, res.data))) {
          drawLine(res.data.src, res.data.dst, res.data.sigpriority);
          // isShowed = true;
        }
        // console.log("Line is " + (isShowed ? 'shown' : 'not shown'));
      }
    };
  }, rangeTime = 3000;

resolutionHandler();
$(window).resize(function() {
  location.reload();
});
statMessage(lookingStats);
connectWebsocket();

setInterval(function() {
  removeLines();
}, rangeTime)

$("#swith-mode").click(function() {
  realtimeOnFirst = realtimeOnFirst ? false : true;
  $(this).html(realtimeOnFirst ? 'Realtime' : 'Historical');

  if (realtimeOnFirst) {
    clearMap();
    connectWebsocket();

    $('#stat-date').html('Today');
    $('#detail').fadeIn(500);
    $('#historical').fadeOut(500);
    $('#legend').fadeOut(500);

    mymap.setView(new L.LatLng(fixedMap[0], fixedMap[1]), fixedMap[2]);

    if (screenWidth >= 1680) {
      $('#mapid').css('left', '670px');
    }
  } else {
    conn.close();

    $('#detail').fadeOut(500);
    $('#historical').fadeIn(500);
    $('#legend').fadeIn(500);

    var defaultMapConfig = resConfig[0].mapConfig;
    mymap.setView(new L.LatLng(defaultMapConfig[0], defaultMapConfig[1]), defaultMapConfig[2]);

    if (screenWidth >= 1680) {
      $('#mapid').css('left', '0');
    }
  }
});

$('#detail-wait').html(waitDetail);
$("#date").html(toUserDate(new Date()));
$("#date").flatpickr({
  maxDate: new Date(),
  onChange: function(date) {
    datePath = toStrDatePath(date);
    dateParam = toStrDateValue(date);
    $("#date").html(toUserDate(date));
  }
});
$("#refresh").click(function() {
  var sigid = $("#sigid").val();
  drawHistoricalMap(datePath, sigid);
  updateHistoricalStats(datePath);
});
$("#filter").typeahead({
  source: function(query, process) {
    var url = '/signature/search?date=' + dateParam + '&q=' + query;

    NProgress.start();
    return $.get(url, function(data) {
      NProgress.done();
      return process(data);
    }).fail(function() {
      NProgress.done();
    });
  },
  updater: function(item) {
    $("#sigid").val(item.id);
    $("#filter").attr('disabled', true);
    $("#filter-close").fadeIn(300);
    return item;
  }
});
$('#filter-close').click(function() {
  $("#sigid").val('');
  $("#filter").val('').attr('disabled', false).focus();
  $("#filter-close").fadeOut(300);
});