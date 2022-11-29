const express = require("express");
const {
  voiceCall
} = require("../controllers/callController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
router.route("/").post(protect, voiceCall);
module.exports = router;
