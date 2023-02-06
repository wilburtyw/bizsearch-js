// STABLE - Clear submit form and results
function pageClear() {
	document.getElementById("term").value = '';
	document.getElementById("radius").value = '';
	document.getElementById("location").value = '';
	document.getElementById("category").selectedIndex = 0;
	document.getElementById("div-result").innerHTML = "";
	document.getElementById("div-detail").innerHTML = "";
	console.log("pageClear(): Complete!"); // debug
}

// Checkbox of address detection (listener)
var checkbox = document.querySelector("#ifDetect");
checkbox.addEventListener('change', async function() {
	var locDiv = document.getElementById("div-location");
	var locInput = document.getElementById("location");
	if (!this.checked) {
		locInput.removeAttribute('disabled');
		locInput.required = "true";
		console.log("checkbox: changed"); // debug
	} else {
		locInput.removeAttribute('required');
		document.getElementById("location").value = ''; // Clean value
		locInput.disabled = "true";
		await fetchIpinfo(); // Fetch from Ipinfo and await
		console.log("checkbox: changed"); // debug
	}
});

// Global variable storing latitute and longitude
var lat
var lng
// fetch IP from ipinfo API
async function fetchIpinfo() {
	return fetch("https://ipinfo.io/json?token=7b00847c694a06")
	.then(
		(response) => response.json())
	.then(
		function(jsonResponse){
			var loc = jsonResponse.loc.split(",")
			lat = loc[0]
			lng = loc[1]
			console.log("fetchIpinfo(): Fetch Complete!"); // debug
			return true
		})
}

// fetch Google Geocoding
async function fetchGeoCode(url) {
	console.log("GEOCODE: Begin fetching..."); // debug
	return fetch(url)
	.then(
		(response) => response.json())
	.then(
		function(jsonResponse){
			console.log(jsonResponse, "GEOCODE: returning result") // debug
			if (jsonResponse.results.length == 0) {
				lat = -1;
				lng = -1;
			} else {
			lat = jsonResponse.results[0].geometry.location.lat
			lng = jsonResponse.results[0].geometry.location.lng
			}
		})
}

// Submit
async function submitInfo(e) {
	const ischeck = document.querySelector("#ifDetect");
	if (ischeck.checked) {
		document.getElementById("lat").value = lat
		document.getElementById("lng").value = lng
		console.log("FETCHED FROM IPINFO", lat, lng)
	}
	else {
		let loca = document.getElementById("location").value;
		let url = "https://maps.googleapis.com/maps/api/geocode/json?address="
		url = url.concat(loca + "&key=AIzaSyCQmhg-_5obRuWviOY5OjSkL6OZn-cb6bY");
		await fetchGeoCode(url)
		console.log("CHECKBOX: Address Fetched Automatically", lat, lng); // debug
		document.getElementById("lat").value = lat
		document.getElementById("lng").value = lng
		console.log("FETCHED FROM GEOCODE", lat, lng)
	}
}

document.getElementById("submitButton").addEventListener("click", async e => {
	e.preventDefault(); // Prevent submit
	if (!document.getElementById("term").checkValidity()) {
		document.getElementById("term").reportValidity();
		return false;
	} else if (!document.getElementById("radius").checkValidity()) {
		document.getElementById("radius").reportValidity();
		return false;
	} else if (!document.getElementById("location").checkValidity()) {
		document.getElementById("location").reportValidity();
		return false;
	} else {
		await submitInfo(); // Fetch lat and lng
		console.log("XMLHttpRequest: Request Begin")
		// Clean Details
		document.getElementById("div-detail").innerHTML = "";
		// XML request
		var xhttp = new XMLHttpRequest();
		var result = document.getElementById('div-result');
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				result.innerHTML = generateHTML(JSON.parse(this.responseText)); // Another callback here
				var detail_anchor = document.getElementsByClassName("detail");
				for (var i = 0; i < detail_anchor.length; i++) {
					detail_anchor[i].addEventListener('click', function(e) {
						e.preventDefault();
					}, false);
				}
				result.scrollIntoView(true);
			} else {
				// result.innerHTML = "<div class = \"error\">Processing</div>";
			}
		}
		if (lat == -1) {
			result.innerHTML = "<div class = \"error\">Invalid Input!</div>";
		} else {
			var terms = document.getElementById("term").value
			var radi = document.getElementById("radius").value
			var cs = document.getElementById("category").value
			var params = '/bizsubmit?' + "term=" + terms + "&latitude=" + lat + "&longitude=" + lng
			if (radi != "") {
				radi_int = parseInt(radi) * 1609;
				r = radi_int.toString();
				params = params + "&radius=" + r
			}
			if (cs != "Default") params = params + "&categories=" + cs
			xhttp.addEventListener('load', reqListener);
			xhttp.open('GET', params, true);
			xhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
			xhttp.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
			xhttp.send();
		}
	}
});

