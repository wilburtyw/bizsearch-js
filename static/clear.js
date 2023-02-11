$("#clear").click(function() {
	$("#term").val('');
	$("#radius").val('');
	$("#location").val('');
	$("#category").prop("selectedIndex", 0);
	$("#result").html("");
	$("#detail").html("");
	console.log("Page Clear!"); // debug
})