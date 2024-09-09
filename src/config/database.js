const mongoose = require("mongoose");
//connect to mongodb database
const connection = async () => {
	await mongoose.connect("mongodb://localhost:27017", { user: "root", pass: "123456", dbName: "pointsf8" });
	const state = Number(mongoose.connection.readyState);
	return state;
};
module.exports = connection;
