const app = require("express")();

function getNumbersAfterDiem(str) {
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
			number = (number / 3).toFixed(2);
		}
		return number;
	}
	// Return 0 if no match is found
	return 0;
}
async function fetchPoints(link) {
	try {
		// Fetch comments from the link
		let result = [];
		const res = await fetch(link + "1");
		// const headerDate = res.headers && res.headers.get("date") ? res.headers.get("date") : "no response date";
		result.push(await res.json());
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
		points = {};
		for (let i = 0; i < comments.length; i++) {
			const res = await fetch(`https://api-gateway.fullstack.edu.vn/api/comments?commentable_type=App\\Common\\Models\\Comment&commentable_id=${comments[i].id}&page=1`);
			const result = await res.json();
			const data = result.data;
			if (data[0] == undefined) {
			} else {
				const fullName = comments[i].commentator.data.full_name;
				if (data.length > 1 && getNumbersAfterDiem(data[0].comment) == 0) {
					for (let j = 1; j < data.length; j++) {
						if (getNumbersAfterDiem(data[j].comment) != 0) {
							points[fullName] = getNumbersAfterDiem(data[j].comment);
							break;
						}
					}
				} else {
					points[fullName] = getNumbersAfterDiem(data[0].comment);
				}
			}
		}
		// return points
		return points;
	} catch (err) {
		console.log(err);
		return null;
	}
}

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
	day18: "5433"
};
const linkBefore = "https://api-gateway.fullstack.edu.vn/api/comments?commentable_type=App\\Common\\Models\\Discussion&commentable_id=";
const linkAfter = "&page=";
const allDayPoints = [];
async function getAllDayPoints() {
	for (let i = 0; i < Object.keys(commentIdList).length; i++) {
		const link = linkBefore + commentIdList[Object.keys(commentIdList)[i]] + linkAfter;
		const points = await fetchPoints(link);
		allDayPoints.push({ [Object.keys(commentIdList)[i]]: points });
	}
	return allDayPoints;
}

app.get("/", async (req, response) => {
	const allDayPoints = await getAllDayPoints();
	response.json(allDayPoints);
});

app.listen(3000, () => {
	console.log("Server is running on http://localhost:3000");
});
