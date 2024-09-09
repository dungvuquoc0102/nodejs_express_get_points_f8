const mongoose = require("mongoose");
//create a schema
const Schema = mongoose.Schema;
const daySchema = new Schema({
	day: {
		type: String,
		required: true
	},
	pointsOfDay: {
		type: Object
	}
});
//create a model
const Day = mongoose.model("Day", daySchema);
module.exports = Day;
