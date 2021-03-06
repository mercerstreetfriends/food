var mapOn = 0;
var filterOn = 1;
var rawData;
var rawArrayData;
var cleanArray=[];
var whichDot;
var dotGroup = new L.featureGroup();
var hiliteGroup = new L.featureGroup();
var hiddenListings=[];
var eligibility=[];
var days=[];
var food=[];
var sitetypes = [];
var times =[];
var indexOfVariables = [];
var selectedSites =[];
var selectedSiteAllData = [];
var displayedDirectory =[];
var searchedSites = [];
var searchedSitesFull = [];

var today = new Date();


function mapToggle(){

  var numchecks = $("input[type=checkbox]:checked").length;

	if (mapOn !== 0 ) {
		document.getElementById("mapid").style.display = 'none';
		mapOn = 0;
		document.getElementById("mapclose").innerHTML = 'SHOW MAP';
		
	}
	
	else {
		document.getElementById("mapid").style.display = 'block';
		mapOn = 1;
		document.getElementById("mapclose").innerHTML = 'HIDE MAP';
	}
	mappie.invalidateSize();
	bounds = dotGroup.getBounds();
	
	if ((document.querySelector('#freesearch').value == '')&&(numchecks == 0)) {
			mappie.setView([40.220028,-74.766263],13);
	}
	else{ mappie.fitBounds(bounds); }
}


function filterToggle(){
	if (filterOn != 1) {
		document.getElementById("menubar").style.display = 'block';
		filterOn =1;
	}
	
	else {
		document.getElementById("menubar").style.display = 'none';
		filterOn = 0;
	}
}

function categoryToggle(e) {
	if (d3.select("#" + e).style("display") == 'block') {
		d3.select("#" + e).style("display", "none");
	}
	else {
		d3.select("#" + e).style("display", "block");
	}
}


const mappie = L.map('mapid', {scrollWheelZoom: false}).setView([40.220028,-74.766263],13);



L.esri.basemapLayer('Topographic');
mapboxBase = L.tileLayer('https://api.mapbox.com/styles/v1/ixd-maps/cjzkdbpoy5jn81clijbwfi0xe/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiaXhkLW1hcHMiLCJhIjoiY2p5aTNyeDJjMDZiNzNjbzJ3NXg4enBnNyJ9.Pu8sks70-J3xwfXbVYk2rA', {
	maxZoom:17,
	attribution: 'iana dikidjieva with mapbox'
}).addTo(mappie);
dotGroup.addTo(mappie);

  var arcgisOnline = L.esri.Geocoding.arcgisOnlineProvider();

var esriSearch = L.esri.Geocoding.geosearch({
    providers: [
      arcgisOnline,
      L.esri.Geocoding.mapServiceProvider({
        label: 'States and Counties',
        url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer',
        layers: [2, 3],
        searchFields: ['NAME', 'STATE_NAME']
      })
    ], 	  
	zoomToResult:false,
	allowMultipleResults:false,
	placeholder: 'Enter an address for sites within 1/2 mile'
   
  });
  
var geoSearchResults = L.layerGroup().addTo(mappie);  
var locArray = [];  
  
  esriSearch.on('results', function (data) {
	locArray = [];
	displayedDirectory = [];
    geoSearchResults.clearLayers();
    for (var i = data.results.length - 1; i >= 0; i--) {
//      geoSearchResults.addLayer(L.marker(data.results[i].latlng));
    }
	var centerLatLng = data.latlng;
	
	for (j in cleanArray){
	var lat = cleanArray[j].Latitude;
	var lng = cleanArray[j].Longitude;
		latlng = L.latLng(lat,lng);
		if (centerLatLng.distanceTo(latlng) <=700) {
			locArray.push(cleanArray[j]);
		}
	}
//			console.log(locArray);
//			console.log(cleanArray);
	if (locArray.length !== 0) {
		buildMap(locArray,0);
	}
  });
  
  esriSearch.addTo(mappie);


mappie.on('moveend', function(e) {
	visibleListings();
});


/* legend */

var legend = L.control({position: 'bottomleft'});

legend.onAdd = function (mappie) {

    var div = L.DomUtil.create('div', 'info legend');
        div.innerHTML +=
            '<i style="background:#fe019a"></i> ' + ' YOUTH MEALS' + '<br>' +
			'<i style="background:#900C3F"></i> ' + ' OTHER SITES' + '<br>';


    return div;
};

legend.addTo(mappie);


