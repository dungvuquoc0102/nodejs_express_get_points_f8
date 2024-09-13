const mongoose = require("mongoose");
//connect to mongodb database
const connection = async () => {
	await mongoose.connect("mongodb://103.179.188.234:27017", { user: "dungvq", pass: "dungvq123456", dbName: "dungvq" });
	const state = Number(mongoose.connection.readyState);
	return state;
};
module.exports = connection;
