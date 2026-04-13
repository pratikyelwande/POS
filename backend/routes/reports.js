const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");
const { getSummary, exportOrders, exportPending } = require("../controllers/reportController");

router.get("/summary", authMiddleware, getSummary);
router.get("/export", authMiddleware, roleMiddleware("admin"), exportOrders);
router.get("/pending-export", authMiddleware, roleMiddleware("admin"), exportPending);

module.exports = router;