function visibleListings() {
var visiList = [];

   for (i in dotGroup._layers) {
	latlng = dotGroup._layers[i]._latlng;
	id = dotGroup._layers[i].id;
	if (mappie.getBounds().contains(latlng)) {
		visiList.push(id);
		}
	}

	if (mapOn == 1) {
	for (j in displayedDirectory) {
		document.getElementById("listing"+j).style.display = 'none';
	}
   
	for (k in visiList) {
		document.getElementById("listing"+visiList[k]).style.display = 'block';
	}
	}
   
}

function setUpClean(data, key) {

	return [
		...new Map(
		data.map(x => [key(x),x])
		).values()
	
	]

}

function markercolor(type) {

switch(type) {
  case "YOUTH MEALS":
    return "#fe019a";
    break;

  default:
    return "#900C3F";
}


}

function mapFocus(i) {
whichSpot = displayedDirectory[i];

dotGroup.eachLayer(function (layer) {
    if (layer.id == i) {
		layer.openTooltip();
	}

});


var latlng = [whichSpot.Latitude, whichSpot.Longitude];

	mappie.setView(latlng, 16);

}

function markerClick(e){
		var pos = e.layer.id;
		for (j in displayedDirectory) {
		  if (j !== pos) {
				document.getElementById("listing"+j).style.display = 'none';
			}
		  else {
		  document.getElementById("listing"+j).style.display = 'block';
		  }
		  
		}
}

<!-- search with Fuse -->

const options = {
  minMatchCharLength: 4,
  findAllMatches:false,
  threshold: 0.4,
  keys: ['Title', 'Site_Type', 'Location', 'Food', 'Time_of_day', 'Eligibility', 'Event', 'Description', 'Contact']
}

function freeFuseSearch() {
	
  selectedSites = [];
  searchedSitesFull = [];
  var numchecks = $("input[type=checkbox]:checked").length;
  val = document.querySelector('#freesearch').value;
	
	const fuse = new Fuse(cleanArray, options);
	searchedSites = fuse.search(val);
	
	for (i in searchedSites) {
		var siteDeets = searchedSites[i].item;
		searchedSitesFull.push(siteDeets);
	}

	if ((val.length == 0)&&(numchecks == 0)) {
		cleanArray = sortSiteListing(cleanArray);
		buildMap(cleanArray,0);
		}
	else if (val.length >0) {
		buildMap(searchedSitesFull, 1);
	}
  getSelectedVariables();
}

document.querySelector("#freesearch").addEventListener("change",function () {
  freeFuseSearch();
})

function sortSiteListing(data) {
	return data.slice().sort((a, b) => d3.descending(a.Site_Type, b.Site_Type) || d3.descending(a.Single_Day, b.Single_Day)|| d3.ascending(a.Title, b.Title));
}

mappie.on('zoomend', function () {
	var currZoom = mappie.getZoom();
//	console.log(currZoom);
	if (currZoom < 13) {
		for (i in dotGroup._layers) {
			dotGroup._layers[i].setRadius(7);
		}
	}
	else {
		for (i in dotGroup._layers) {
			dotGroup._layers[i].setRadius(10);
		}
	}
});


