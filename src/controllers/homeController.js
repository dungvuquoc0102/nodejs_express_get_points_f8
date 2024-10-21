const { createDay, createDays, getADay, getAllDays } = require("../services/dayService");
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
	day23: "5678",
	day24: "5700",
	day25: "5728",
	day26: "5358",
	day27: "5784",
	day28: "5799",
	day29: "5820",
	day30: "5836"
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
	let comments;
	if (total_pages > 1) {
		const promisesNumbers = [];
		for (let i = 2; i < total_pages + 1; i++) {
			promisesNumbers.push(i);
		}
		const resArr = await Promise.all(promisesNumbers.map((i) => fetch(vacantLink + i)));
		const resultArr = await Promise.all(resArr.map((res) => res.json()));
		const firstResult = resultArr.reduce((acc, cur) => {
			acc.data = acc.data.concat(cur.data);
			return acc;
		}, result[0]);
		comments = firstResult.data;
	} else {
		comments = result[0].data;
	}
	// Fetch point of reply of each comment
	const oneDayPoints = {};
	//use Promise.all to fetch all data at the same time
	// const resArr = await Promise.all(comments.map((comment) => fetch(`https://api-gateway.fullstack.edu.vn/api/comments?commentable_type=App\\Common\\Models\\Comment&commentable_id=${comment.id}&page=1`)));
	// const resultArr = await Promise.all(resArr.map((res) => res.json()));
	// resultArr.forEach((result, i) => {
	// 	const data = result.data;
	// 	if (data === undefined) {
	// 	} else if (data[0] == undefined) {
	// 	} else {
	// 		const fullName = comments[i].commentator.data.full_name;
	// 		if (data.length > 1 && getPointsFromComment(data[0].comment) == 0) {
	// 			for (let j = 1; j < data.length; j++) {
	// 				if (getPointsFromComment(data[j].comment) != 0) {
	// 					oneDayPoints[fullName] = getPointsFromComment(data[j].comment);
	// 					break;
	// 				}
	// 			}
	// 			if (oneDayPoints[fullName] == undefined) {
	// 				oneDayPoints[fullName] = 0;
	// 			}
	// 		} else {
	// 			oneDayPoints[fullName] = getPointsFromComment(data[0].comment);
	// 		}
	// 	}
	// });
	//use each loop to fetch data one by one
	for (let i = 0; i < comments.length; i++) {
		const res = await fetch(`https://api-gateway.fullstack.edu.vn/api/comments?commentable_type=App\\Common\\Models\\Comment&commentable_id=${comments[i].id}&page=1`);
		const result = await res.json();
		const data = result.data;
		if (data[0] == undefined) {
		} else {
			const fullName = comments[i].commentator.data.full_name;
			if (data.length > 1 && getPointsFromComment(data[0].comment) == 0) {
				for (let j = 1; j < data.length; j++) {
					if (getPointsFromComment(data[j].comment) != 0) {
						oneDayPoints[fullName] = getPointsFromComment(data[j].comment);
						break;
					}
				}
			}
			oneDayPoints[fullName] = getPointsFromComment(data[0].comment);
		}
	}
	return oneDayPoints;
}
const getAllDayPointsAPI = async (req, res) => {
	try {
		//get old data from database
		let allDayPoints = await getAllDays();
		//fetch and insert more data to database if need
		if (allDayPoints.length < Object.keys(commentIdList).length) {
			//use Promise.all to fetch all data at the same time
			// const min = allDayPoints.length;
			// const newCommentIdList = Object.values(commentIdList).slice(min);
			// const pointsOfDayList = await Promise.all(newCommentIdList.map((commentId) => fetchADayPoints(commentId)));
			// await createDays(pointsOfDayList.map((pointsOfDay, i) => ({ day: Object.keys(commentIdList)[min + i], pointsOfDay })));
			// get new data from database after insert
			//use each loop to fetch data one by one
			const min = allDayPoints.length - 1;
			const max = Object.keys(commentIdList).length - 1;
			for (let i = min + 1; i <= max; i++) {
				const day = Object.keys(commentIdList)[i];
				const commentId = commentIdList[day];
				const pointsOfDay = await fetchADayPoints(commentId);
				await createDay(day, pointsOfDay);
			}
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
