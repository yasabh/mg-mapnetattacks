var serverHost = window.location.hostname, drawLine = function() {},
  conn = new WebSocket('ws://' + serverHost +':9030'),
  mymap = L.mapbox.map("mapid").setView(new L.LatLng(40, 0), 2),
  southWest = L.latLng(-0, -200),
  northEast = L.latLng(50, 200),
  bounds = L.latLngBounds(southWest, northEast);

var currentOnCount = 1,
  showTime = 1600,
  toColorCode = function(val) {
    return (val > 1) ? ((val > 2) ? "#00E640" : "yellow") : "red"
  },
  writeDetail = function(priority, info) {
    var maxItems = 5,
      ran = randInfoId();
    var style = "style=\"color: " + toColorCode(priority) + "\"";

    var det = $("#detail .container");
    det.prepend("<p id=\"" + ran + "\" " + style + ">" + info + "</p>");

    var items = det.find("p");
    items.first().hide().fadeIn(500);
    // console.log(showTime + " - " + currentOnCount);
    setTimeout(function() {
      currentOnCount++;
      det.find("#" + ran).fadeOut(500, function() {
        $(this).remove();
        currentOnCount--;
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
  drawHistoricalMap = function(path, signatureId) {
    NProgress.start();
    var url = 'http://' + serverHost + ':8081/mapdata/' + path;
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
      for (var i = 0; i < layers.length; i++) {
        layers[i].clearLayers();
      }
      iLayers = 0;

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
    }).catch(function(){      
      for (var i = 0; i < layers.length; i++) {
        layers[i].clearLayers();
      }
      NProgress.done();      
    });
  },
  toUserDate = function(date) {
    var monthName = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
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
    return formattedDate + '.json';
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
  url = toStrDatePath(new Date()),
  dateParam = toStrDateValue(new Date());

$("#date").html(toUserDate(new Date()));
$("#date").flatpickr({
  maxDate: new Date(),
  onChange: function(date) {
    url = toStrDatePath(date);
    dateParam = toStrDateValue(date);
    $("#date").html(toUserDate(date));
  }
});
$("#refresh").click(function() {
  var sigid = $("#sigid").val();
  drawHistoricalMap(url, sigid);
});
$("#filter").typeahead({
  source: function(query, process) {
    var url = '/signature/search?date=' + dateParam + '&q=' + query;

    NProgress.start();
    return $.get(url, function(data) {
      NProgress.done();
      return process(data);
    }).fail(function(){      
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

L.mapbox.styleLayer('mapbox://styles/yasinabdh/cj68vq2ff1tz72rrnj5xkda4v').addTo(mymap);
// mymap.setMaxBounds(bounds);
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
          f[f.length - 1].setBeginColor(color);
          f[f.length - 1].setEndColor("#dedede");
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
      }, 10);
  }
});

conn.onopen = function() {

};
conn.onerror = function(error) {
  console.error('WebSocket Error ' + error);
};
conn.onmessage = function(e) {
  var data = JSON.parse(e.data);
  console.log('Message from server', data);

  var src = (!!data.src.city ? data.src.city + ', ' + data.src.countryCode : data.src.countryName),
   dst = (!!data.dst.city ? data.dst.city + ', ' + data.dst.countryCode : data.dst.countryName);
  writeDetail(data.sigpriority, src + " -> " + dst + " " + data.signame);
  drawLine(data.src, data.dst, data.sigpriority);
};

// $.get("mapdata/2017/04/21.json", function(data, status){
//   var attacks = data.flights;
//   for(i in data.flights){
//     var attack = {
//       src: {lon: attacks[i][0][0], lat: attacks[i][0][1], loc: attacks[i][0][2]},
//       dst: {lon: attacks[i][1][0], lat: attacks[i][1][1], loc: attacks[i][1][2]},
//       priority: attacks[i][3],
//       signature: attacks[i][2]
//     }

//     draw(attack.src, attack.dst, attack.priority);
//     bindAttackDetail(attack.priority, "[" + attack.src.loc +" -> "+ attack.dst.loc + "] " + attack.signature);
//   }
// });