function buildMap(data, calledbysearch) {
	document.getElementById("artTableHolder").innerHTML = '';
	dotGroup.clearLayers(); 
	
	/* sorting by Summer Meal Sites then alphabetical UNLESS there is a specific thing searched in searchbox */
	if (calledbysearch !== 1) {
		data = sortSiteListing(data);
		console.log(calledbysearch);
		console.log(sortSiteListing(data));
	}
	
	displayedDirectory = data;
	//console.log(data);
	for (i in data) {
		var spot = data[i];
		whichDot = spot;

		var latlng = [spot.Latitude, spot.Longitude];
		var markerColor = markercolor(spot.Site_Type);
		var marker = new L.CircleMarker(latlng, {radius: 10, fillColor:markerColor, opacity:1, fillOpacity: 0.8, color:'#fff'});
		marker.id = i;
		marker.bindTooltip("<b>"+ spot.Title + "</b><br>" + spot.Location);
		dotGroup.addLayer(marker);
		
		var listingDiv = document.createElement('div');
		listingDiv.setAttribute('class','sitePod');
		listingDiv.setAttribute('id','listing'+i);
		
		var xTitle = document.createElement('div');
		xTitle.setAttribute('class','siteTitle');
		xTitle.setAttribute('id',i);
		xTitle.setAttribute("onClick","mapFocus(this.id)");

		var siteHeader = 
					"<h3>" + spot.Title + "</h3>" +
			"<h4 class = 'siteSubhead'>" + spot.Location + "</h4>" +
			"<div style='color:#106da8; margin-top:-18px;padding-bottom:20px;'>Site contact: " + spot.Contact + "</div>" ;
		
		xTitle.innerHTML = siteHeader;
		
		if (spot.Site_Type == 'YOUTH MEALS') {
			var sumSite = document.createElement('div');
			sumSite.setAttribute('class','siteFlag');
			sumSite.innerHTML = ' YOUTH MEALS ';
			listingDiv.appendChild(sumSite);
			
			var sumDot = document.createElement('div');
			sumDot.setAttribute('class','siteDot');
			listingDiv.appendChild(sumDot);
		}
		
		if (spot.Single_Day !== '') {
			var singleDaySite = document.createElement('div');
			singleDaySite.setAttribute('class','siteFlag');
			singleDaySite.setAttribute('style','background-color:#ffff00;color:#000;');
			singleDaySite.innerHTML = ' EVENT ';
			listingDiv.appendChild(singleDaySite);
			var singleDayDot = document.createElement('div');
			singleDayDot.setAttribute('class','siteDot');
			singleDayDot.setAttribute('style','background-color:#ffff00;');
			listingDiv.appendChild(singleDayDot);
		}		

		listingDiv.appendChild(xTitle);	
		var listing;
		
		if (spot.Single_Day !== '') {
			var slicer = spot.Day.indexOf(" ");
			var day = spot.Day.substring(0, slicer);
			listing = 
			"<b>DATE: " + day + ", " + spot.Single_Day + "<br>" + "TIME: " + spot["Start Time"] + " - " + spot["End Time"] + "</b>" +
			"<br><br>" + 
			spot.Description + 
						"<br><br>" + 
			"<b>People served: </b>" + spot.Eligibility + "<br>" +
			"<b>Food available: </b>" + spot.Food + "<br>" +
			"<b>Time of day: </b>" + spot.Time_of_day + "<br>" ;
		}	
		else { listing = 
						spot.Description + 
						"<br><br>" + 
			"<b>This site serves: </b>" + spot.Eligibility + "<br>" +
			"<b>Food available: </b>" + spot.Food + "<br>" +
			"<b>Time of day: </b>" + spot.Time_of_day + "<br>" ;
			}
		listingDiv.innerHTML += listing;
		hiddenListings.push(listingDiv);
		
				document.getElementById("artTableHolder").appendChild(listingDiv);
		
	
	}
	
	dotGroup.on('click', function(e) {markerClick(e)});
	bounds = dotGroup.getBounds();
	mappie.fitBounds(bounds);
	mappie.setView([40.220028,-74.766263],13);
}

function addDays() {
	for (i in rawArrayData) {
		for (j in cleanArray) {
			if (rawArrayData[i].Title == cleanArray[j].Title){
				cleanArray[j].Day += " " + rawArrayData[i].Day;
			}
		}
	}
}

function setDisplays() {
   titleArray = setUpClean(rawArrayData, it => it.Title);
   midArray = [];
   
   for (i in rawArrayData) {
	if (rawArrayData[i].Event != '') {
		if (rawArrayData[i].Event == 'Event') {
			var datecomp = new Date(rawArrayData[i].Start);
		//	console.log(today, datecomp);
			if (today < datecomp) {
				console.log(rawArrayData[i].Start, rawArrayData[i].Title, rawArrayData[i].Event);
				midArray.push(rawArrayData[i]);
				}
			}
		else if (rawArrayData[i].Event !== 'Event'){
			midArray.push(rawArrayData[i]);
			}
		}
   }
   
   titleArray.forEach( function (i) { 
	if(midArray.indexOf(i) < 0) {
		var datecomp = new Date(i.Start);
		if ((i.Event == "Event") && (today < datecomp)) {
			midArray.push(i);
		}
		else if (i.Event !== "Event") {
			midArray.push(i);
			}
		}
	});
	cleanArray = midArray;
   
   addDays();
   pullUniques();
 	buildMap(cleanArray, 0);
 
}

function clearAllSearches() {
		$.each($("input[type=checkbox]"), function(){
			this.checked = false;
		});	

		searchedSitesFull = [];
		locArray = [];
		selectedSites = [];
		unSelectedSites = [];
		carrySelection = [];
		displayedDirectory = [];
		document.querySelector('#freesearch').value = '';
		buildMap(cleanArray, 0);

}


