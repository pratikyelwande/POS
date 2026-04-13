const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const { createOrder, getOrders, getPendingOrders, updateOrder, updateOrderStatus, completePendingOrder } = require("../controllers/orderController");

router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getOrders);
router.get("/pending", authMiddleware, getPendingOrders);
router.put("/:id", authMiddleware, updateOrder);
router.patch("/:id/status", authMiddleware, updateOrderStatus);
router.patch("/:id/complete", authMiddleware, completePendingOrder);

module.exports = router;
