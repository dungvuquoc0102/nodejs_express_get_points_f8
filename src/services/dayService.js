const Day = require("../models/day");

const createDay = async (day, pointsOfDay) => {
	const newDay = new Day({
		day: day,
		pointsOfDay: pointsOfDay
	});
	const result = await newDay.save();
	return result;
};
const getADay = async (dayName) => {
	const result = await Day.find({ day: dayName });
	return result;
};
const getAllDays = async () => {
	const result = await Day.find({});
	return result;
};

module.exports = { createDay, getADay, getAllDays };
