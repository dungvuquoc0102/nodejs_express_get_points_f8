const { createDay, getADay, getAllDays } = require("../services/dayService");
//hardcode
const commentIdList = {
	day1: "4803",
	day2: "4841",
	day3: "4870",
	day4: "4891",
	day5: "4920",
	day6: "4946",
	day7: "4971",
	day8: "4991",
	day9: "5028",
	day10: "5070",
	day11: "5123",
	day12: "5172",
	day13: "5223",
	day14: "5262",
	day15: "5319",
	day16: "5358",
	day17: "5398",
	day18: "5433",
	day19: "5504",
	day20: "5579",
	day21: "5628",
	day22: "5645",
	day23: "5678"
};
function getPointsFromComment(str) {
	const regex = /(Điểm(?: tổng kết)?(?::)?)\s*([\d.,*]+)/g;
	let match;
	let lastMatch = null;
	while ((match = regex.exec(str)) !== null) {
		lastMatch = match;
	}
	if (lastMatch) {
		let numberStr = lastMatch[2].replace(",", ".").replaceAll("*", "");
		let number = parseFloat(numberStr);
		if (number > 10) {
			number = parseFloat((number / 3).toFixed(2));
		}
		return number;
	}
	return 0;
}
async function fetchADayPoints(commentId) {
	const vacantLink = `https://api-gateway.fullstack.edu.vn/api/comments?commentable_type=App\\Common\\Models\\Discussion&commentable_id=${commentId}&page=`;
	//Fetch comments page 1
	const result = [];
	const res = await fetch(vacantLink + "1");
	result.push(await res.json());
	const total_pages = result[0].meta.pagination.total_pages;
	//Fetch comments page 2, 3, 4, ... if have
	////use each promise
	// if (total_pages > 1) {
	// 	for (let i = 2; i < total_pages + 1; i++) {
	// 		const res = await fetch(vacantLink + i);
	// 		result.push(await res.json());
	// 		result[0].data = result[0].data.concat(result[i - 1].data);
	// 	}
	// }
	// const comments = result[0].data;
	////use Promise.all
	const promises = [];
	for (let i = 2; i < total_pages + 1; i++) {
		promises.push(fetch(vacantLink + i));
	}
	const results = await Promise.all(promises);
	results.forEach(async (res) => {
		result.push(await res.json());
	});
	const firstResult = result.reduce((acc, cur) => {
		acc.data = acc.data.concat(cur.data);
		return acc;
	});
	const comments = firstResult.data;
	//End fetch comments page 2, 3, 4, ... if have
	// Fetch point of reply of each comment
	const oneDayPoints = {};
	comments.forEach(async (comment) => {
		const res = await fetch(`https://api-gateway.fullstack.edu.vn/api/comments?commentable_type=App\\Common\\Models\\Comment&commentable_id=${comment.id}&page=1`);
		const result = await res.json();
		const data = result.data;
		if (data[0] == undefined) {
		} else {
			const fullName = comment.commentator.data.full_name;
			if (data.length > 1 && getPointsFromComment(data[0].comment) == 0) {
				for (let j = 1; j < data.length; j++) {
					if (getPointsFromComment(data[j].comment) != 0) {
						oneDayPoints[fullName] = getPointsFromComment(data[j].comment);
						break;
					}
				}
			} else {
				oneDayPoints[fullName] = getPointsFromComment(data[0].comment);
			}
		}
	});
	return oneDayPoints;
}
const getAllDayPointsAPI = async (req, res) => {
	try {
		//get old data from database
		let allDayPoints = await getAllDays();
		//fetch and insert more data to database if need
		if (allDayPoints.length < Object.keys(commentIdList).length) {
			const min = allDayPoints.length - 1;
			const max = Object.keys(commentIdList).length - 1;
			for (let i = min + 1; i <= max; i++) {
				const day = Object.keys(commentIdList)[i];
				const commentId = commentIdList[day];
				const pointsOfDay = await fetchADayPoints(commentId);
				await createDay(day, pointsOfDay);
			}
			//get new data from database after insert
			allDayPoints = await getAllDays();
		}
		res.status(200).json(allDayPoints);
	} catch (err) {
		console.error(err);
		res.status(500).json({
			message: "Internal server error"
		});
	}
};
const getADayPointsAPI = async (req, res) => {
	try {
		const dayName = req.params.dayName;
		const aDayPoints = await getADay(dayName);
		res.status(200).json(aDayPoints);
	} catch (err) {
		console.error(err);
		res.status(500).json({
			message: "Internal server error"
		});
	}
};

module.exports = { getAllDayPointsAPI, getADayPointsAPI };
