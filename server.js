const app = require("express")();
//database
const connection = require("./src/config/database");
//controller
const { getAveragePoints } = require("./src/controllers/homeController");

//middleware
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});
// Handle requests to the root URL
app.get("/", getAveragePoints);

// Start the server
(async () => {
	// Connect to the database
	await connection();
	//Listen to the port
	const PORT = process.env.PORT || 3000;
	app.listen(PORT, () => {
		console.log(`Server is running on http://localhost:${PORT}`);
	});
})();
