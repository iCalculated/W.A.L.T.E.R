      require([
          "esri/Map",
          "esri/views/MapView",
          "esri/Graphic",
          "esri/geometry/Point",
          "esri/symbols/SimpleMarkerSymbol",
          "esri/geometry/Polyline",
          "esri/symbols/SimpleLineSymbol",
          "esri/geometry/Polygon",
          "esri/symbols/SimpleFillSymbol",
          "esri/tasks/RouteTask",
          "esri/tasks/support/RouteParameters",
          "esri/tasks/support/FeatureSet",
          "dojo/_base/array",
          "dojo/on",
          "dojo/dom",
          "esri/layers/FeatureLayer",
          "esri/layers/GraphicsLayer",
          "esri/widgets/Expand"
      ], function(Map, MapView,
          Graphic, Point, SimpleMarkerSymbol,
          Polyline, SimpleLineSymbol,
          Polygon, SimpleFillSymbol, RouteTask, RouteParameters, FeatureSet, array, on, dom,
          FeatureLayer, GraphicsLayer) {

          var map = new Map({
              basemap: "streets-night-vector"
          });


          var view = new MapView({
              container: "viewDiv",
              map: map,
              center: [-93.154283, 44.937909],
              zoom: 14
          });

          var addingStops = true;

          var cluster_mark = {
              type: "simple",
              symbol: {
                  color: "#BA55D3",
                  type: "simple-marker",
                  style: "circle"
              },
              visualVariables: [{
                  type: "size",
                  field: "x3",
                  minDataValue: 0,
                  maxDataValue: 30,
                  minSize: "30px",
                  maxSize: "700px"
              }]
          };

          var featureLayer = new FeatureLayer({
              url: "https://services7.arcgis.com/9DY887YAIGnBSm9O/arcgis/rest/services/mydata_2/FeatureServer",
              renderer: cluster_mark,
              opacity: .75
          });

          map.add(featureLayer);

          var pureData = new FeatureLayer({
              url: "https://services7.arcgis.com/9DY887YAIGnBSm9O/arcgis/rest/services/best_data/FeatureServer",
              opacity: .75 * (view.zoom) / 15
          });

          map.add(pureData);

          var polygon = new Polygon({
              rings: [
                  [-93.154083, 44.937809],
                  [-93.154583, 44.937809],
                  [-93.154583, 44.938189],
                  [-93.154083, 44.938189],
                  [-93.154083, 44.937809]
              ]
          });

          var clusters = [];
          var routeList = [];
          var highlighters = [];

          // Create a symbol for rendering the graphic
          var fillSymbol = new SimpleFillSymbol({
              color: [227, 139, 79, 0.8],
              outline: {
                  color: [255, 255, 255],
                  width: 1
              }
          });


          var routeTask = new RouteTask({
              url: "https://utility.arcgis.com/usrsvcs/appservices/cKkdHgNqquMZkgAf/rest/services/World/Route/NAServer/Route_World"
          });
          var routeParams = new RouteParameters();
          routeParams.stops = new FeatureSet();
          routeParams.polygonBarriers = new FeatureSet();
          routeParams.returnDirections = true;

          var routes = [];

          var stopBtn = document.getElementById("addstops");
          var barrierBtn = document.getElementById("addbarriers");
          var clStopBtn = document.getElementById("clstops");
          var clBarrierBtn = document.getElementById("clbarriers");
          var navBtn = document.getElementById("nav");

          var clNavBtn = document.getElementById("clnav");

          var bottomButtons = [];
          for (var i = 1; i < 7; i++) {
              bottomButtons.push(document.getElementById("button" + i));
          }
          for (var i = 1; i < 7; i++) {
              bottomButtons[i - 1].number = i - 1;
          }

          for (var i = 1; i < 7; i++) {

              bottomButtons[i - 1].addEventListener("mouseover", function() {
                  document.getElementById("button_row").innerHTML = Math.floor(routeList[this.number].attributes.Total_TravelTime) + "m  " + Math.round(60 * (routeList[this.number].attributes.Total_TravelTime - Math.floor(routeList[this.number].attributes.Total_TravelTime))) + "s  🞄  " + Math.round(100 * routeList[this.number].attributes.Total_Miles) / 100 + " mi";

                  highlighters[this.number].visible = true;
              });
              bottomButtons[i - 1].addEventListener("mouseout", function() {
                  document.getElementById("button_row").innerHTML = "Select Route";
                  //           console.log(btnIndex-1);
                  // console.log(highlighters[btnIndex-1]);
                  highlighters[this.number].visible = false;
              });

              bottomButtons[i - 1].addEventListener("click", function() {
                  console.log(routes[this.number]);
                  view.goTo({
                      target: highlighters[this.number].geometry,
                      tilt: 70
                  }, {
                      duration: 2000,
                      easing: "in-out-expo"
                  });
              });
          }

          stopBtn.addEventListener("click", function() {
              addingStops = true;
          });

          barrierBtn.addEventListener("click", function() {
              addingStops = false;
          });

          clStopBtn.addEventListener("click", function() {
              for (var i = routeParams.stops.features.length - 1; i >= 0; i--) {
                  view.graphics.remove(routeParams.stops.features.splice(i, 1)[0]);
              }
          });

          clBarrierBtn.addEventListener("click", function() {
              for (var i = routeParams.polygonBarriers.features.length - 1; i >= 0; i--) {
                  view.graphics.remove(routeParams.polygonBarriers.features.splice(i, 1)[0]);
              }
          });

          clNavBtn.addEventListener("click", function() {
              console.log(routeList);
          });

          navBtn.addEventListener("click", function() {

              var counter = 7;
              var otherCounter = 0;
              var last = 0;
              var what = false;
              for (var i = 0; i < 6; i++) {
                  setTimeout(function() {
                      getRoute();
                      if (routes[0] != undefined) {
                          if (last != 0) {
                              if (compareArray(last, routes[0].geometry.paths[0])) {
                                  if (!what) {
                                      counter--;
                                      what = true;
                                  }
                                  counter--;
                              }
                          }
                          last = routes[0].geometry.paths[0];
                      }
                  }, i * 1000);
                  setTimeout(function() {
                      document.getElementById("button_row").innerHTML = (counter - 1) + " Routes Found";
                      document.getElementById("middleDiv").style.display = "block";
                      for (var buttonNum2 = counter; buttonNum2 < 7; buttonNum2++) {
                          var id2 = "button" + buttonNum2;
                          document.getElementById(id2).style.display = "none";

                      }
                  }, 6000);

              }
          });

          document.getElementById("middleDiv").style.display = "none";


          function compareArray(arr1, arr2) {
              return (JSON.stringify(arr1) === JSON.stringify(arr2));
          }

          view.on("click", function(event) {
              if (addingStops === true) {
                  if (routeParams.stops.features.length === 0) {
                      addGraphic("start", event.mapPoint);
                  } else if (routeParams.stops.features.length === 1) {
                      addGraphic("finish", event.mapPoint);
                  }
              } else {
                  addBarrier(event.mapPoint);
              }
          });


          function addGraphic(type, point) {
              var graphic = new Graphic({
                  symbol: {
                      type: "simple-marker",
                      color: (type === "start") ? "white" : "black",
                      size: "8px"
                  },
                  geometry: point
              });
              routeParams.stops.features.push(graphic);
              view.graphics.add(graphic);
          }

          function addBarrier(point) {

              var x = point.longitude;
              var y = point.latitude;

              var bpolygon = new Polygon({
                  rings: [
                      [x - 0.00025, y - 0.00018],
                      [x + 0.00025, y - 0.00018],
                      [x + 0.00025, y + 0.00018],
                      [x - 0.00025, y + 0.00018],
                      [x - 0.00025, y - 0.00018]
                  ]
              });

              var bfillSymbol = new SimpleFillSymbol({
                  color: [227, 139, 79, 0.8],
                  outline: {
                      color: [255, 0, 0],
                      width: 3
                  }
              });

              var polygonGraphic = new Graphic({
                  geometry: polygon,
                  symbol: fillSymbol
              });


              var bpolygonGraphic = new Graphic({
                  geometry: bpolygon,
                  symbol: bfillSymbol
              });

              routeParams.polygonBarriers.features.push(bpolygonGraphic);
              view.graphics.add(bpolygonGraphic);
          }

          function ccw(a, b, c) {
              return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
          }

          function intersect(a, b, c, d) {
              return (ccw(a, c, d) != ccw(b, c, d)) && (ccw(a, b, c) != ccw(a, b, d));
          }

          function getRoute() {

              routeTask.solve(routeParams).then(function(data) {
                  data.routeResults.forEach(function(result) {
                      result.route.symbol = {
                          type: "simple-line",
                          color: [5, 150, 255, 1.0],
                          width: 3
                      };


                      var biggestCluster = 0;
                      var biggestSize = 0;

                      for (var clustIndex = 0; clustIndex < clusters.length; clustIndex++) {


                          var cross = false;
                          for (var j = 0; j < result.route.geometry.paths[0].length - 1; j++) {


                              var a = [result.route.geometry.paths[0][j][0], result.route.geometry.paths[0][j][1]];
                              var b = [result.route.geometry.paths[0][j + 1][0], result.route.geometry.paths[0][j + 1][1]];
                              for (var g = 0; g < 4; g++) {
                                  var c = [clusters[clustIndex].geometry.rings[0][g][0], clusters[clustIndex].geometry.rings[0][g][1]];
                                  var d = [clusters[clustIndex].geometry.rings[0][g + 1][0], clusters[clustIndex].geometry.rings[0][g + 1][1]];
                                  if (intersect(a, b, c, d)) {
                                      cross = true;
                                  }
                              }
                          }
                          if (cross) {
                              var size;
                              size = clusterData[clustIndex][2];
                              if (size > biggestSize) {
                                  biggestCluster = clusters[clustIndex];
                                  biggestSize = size;
                              }
                          }


                      }

                      if (biggestCluster === 0) {
                          // console.log("ok");
                      } else {
                          biggestCluster.visible = true;
                          routeParams.polygonBarriers.features.push(biggestCluster);
                      }

                      for (var i = routes.length - 1; i >= 0; i--) {

                          // if (routes.splice(i, 1)[0].symbol.color === [5, 150, 255, 1.0]){
                          if (i === 0) {
                              routes.splice(i, 1)[0].symbol = {
                                  type: "simple-line",
                                  color: [5, 150, 255, 1.0],
                                  width: 3
                              };
                          }
                          if (i === 1) {
                              routes.splice(i, 1)[0].symbol = {
                                  type: "simple-line",
                                  color: [5, 150, 255, 1.0],
                                  width: 3
                              };
                          }
                          if (i === 2) {
                              routes.splice(i, 1)[0].symbol = {
                                  type: "simple-line",
                                  color: [5, 150, 255, 1.0],
                                  width: 3
                              };
                          }
                          if (i === 3) {
                              routes.splice(i, 1)[0].symbol = {
                                  type: "simple-line",
                                  color: [2, 75, 150, 1.0],
                                  width: 3
                              };
                          }
                          // }
                      }

                      routes.push(result.route);

                      var clone = new Graphic({
                          geometry: result.route.geometry,
                          symbol: {
                              type: "simple-line",
                              color: [255, 0, 0, 1],
                              width: 6
                          }
                      });

                      highlighters.push(clone);
                      routeList.push(result.route);
                      clone.visible = false;
                      view.graphics.add(result.route, 0);
                      view.graphics.add(clone);

                      document.getElementById("nav").innerHTML = "Find Safer Route";
                  });


                  var directions = document.createElement("ol");
                  directions.classList = "esri-widget esri-widget--panel esri-directions__scroller";
                  directions.style.marginTop = 0;
                  directions.style.paddingTop = "15px";


                  // Display the directions
                  var directions = document.createElement("ol");
                  directions.classList = "esri-widget esri-widget--panel esri-directions__scroller";
                  directions.style.marginTop = 0;
                  directions.style.paddingTop = "15px";


                  var timeHtml = document.createElement("p");
                  timeHtml.innerHTML = "Drive time: <b>" + Math.floor(data.routeResults[0].directions.totalDriveTime) + "m " + Math.round(60 * (data.routeResults[0].directions.totalDriveTime - Math.floor(data.routeResults[0].directions.totalDriveTime))) + "s </b><br>Distance: <b>" + Math.round(data.routeResults[0].directions.totalLength * 100) / 100 + " miles</b>";
                  directions.appendChild(timeHtml);


                  var features = data.routeResults[0].directions.features;
                  features.forEach(function(result, i) {
                      var direction = document.createElement("li");
                      direction.innerHTML = result.attributes.text + " (" + result.attributes.length.toFixed(2) + " miles)";
                      directions.appendChild(direction);
                  });

                  view.ui.empty("bottom-right");
                  view.ui.add(directions, "bottom-right");

                  // console.log(routes);

              });
          }


          // Add the graphic to the view
          // view.graphics.add(polygonGraphic);

          function addCluster(long, lat, size) {
              var cx = long;
              var cy = lat;
              var scalex = 0.00025 * (Math.sqrt(size));
              var scaley = 0.00018 * (Math.sqrt(size));
              var cpolygon = new Polygon({
                  rings: [
                      [cx - scalex, cy - scaley],
                      [cx + scalex, cy - scaley],
                      [cx + scalex, cy + scaley],
                      [cx - scalex, cy + scaley],
                      [cx - scalex, cy - scaley]
                  ]
              });

              // Create a symbol for rendering the graphic
              var cfillSymbol = new SimpleFillSymbol({
                  color: [227, 139, 79, 0.8],
                  outline: {
                      color: [255, 0, 0, 0.5],
                      width: 3
                  }
              });

              // Add the geometry and symbol to a new graphic
              var cpolygonGraphic = new Graphic({
                  geometry: cpolygon,
                  symbol: cfillSymbol
              });
              clusters.push(cpolygonGraphic);
              view.graphics.add(cpolygonGraphic);
              cpolygonGraphic.visible = false;
          }


          var clusterData = [
              [-93.069405, 44.960204, 2],
              [-93.11740745, 44.95585436, 11],
              [-93.06163175, 44.97099925, 4],
              [-93.177168, 44.948406, 1],
              [-93.050743, 44.973926, 2],
              [-93.101472, 44.96478, 1],
              [-93.1064245, 44.9369155, 2],
              [-93.1338625, 44.962443, 2],
              [-93.06865825, 44.9551175, 4],
              [-93.1270625, 44.934119, 4],
              [-93.087492, 44.977259, 2],
              [-93.064169, 44.956594, 4],
              [-93.188657, 44.9343265, 4],
              [-93.06699167, 44.97658767, 9],
              [-93.1059006, 44.9418504, 5],
              [-93.03006367, 44.972343, 3],
              [-93.14787883, 44.91334283, 6],
              [-93.103389, 44.96713833, 3],
              [-93.099918, 44.940664, 5],
              [-93.096847, 44.973464, 3],
              [-93.126396, 44.955778, 7],
              [-93.04313, 44.977542, 1],
              [-93.192429, 44.947811, 4],
              [-93.172118, 44.908988, 2],
              [-93.166962, 44.935166, 1],
              [-93.04435775, 44.990652, 4],
              [-93.123907, 44.95543525, 4],
              [-93.105878, 44.991896, 4],
              [-93.0245815, 44.9693577, 10],
              [-93.1571918, 44.9420652, 5],
              [-93.071017, 44.970272, 2],
              [-93.07475867, 44.92506, 3],
              [-93.0553485, 44.9537545, 2],
              [-93.139016, 44.955645, 4],
              [-93.00484, 44.935282, 1],
              [-93.097009, 44.955924, 2],
              [-93.04304871, 44.96258886, 7],
              [-93.11609375, 44.9632765, 4],
              [-93.152618, 44.952577, 2],
              [-93.10435575, 44.97534363, 8],
              [-93.13518525, 44.94042075, 4],
              [-93.074433, 44.984111, 3],
              [-93.189674, 44.918111, 1],
              [-93.1272035, 44.94116, 8],
              [-93.024806, 44.965529, 3],
              [-93.080735, 44.954729, 1],
              [-93.110532, 44.924825, 1],
              [-93.144386, 44.93856225, 4],
              [-93.114168, 44.96220767, 6],
              [-93.09589014, 44.94720771, 7],
              [-93.07247067, 44.991751, 3],
              [-93.0368295, 44.9900075, 6],
              [-93.167026, 44.940708, 5],
              [-93.1822875, 44.94754025, 4],
              [-93.0557995, 44.9611995, 6],
              [-93.09466433, 44.953922, 3],
              [-93.153705, 44.955736, 3],
              [-93.0735355, 44.969801, 4],
              [-93.16644871, 44.95598857, 7],
              [-93.092731, 44.957759, 1],
              [-93.09205033, 44.96701233, 3],
              [-93.14760317, 44.97368133, 6],
              [-93.1773535, 44.911486, 2],
              [-93.05567, 44.920353, 1],
              [-93.01025, 44.96922, 1],
              [-93.071871, 44.9542615, 4],
              [-93.1929772, 44.9194324, 5],
              [-93.0195182, 44.9495574, 5],
              [-93.1083425, 44.9409035, 6],
              [-93.132824, 44.950951, 1],
              [-93.0253746, 44.963003, 5],
              [-93.050428, 44.977414, 1],
              [-93.040412, 44.977533, 1],
              [-93.10604, 44.96846483, 6],
              [-93.167189, 44.95190467, 9],
              [-93.131919, 44.95636825, 4],
              [-93.146556, 44.946618, 4],
              [-93.013232, 44.9527735, 2],
              [-93.0849975, 44.936485, 2],
              [-93.04767133, 44.95273833, 3],
              [-93.144688, 44.959504, 1],
              [-93.0594715, 44.9599005, 2],
              [-93.146749, 44.952144, 2],
              [-93.081921, 44.969932, 4],
              [-93.030351, 44.98294, 1],
              [-93.0640565, 44.981301, 2],
              [-93.03589767, 44.976358, 6],
              [-93.09203591, 44.94838236, 11],
              [-93.165732, 44.90281467, 3],
              [-93.13482, 44.94853, 3],
              [-93.0266788, 44.9781776, 5],
              [-93.126099, 44.991794, 2],
              [-93.15278917, 44.92700217, 6],
              [-93.06010133, 44.96390433, 3],
              [-93.0744145, 44.97722044, 16],
              [-93.00876767, 44.95145833, 3],
              [-93.121092, 44.957178, 2],
              [-93.1439625, 44.9555775, 2],
              [-93.065961, 44.970314, 4],
              [-93.14975075, 44.955824, 4],
              [-93.2023335, 44.9646115, 4],
              [-93.1068938, 44.979451, 15],
              [-93.166948, 44.981006, 2],
              [-93.162208, 44.9562406, 5],
              [-93.04576314, 44.95678114, 7],
              [-93.102041, 44.92839, 2],
              [-93.16839433, 44.96706033, 3],
              [-93.12648933, 44.96856333, 3],
              [-93.11090683, 44.948464, 6],
              [-93.046506, 44.9763795, 2],
              [-93.201674, 44.986726, 2],
              [-93.0554575, 44.9772585, 6],
              [-93.096412, 44.929426, 2],
              [-93.103292, 44.945083, 8],
              [-93.0049492, 44.9542772, 5],
              [-93.0877727, 44.9508741, 10],
              [-93.14787625, 44.94114325, 8],
              [-93.02824767, 44.986979, 3],
              [-93.138369, 44.923637, 2],
              [-93.199809, 44.975194, 2],
              [-93.096236, 44.9644308, 5],
              [-93.086395, 44.973055, 2],
              [-93.12117125, 44.9302015, 4],
              [-93.06353, 44.962756, 3],
              [-93.085004, 44.941318, 2],
              [-93.113792, 44.966707, 1],
              [-93.02521567, 44.99015167, 3],
              [-93.16699175, 44.9596995, 4],
              [-93.0859436, 44.9858716, 5],
              [-93.066929, 44.926007, 2],
              [-93.02526033, 44.955894, 3],
              [-93.173498, 44.930488, 1],
              [-93.026117, 44.951877, 8],
              [-93.13647233, 44.952159, 3],
              [-93.0908806, 44.9615186, 5],
              [-93.02939675, 44.9671625, 4],
              [-93.084215, 44.949231, 2],
              [-93.09639, 44.976832, 3],
              [-93.146213, 44.952565, 1],
              [-93.069316, 44.965761, 1],
              [-93.0855915, 44.9559805, 2],
              [-93.17777925, 44.956241, 4],
              [-93.16193825, 44.9609055, 4],
              [-93.1088542, 44.9558994, 5],
              [-93.10398686, 44.94343943, 7],
              [-93.15568475, 44.98286175, 4],
              [-93.16692, 44.946625, 3],
              [-93.09859443, 44.94946757, 7],
              [-93.14662425, 44.95455225, 4],
              [-93.062381, 44.977715, 3],
              [-93.049631, 44.96583443, 7],
              [-93.0049955, 44.946905, 2],
              [-93.15710877, 44.95644538, 13],
              [-93.181341, 44.9121385, 2],
              [-93.187244, 44.959861, 1],
              [-93.080674, 44.919615, 2],
              [-93.18303833, 44.958378, 3],
              [-93.1270614, 44.9618292, 5],
              [-93.073984, 44.953229, 1],
              [-93.009641, 44.975316, 2],
              [-93.140681, 44.958558, 2],
              [-93.192449, 44.941643, 2],
              [-93.06745033, 44.96115867, 3],
              [-93.07449961, 44.95697844, 18],
              [-93.11600267, 44.97530578, 9],
              [-93.11996775, 44.97529825, 4],
              [-93.09588975, 44.9888325, 4],
              [-93.1669, 44.954045, 3],
              [-93.047238, 44.945409, 4],
              [-93.0866195, 44.92840525, 4],
              [-93.10191133, 44.94920367, 3],
              [-93.1857035, 44.94807317, 6],
              [-93.1011385, 44.94525725, 4],
              [-93.146872, 44.9644335, 2],
              [-93.0427075, 44.967498, 6],
              [-93.12428533, 44.98222867, 3],
              [-93.0603555, 44.9780575, 2],
              [-93.121248, 44.968373, 2],
              [-93.0865548, 44.9461564, 5],
              [-93.195763, 44.982157, 2],
              [-93.097861, 44.94368333, 3],
              [-93.04339933, 44.9827, 3],
              [-93.01742957, 44.964695, 7],
              [-93.146511, 44.951285, 8],
              [-93.041428, 44.948746, 2],
              [-93.07911483, 44.96134033, 6],
              [-93.18756517, 44.918173, 6],
              [-93.1258456, 44.9506534, 5],
              [-93.082613, 44.938469, 3],
              [-93.08035364, 44.93128764, 11],
              [-93.1075958, 44.96020993, 15],
              [-93.0343392, 44.9576872, 5],
              [-93.162323, 44.9532585, 2],
              [-93.1406205, 44.9474475, 2],
              [-93.13901, 44.953043, 2],
              [-93.020354, 44.984161, 1],
              [-93.16709771, 44.92716571, 7],
              [-93.1567365, 44.9468535, 4],
              [-93.113157, 44.94131, 3],
              [-93.171602, 44.9011435, 6]
          ]

          function addClusterData(clData) {
              for (i = 0; i < clData.length; i++) {
                  addCluster(clData[i][0], clData[i][1], clData[i][2]);
              }
          }
          addClusterData(clusterData);

          function addClusters() {
              addCluster(-93.069405, 44.960204, 2);
              addCluster(-93.11740745, 44.95585436, 11);
              addCluster(-93.06163175, 44.97099925, 4);
              addCluster(-93.177168, 44.948406, 1);
              addCluster(-93.050743, 44.973926, 2);
              addCluster(-93.101472, 44.96478, 1);
              addCluster(-93.1064245, 44.9369155, 2);
              addCluster(-93.1338625, 44.962443, 2);
              addCluster(-93.06865825, 44.9551175, 4);
              addCluster(-93.1270625, 44.934119, 4);
              addCluster(-93.087492, 44.977259, 2);
              addCluster(-93.064169, 44.956594, 4);
              addCluster(-93.188657, 44.9343265, 4);
              addCluster(-93.06699167, 44.97658767, 9);
              addCluster(-93.1059006, 44.9418504, 5);
              addCluster(-93.03006367, 44.972343, 3);
              addCluster(-93.14787883, 44.91334283, 6);
              addCluster(-93.103389, 44.96713833, 3);
              addCluster(-93.099918, 44.940664, 5);
              addCluster(-93.096847, 44.973464, 3);
              addCluster(-93.126396, 44.955778, 7);
              addCluster(-93.04313, 44.977542, 1);
              addCluster(-93.192429, 44.947811, 4);
              addCluster(-93.172118, 44.908988, 2);
              addCluster(-93.166962, 44.935166, 1);
              addCluster(-93.04435775, 44.990652, 4);
              addCluster(-93.123907, 44.95543525, 4);
              addCluster(-93.105878, 44.991896, 4);
              addCluster(-93.0245815, 44.9693577, 10);
              addCluster(-93.1571918, 44.9420652, 5);
              addCluster(-93.071017, 44.970272, 2);
              addCluster(-93.07475867, 44.92506, 3);
              addCluster(-93.0553485, 44.9537545, 2);
              addCluster(-93.139016, 44.955645, 4);
              addCluster(-93.00484, 44.935282, 1);
              addCluster(-93.097009, 44.955924, 2);
              addCluster(-93.04304871, 44.96258886, 7);
              addCluster(-93.11609375, 44.9632765, 4);
              addCluster(-93.152618, 44.952577, 2);
              addCluster(-93.10435575, 44.97534363, 8);
              addCluster(-93.13518525, 44.94042075, 4);
              addCluster(-93.074433, 44.984111, 3);
              addCluster(-93.189674, 44.918111, 1);
              addCluster(-93.1272035, 44.94116, 8);
              addCluster(-93.024806, 44.965529, 3);
              addCluster(-93.080735, 44.954729, 1);
              addCluster(-93.110532, 44.924825, 1);
              addCluster(-93.144386, 44.93856225, 4);
              addCluster(-93.114168, 44.96220767, 6);
              addCluster(-93.09589014, 44.94720771, 7);
              addCluster(-93.07247067, 44.991751, 3);
              addCluster(-93.0368295, 44.9900075, 6);
              addCluster(-93.167026, 44.940708, 5);
              addCluster(-93.1822875, 44.94754025, 4);
              addCluster(-93.0557995, 44.9611995, 6);
              addCluster(-93.09466433, 44.953922, 3);
              addCluster(-93.153705, 44.955736, 3);
              addCluster(-93.0735355, 44.969801, 4);
              addCluster(-93.16644871, 44.95598857, 7);
              addCluster(-93.092731, 44.957759, 1);
              addCluster(-93.09205033, 44.96701233, 3);
              addCluster(-93.14760317, 44.97368133, 6);
              addCluster(-93.1773535, 44.911486, 2);
              addCluster(-93.05567, 44.920353, 1);
              addCluster(-93.01025, 44.96922, 1);
              addCluster(-93.071871, 44.9542615, 4);
              addCluster(-93.1929772, 44.9194324, 5);
              addCluster(-93.0195182, 44.9495574, 5);
              addCluster(-93.1083425, 44.9409035, 6);
              addCluster(-93.132824, 44.950951, 1);
              addCluster(-93.0253746, 44.963003, 5);
              addCluster(-93.050428, 44.977414, 1);
              addCluster(-93.040412, 44.977533, 1);
              addCluster(-93.10604, 44.96846483, 6);
              addCluster(-93.167189, 44.95190467, 9);
              addCluster(-93.131919, 44.95636825, 4);
              addCluster(-93.146556, 44.946618, 4);
              addCluster(-93.013232, 44.9527735, 2);
              addCluster(-93.0849975, 44.936485, 2);
              addCluster(-93.04767133, 44.95273833, 3);
              addCluster(-93.144688, 44.959504, 1);
              addCluster(-93.0594715, 44.9599005, 2);
              addCluster(-93.146749, 44.952144, 2);
              addCluster(-93.081921, 44.969932, 4);
              addCluster(-93.030351, 44.98294, 1);
              addCluster(-93.0640565, 44.981301, 2);
              addCluster(-93.03589767, 44.976358, 6);
              addCluster(-93.09203591, 44.94838236, 11);
              addCluster(-93.165732, 44.90281467, 3);
              addCluster(-93.13482, 44.94853, 3);
              addCluster(-93.0266788, 44.9781776, 5);
              addCluster(-93.126099, 44.991794, 2);
              addCluster(-93.15278917, 44.92700217, 6);
              addCluster(-93.06010133, 44.96390433, 3);
              addCluster(-93.0744145, 44.97722044, 16);
              addCluster(-93.00876767, 44.95145833, 3);
              addCluster(-93.121092, 44.957178, 2);
              addCluster(-93.1439625, 44.9555775, 2);
              addCluster(-93.065961, 44.970314, 4);
              addCluster(-93.14975075, 44.955824, 4);
              addCluster(-93.2023335, 44.9646115, 4);
              addCluster(-93.1068938, 44.979451, 15);
              addCluster(-93.166948, 44.981006, 2);
              addCluster(-93.162208, 44.9562406, 5);
              addCluster(-93.04576314, 44.95678114, 7);
              addCluster(-93.102041, 44.92839, 2);
              addCluster(-93.16839433, 44.96706033, 3);
              addCluster(-93.12648933, 44.96856333, 3);
              addCluster(-93.11090683, 44.948464, 6);
              addCluster(-93.046506, 44.9763795, 2);
              addCluster(-93.201674, 44.986726, 2);
              addCluster(-93.0554575, 44.9772585, 6);
              addCluster(-93.096412, 44.929426, 2);
              addCluster(-93.103292, 44.945083, 8);
              addCluster(-93.0049492, 44.9542772, 5);
              addCluster(-93.0877727, 44.9508741, 10);
              addCluster(-93.14787625, 44.94114325, 8);
              addCluster(-93.02824767, 44.986979, 3);
              addCluster(-93.138369, 44.923637, 2);
              addCluster(-93.199809, 44.975194, 2);
              addCluster(-93.096236, 44.9644308, 5);
              addCluster(-93.086395, 44.973055, 2);
              addCluster(-93.12117125, 44.9302015, 4);
              addCluster(-93.06353, 44.962756, 3);
              addCluster(-93.085004, 44.941318, 2);
              addCluster(-93.113792, 44.966707, 1);
              addCluster(-93.02521567, 44.99015167, 3);
              addCluster(-93.16699175, 44.9596995, 4);
              addCluster(-93.0859436, 44.9858716, 5);
              addCluster(-93.066929, 44.926007, 2);
              addCluster(-93.02526033, 44.955894, 3);
              addCluster(-93.173498, 44.930488, 1);
              addCluster(-93.026117, 44.951877, 8);
              addCluster(-93.13647233, 44.952159, 3);
              addCluster(-93.0908806, 44.9615186, 5);
              addCluster(-93.02939675, 44.9671625, 4);
              addCluster(-93.084215, 44.949231, 2);
              addCluster(-93.09639, 44.976832, 3);
              addCluster(-93.146213, 44.952565, 1);
              addCluster(-93.069316, 44.965761, 1);
              addCluster(-93.0855915, 44.9559805, 2);
              addCluster(-93.17777925, 44.956241, 4);
              addCluster(-93.16193825, 44.9609055, 4);
              addCluster(-93.1088542, 44.9558994, 5);
              addCluster(-93.10398686, 44.94343943, 7);
              addCluster(-93.15568475, 44.98286175, 4);
              addCluster(-93.16692, 44.946625, 3);
              addCluster(-93.09859443, 44.94946757, 7);
              addCluster(-93.14662425, 44.95455225, 4);
              addCluster(-93.062381, 44.977715, 3);
              addCluster(-93.049631, 44.96583443, 7);
              addCluster(-93.0049955, 44.946905, 2);
              addCluster(-93.15710877, 44.95644538, 13);
              addCluster(-93.181341, 44.9121385, 2);
              addCluster(-93.187244, 44.959861, 1);
              addCluster(-93.080674, 44.919615, 2);
              addCluster(-93.18303833, 44.958378, 3);
              addCluster(-93.1270614, 44.9618292, 5);
              addCluster(-93.073984, 44.953229, 1);
              addCluster(-93.009641, 44.975316, 2);
              addCluster(-93.140681, 44.958558, 2);
              addCluster(-93.192449, 44.941643, 2);
              addCluster(-93.06745033, 44.96115867, 3);
              addCluster(-93.07449961, 44.95697844, 18);
              addCluster(-93.11600267, 44.97530578, 9);
              addCluster(-93.11996775, 44.97529825, 4);
              addCluster(-93.09588975, 44.9888325, 4);
              addCluster(-93.1669, 44.954045, 3);
              addCluster(-93.047238, 44.945409, 4);
              addCluster(-93.0866195, 44.92840525, 4);
              addCluster(-93.10191133, 44.94920367, 3);
              addCluster(-93.1857035, 44.94807317, 6);
              addCluster(-93.1011385, 44.94525725, 4);
              addCluster(-93.146872, 44.9644335, 2);
              addCluster(-93.0427075, 44.967498, 6);
              addCluster(-93.12428533, 44.98222867, 3);
              addCluster(-93.0603555, 44.9780575, 2);
              addCluster(-93.121248, 44.968373, 2);
              addCluster(-93.0865548, 44.9461564, 5);
              addCluster(-93.195763, 44.982157, 2);
              addCluster(-93.097861, 44.94368333, 3);
              addCluster(-93.04339933, 44.9827, 3);
              addCluster(-93.01742957, 44.964695, 7);
              addCluster(-93.146511, 44.951285, 8);
              addCluster(-93.041428, 44.948746, 2);
              addCluster(-93.07911483, 44.96134033, 6);
              addCluster(-93.18756517, 44.918173, 6);
              addCluster(-93.1258456, 44.9506534, 5);
              addCluster(-93.082613, 44.938469, 3);
              addCluster(-93.08035364, 44.93128764, 11);
              addCluster(-93.1075958, 44.96020993, 15);
              addCluster(-93.0343392, 44.9576872, 5);
              addCluster(-93.162323, 44.9532585, 2);
              addCluster(-93.1406205, 44.9474475, 2);
              addCluster(-93.13901, 44.953043, 2);
              addCluster(-93.020354, 44.984161, 1);
              addCluster(-93.16709771, 44.92716571, 7);
              addCluster(-93.1567365, 44.9468535, 4);
              addCluster(-93.113157, 44.94131, 3);
              addCluster(-93.171602, 44.9011435, 6);

          }


          clusters[1].symbol.outline.color.b = 255;
          clusters[1].symbol.outline.color.r = 0;

          view.ui.add("paneDiv", "top-right");
      });
