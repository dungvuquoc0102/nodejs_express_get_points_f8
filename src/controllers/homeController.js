const { createDay, getAllDays } = require("../services/dayService");

//front-end
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
	day19: "5504"
};
function getPointsFromComment(str) {
	// Regular expression to match "Điểm: " or "Điểm tổng kết: " followed by a decimal number
	const regex = /(Điểm(?: tổng kết)?(?::)?)\s*([\d.,]+)/g;
	let match;
	let lastMatch = null;
	// Loop through all matches and store the last one
	while ((match = regex.exec(str)) !== null) {
		lastMatch = match;
	}
	// If a match is found, return the number
	if (lastMatch) {
		let numberStr = lastMatch[2];
		// Replace ',' with '.' if necessary for consistency
		numberStr = numberStr.replace(",", ".");
		// Convert to a floating-point number and return it
		let number = parseFloat(numberStr);
		if (number > 10) {
			number = parseFloat((number / 3).toFixed(2));
		}
		return number;
	}
	// Return 0 if no match is found
	return 0;
}
async function fetchPoints(link) {
	//Fetch comments page 1
	let result = [];
	const res = await fetch(link + "1");
	result.push(await res.json());
	//Fetch comments page 2, 3, 4, ... if have
	const total_pages = result[0].meta.pagination.total_pages;
	if (total_pages > 1) {
		for (let i = 2; i < total_pages + 1; i++) {
			const res = await fetch(link + i);
			result.push(await res.json());
			result[0].data = result[0].data.concat(result[i - 1].data);
		}
	}
	const comments = result[0].data;
	// Fetch point of reply of each comment
	let oneDayPoints = {};
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
			} else {
				oneDayPoints[fullName] = getPointsFromComment(data[0].comment);
			}
		}
	}
	return oneDayPoints;
}
async function getADayPoints(commentId) {
	const linkBefore = "https://api-gateway.fullstack.edu.vn/api/comments?commentable_type=App\\Common\\Models\\Discussion&commentable_id=";
	const linkAfter = "&page=";
	const link = linkBefore + commentId + linkAfter;
	const aDayPoints = await fetchPoints(link);
	return aDayPoints;
}
async function getAllDayPoints(commentIdList) {
	const linkBefore = "https://api-gateway.fullstack.edu.vn/api/comments?commentable_type=App\\Common\\Models\\Discussion&commentable_id=";
	const linkAfter = "&page=";
	let allDayPoints = [];
	for (let i = 0; i < Object.keys(commentIdList).length; i++) {
		const link = linkBefore + commentIdList[Object.keys(commentIdList)[i]] + linkAfter;
		const oneDayPoints = await fetchPoints(link);
		allDayPoints.push({ [Object.keys(commentIdList)[i]]: oneDayPoints });
	}
	return allDayPoints;
}
function calculateAndSortAveragePoints(allDayPoints) {
	const totalPoints = {};
	let validDayCount = 0; // Count of valid days (days with non-zero points)
	// Loop through each day and sum the points for each person if the day is valid
	allDayPoints.forEach((day) => {
		const dayData = day.pointsOfDay; // Get the data for the day
		let hasValidPoints;
		if (dayData == undefined) {
			hasValidPoints = false;
		} else {
			hasValidPoints = Object.values(dayData).some((point) => point > 0); // Check if the day has any valid points
		}
		if (hasValidPoints) {
			validDayCount++; // Increment valid day count only if the day has valid points
			for (let person in dayData) {
				if (totalPoints[person]) {
					totalPoints[person] += dayData[person];
				} else {
					totalPoints[person] = dayData[person];
				}
			}
		}
	});
	// Ensure all participants have data for the valid days
	const allParticipants = new Set(Object.keys(totalPoints));
	allDayPoints.forEach((day) => {
		if (day.pointsOfDay != undefined) {
			Object.keys(day.pointsOfDay).forEach((person) => allParticipants.add(person));
		}
	});
	// Calculate averages over the valid days for each participant
	const averagePoints = Array.from(allParticipants).map((person) => {
		const total = totalPoints[person] || 0; // If no score, treat as 0
		return [person, (total / validDayCount).toFixed(2)]; // Calculate average points over validDayCount
	});
	// Sort by average points
	averagePoints.sort((a, b) => b[1] - a[1]);
	// Return the results
	return averagePoints;
}

const getAveragePoints = async (req, res) => {
	try {
		//get old data from database
		let allDayPoints = await getAllDays();
		//insert more data to database if need
		if (allDayPoints.length < Object.keys(commentIdList).length) {
			const min = allDayPoints.length - 1;
			const max = Object.keys(commentIdList).length - 1;
			for (let i = min + 1; i <= max; i++) {
				const day = Object.keys(commentIdList)[i];
				const commentId = commentIdList[day];
				const pointsOfDay = await getADayPoints(commentId);
				await createDay(day, pointsOfDay);
			}
			//get new data from database after insert
			allDayPoints = await getAllDays();
		}
		// Calculate and sort the average points
		const averagePoints = calculateAndSortAveragePoints(allDayPoints);
		//Return the average points
		res.status(200).json(averagePoints);
	} catch (err) {
		console.error(err);
		res.status(500).json({
			message: "Internal server error"
		});
	}
};

module.exports = { getAveragePoints };