function generateHTML(jsObj) {
	if ("error" in jsObj) {
		inHtml = "<div class = \"error\">Invalid Input!</div>"
	} else if (jsObj.total == 0) {
		inHtml = "<div class = \"error\">No record has been found.</div>"
	} else {
		inHtml = "<table id = resultTable>";
		inHtml += "<thead><tr><td>No.</td><td>Image</td><td onclick = sortTable(2) class = theadButton>Business Name</td><td onclick = sortTable(3) class = theadButton>Rating</td><td onclick = sortTable(4) class = theadButton>Distance (miles)</td></tr></thead>"
		inHtml += "<tbody>";
		// output out the values
		for(i=0;i<jsObj.businesses.length;i++) { //do for all planes (one per row)
			Biz=jsObj.businesses[i]; //get properties of a plane (an object)
			d = Biz.distance/1609;
			d = d.toFixed(2);
			inHtml+="<tr>"; //start a new row of the output table
			n = i+1
			inHtml += "<td class = texts>" + n.toString() + "</td>"
			inHtml += "<td class = images><img src='"+ Biz.image_url +"'></td>"
			inHtml += "<td class = texts><a href = \"#div-detail\" class=\"detail\" onclick = getDetail(\"" + Biz.id + "\");return\ false;>" + Biz.name + "</a></td>"
			inHtml += "<td class = texts>" + Biz.rating + "</td>"
			inHtml += "<td class = texts>" + d.toString() + "</td>"
			inHtml += "</tr>";
		}
		inHtml += "</tbody>";
		inHtml += "</table>";
	}
	return inHtml
}

function getDetail(id) {
	console.log("XMLHttpRequest: Request for getting detail Begin")
	var xhttp = new XMLHttpRequest();
	var result = document.getElementById('div-detail');
	xhttp.onreadystatechange = function() {
		console.log("Onready")
		if (this.readyState == 4 && this.status == 200) {
			result.innerHTML = generateDetail(JSON.parse(this.responseText)); // Another callback here
			result.scrollIntoView(true);
		} else {
			// result.innerHTML = "Processing";
		}
	}
	params = "/getdetail?id=" + id
	console.log(params)
	xhttp.addEventListener('load', reqListener);
	xhttp.open('GET', params, true);
	xhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
	xhttp.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
	xhttp.send();
}

function generateDetail(jsObj) {
	// Title
	inHtml = "<div class=\"div-detail-in\"><div class=\"single\"><h2>" + jsObj.name + "</h2></div><hr>"
	// BEGIN TEXT CONTENT
	inHtml += "<div class=\"double\">"
	// STATUS
	if ("hours" in jsObj) {
		inHtml += "<div class=\"texts\"><h2>Status</h2>"
		if (jsObj.hours[0].is_open_now == true) inHtml += "<p class=\"open\">Open Now</p>"
		else if (jsObj.hours[0].is_open_now == false) inHtml += "<p class=\"close\">Closed</p>"
		else inHtml += "<p class=\"unk\">Unknown</p>"
		inHtml += "</div>"
	}
	// Address
	if (jsObj.location.display_address != "") {
		inHtml += "<div class=\"texts\"><h2>Address</h2>"
		inHtml += "<p>" + jsObj.location.display_address + "</p></div>"
	}
	// Category
	if (jsObj.categories != 0) {
		inHtml += "<div class=\"texts\"><h2>Category</h2><p>"
		for (i = 0; i < jsObj.categories.length; i++) {
			inHtml += jsObj.categories[i].title;
			if (i != jsObj.categories.length-1) inHtml += " | ";
		}
		inHtml += "</p></div>"
	}
	// Phone Number
	if (jsObj.display_phone != "") {
		inHtml += "<div class=\"texts\"><h2>Phone Number</h2>"
		inHtml += "<p>" + jsObj.display_phone + "</p></div>"
	}
	// Transaction
	if (jsObj.transactions.length != 0) {
		inHtml += "<div class=\"texts\"><h2>Transactions Supported</h2><p>"
		detail_t = jsObj.transactions;
		for (i = 0; i < detail_t.length; i++) {
			inHtml += detail_t[i];
			if (i != detail_t.length-1) inHtml += " | ";
		}
		inHtml += "</p></div>"
	}
	// Price
	if ("price" in jsObj) {
		inHtml += "<div class=\"texts\"><h2>Price</h2>"
		inHtml += "<p>" + jsObj.price + "</p></div>"
	}
	// More Info
	if (jsObj.url != "") {
		inHtml += "<div class=\"texts\"><h2>More Info</h2>"
		inHtml += "<p><a href = \"" + jsObj.url +"\" target=\"_blank\">Yelp</a></p></div>"
	}
	// End of text
	inHtml += "</div>"
	// IMAGES BEGIN
	inHtml += "<div class=\"images\">"
	for (i = 0; i < jsObj.photos.length; i++) {
		n = i+1;
		inHtml += "<div class=\"image\"><div class=\"pic\"><img src = \"" + jsObj.photos[i] + "\"></div>"
		inHtml += "<div class=\"text\">Photo " + n + "</div></div>"
	}
	// End
	inHtml += "</div>"
	return inHtml
}

rev = new Array(1, 1, 1);
// Reference: https://stackoverflow.com/questions/14267781/sorting-html-table-with-javascript
function sortTable(col) {
	table = document.getElementById("resultTable");
	reverse = rev[col-2]
    var tb = table.tBodies[0], // use `<tbody>` to ignore `<thead>` and `<tfoot>` rows
        tr = Array.prototype.slice.call(tb.rows, 0), // put rows into array
        i;
	rev[col-2] = -((+rev[col-2]) || -1);
    tr = tr.sort(function (a, b) { // sort rows
        return reverse // `-1 *` if want opposite order
            * (a.cells[col].textContent.trim() // using `.textContent.trim()` for test
                .localeCompare(b.cells[col].textContent.trim())
               );
    });
    for(i = 0; i < tr.length; ++i) {
		n = i+1
		tr[i].firstChild.innerHTML="<td class = texts>" + n.toString() + "</td>";
		tb.appendChild(tr[i])
	}; // append each row in order
}

function reqListener() {
	console.log('this.responseText:', this.responseText);
	console.log('this.status:', this.status);
  }
