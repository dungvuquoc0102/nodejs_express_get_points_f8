const router = require("express").Router();
const { getAllDayPointsAPI, getADayPointsAPI } = require("../controllers/homeController");

router.get("/points", getAllDayPointsAPI);
router.get("/points/:dayName", getADayPointsAPI);

module.exports = router;
