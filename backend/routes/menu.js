const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");
const { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, getCategories } = require("../controllers/menuController");

router.get("/categories", authMiddleware, getCategories);
router.get("/", authMiddleware, getMenuItems);
router.post("/", authMiddleware, roleMiddleware("admin"), addMenuItem);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateMenuItem);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteMenuItem);

module.exports = router;
