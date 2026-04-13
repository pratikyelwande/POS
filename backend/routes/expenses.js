const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const roleMiddleware = require("../middleware/role");
const { addExpense, getExpenses, deleteExpense } = require("../controllers/expenseController");

router.post("/", authMiddleware, addExpense);
router.get("/", authMiddleware, getExpenses);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteExpense);
module.exports = router;
