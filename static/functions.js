// Checkbox listener
$("#ifDetect").change(function() {
	if (!$(this).is(':checked')) {
		$("#location").prop('disabled', false);
		$("#location").prop('required', true);
	} else {
		$("#location").val('');
		$("#location").prop('required', false);
		$("#location").prop('disabled', true);
		fetchIpinfo();
	}
});

// Global variable storing latitute and longitude
var lat;
var lng;

// Fetch IP and return a promise
function fetchIpinfo() {
	return $.ajax({
		url: "https://ipinfo.io/json?token=7b00847c694a06",
		dataType: "json"
	})
	.done(function(jsonResponse) {
		var loc = jsonResponse.loc.split(",");
		lat = loc[0];
		lng = loc[1];
		console.log("IPINFO:" + jsonResponse.ip); // debug
		return true;
	});
}

// fetch Google Geocoding
function fetchGeoCode(url) {
	console.log("GEOCODE: Begin fetching..."); // debug
	return $.ajax({
		type: 'GET',
		url: url,
		dataType: 'json'
	})
	.done(function(jsonResponse) {
		var jsonResponse
		console.log(jsonResponse, "GEOCODE: returning result"); // debug
		if (jsonResponse.results.length == 0) {
		lat = -1;
		lng = -1;
		} else {
		lat = jsonResponse.results[0].geometry.location.lat;
		lng = jsonResponse.results[0].geometry.location.lng;
		}
	});
}

// Submit
async function fetchIp() {
	const ischeck = $("#ifDetect");
	if (ischeck.is(':checked')) {
		$("#lat").val(lat);
		$("#lng").val(lng);
	} else {
		let url = "https://maps.googleapis.com/maps/api/geocode/json?address="
		url = url.concat($("#location").val() + "&key=AIzaSyCQmhg-_5obRuWviOY5OjSkL6OZn-cb6bY");
		await fetchGeoCode(url);
		console.log("Geocode:", lat, lng); // debug
		$("#lat").val(lat);
		$("#lng").val(lng);
	}
}

$("#submitButton").click(function(e) {
	e.preventDefault();
	let term = $("#term");
	let radius = $("#radius");
	let location = $("#location");
	if (!term[0].checkValidity()) {
		term[0].reportValidity();
		return false;
	} else if (!radius[0].checkValidity()) {
		radius[0].reportValidity();
		return false;
	} else if (!location[0].checkValidity()) {
		location[0].reportValidity();
		return false;
	} else {
		fetchIp().then(function() {
		$("#detail").html("");
		let result = $("#result");
		result.html("");
		$.ajax({
			type: "GET",
			url: "/search",
			data: {
			term: term.val(),
			latitude: lat,
			longitude: lng,
			radius: (radius.val() != "") ? parseInt(radius.val()) * 1609 : "",
			categories: $("#category").val()
			},
			success: function(response) {
				result.html(genResult(response));
				$(".detail").click(function(e) {
					e.preventDefault();
				});
				$('html, body').animate({
					scrollTop: result.offset().top
				}, 'slow');
			},
			error: function() {
				result.html("<div class = \"error\">Processing</div>");
			}
		});
		});
	}
	});  

function genResult(jsObj) {
	var resultHTML;
	if ("error" in jsObj) {
		resultHTML = $("<div>", { class: "error" }).text("Invalid Input!");
	} else if (jsObj.total == 0) {
		resultHTML = $("<div>", { class: "error" }).text("No record has been found.");
	} else {
		resultHTML = $("<table>", { id: "resultTable" });
		var thead = $("<thead>");
		var tr = $("<tr>");
		tr.append($("<td>").text("#"));
		tr.append($("<td>").text("Image"));
		tr.append($("<td>", { class: "thBtn", onclick: "sortTable(2)" }).text("Business Name"));
		tr.append($("<td>", { class: "thBtn", onclick: "sortTable(3)" }).text("Rating"));
		tr.append($("<td>", { class: "thBtn", onclick: "sortTable(4)" }).text("Distance (miles)"));
		thead.append(tr);
		resultHTML.append(thead);
		var tbody = $("<tbody>");
		for(var i = 0; i < jsObj.businesses.length; i++) {
			var biz = jsObj.businesses[i];
			var d = biz.distance/1609;
			d = d.toFixed(2);
			var tr = $("<tr>");
			var n = i + 1;
			tr.append($("<td>", { class: "texts" }).text(n.toString()));
			tr.append($("<td>", { class: "images" }).append($("<img>", { src: biz.image_url })));
			tr.append($("<td>", { class: "texts" }).append($("<a>", { href: "#detail", class: "detail", onclick: "getDetail(\"" + biz.id + "\");return false;"}).text(biz.name)));
			tr.append($("<td>", { class: "texts" }).text(biz.rating));
			tr.append($("<td>", { class: "texts" }).text(d.toString()));
			tbody.append(tr);
		}
		resultHTML.append(tbody);
	}
	return resultHTML;
}

function getDetail(id) {
	console.log("XMLHttpRequest: Request for getting detail Begin")
	var xhttp = new XMLHttpRequest();
	var result = document.getElementById('detail');
	xhttp.onreadystatechange = function() {
		console.log("Onready")
		if (this.readyState == 4 && this.status == 200) {
			result.innerHTML = generateDetail(JSON.parse(this.responseText)); // Another callback here
			result.scrollIntoView(true);
		} else {
			// result.innerHTML = "Processing";
		}
	}
	params = "/detail?id=" + id
	console.log(params)
	xhttp.addEventListener('load', reqListener);
	xhttp.open('GET', params, true);
	xhttp.setRequestHeader('Access-Control-Allow-Headers', '*');
	xhttp.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
	xhttp.send();
}

function generateDetail(jsObj) {
	// Title
	inHtml = "<div class=\"detail-in\"><div class=\"single\"><h2>" + jsObj.name + "</h2></div><hr>"
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