function getSelectedVariables(){
	var numchecks = $("input[type=checkbox]:checked").length;
	var useArray = [];
	
	if (searchedSitesFull.length>0) {
		useArray = searchedSitesFull;
	}
	
	else if (locArray.length > 0) {
		useArray = locArray;
	}
	
	else {
		useArray = cleanArray;
	}

	var unSelectedSites = [];
	var selectedSites = [];
	selectedSiteAllData = [];
	var carrySelection = [];
	
  if (numchecks > 0) {
	for (i in indexOfVariables) {
		var thisColumn = [];
		var set = indexOfVariables[i][1];
		var columnName = indexOfVariables[i][2];
		$.each($("input[name='" + set + "']:checked"), function(){
				val = $(this).val();
                for (j in useArray) {
					if(useArray[j][columnName].includes(val)==true) {
						thisColumn.push(useArray[j].Title);
					};
					if ((val == '18 and under') && (useArray[j]['Eligibility'].includes('TPS students')==true)) {
						thisColumn.push(useArray[j].Title);
					}
				}
            });
		if (thisColumn.length >0) {
			selectedSites.push(thisColumn);	
		}
		console.log(thisColumn);
	}

	var carrySelection = selectedSites.shift().reduce(function(res, v) {
    if (res.indexOf(v) === -1 && selectedSites.every(function(a) {
        return a.indexOf(v) !== -1;
    })) res.push(v);
    return res;
		}, []);
	
	for (a in cleanArray) {
		for (b in carrySelection) {
			if (cleanArray[a].Title == carrySelection[b]) {
				selectedSiteAllData.push(cleanArray[a]);
			}
		}
	}

	buildMap(selectedSiteAllData, 0);
	}
	
	else { buildMap (useArray, 0);}

}

function setUpClickers() {

	for (i in indexOfVariables) {
		var headername = "ul" + i;
		var catBox = "category" + i;
		d3.select("#menubar").append("ul")
			.attr("class", "selectorclass")
			.attr("id", headername);
			
		d3.select("#" + headername).append("b")
			.text(indexOfVariables[i][1])
			.attr("style", "text-transform:uppercase")
			.attr("class", "categorytitle")
			.attr("onClick","categoryToggle('category" + i + "')");

		d3.select("#" + headername).append("div")
			.attr("id", catBox)
			.attr("style", "display:none");		
		
		for (j in indexOfVariables[i][0]){
			selectorname = indexOfVariables[i][1];
			d3.select("#" + catBox).append("li");
			d3.select("#" + catBox).append("input").attr("type","checkbox")
				.attr("onClick", "getSelectedVariables()")
				.attr("name",selectorname)
				.attr("value",indexOfVariables[i][0][j]);
			d3.select("#" + catBox).append("label")
				.text(indexOfVariables[i][0][j]);
		}		
	}

}


function pullUniques(){
	sitetypes = ["YOUTH MEALS", "OTHER"];
		indexOfVariables.push([sitetypes, "Site Types", "Site_Type"]);
	
	days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
		indexOfVariables.push([days, "Days", "Day"]); 
		
	times = ["Morning", "Midday", "Afternoon", "Evening", "24 Hours"];
		indexOfVariables.push([times, "Times of Day", "Time_of_day"]);
		console.log(indexOfVariables);
		
	food = ["Meals - grab & go", "Pantry items"];
		indexOfVariables.push([food, "Food offered","Food"]);
		
	eligibility = [...new Set(cleanArray.map(x=>x.Eligibility))].sort(d3.ascending); 
		eligibilityArray = ['18 and under', 'TPS students', 'Clients', 'No known restrictions'];
		indexOfVariables.push([eligibilityArray, "People served", "Eligibility"]);
		
	setUpClickers();
	
}


  function init() {
    Tabletop.init( { key: 'https://docs.google.com/spreadsheets/d/1XEy-4bzgaT8NUgIP5VzurfVybxpz-bOdchod8wP23PQ/pubhtml',
                     callback: showInfo,
                     simpleSheet: false } )
  }

  function showInfo(data, tabletop) {
   rawData = data["DATA SHEET"];
   rawArrayData = rawData.elements;
   console.log(rawArrayData);
   setDisplays();


  }
  


  window.addEventListener('DOMContentLoaded', init)