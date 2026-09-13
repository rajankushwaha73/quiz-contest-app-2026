const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { success } = require('../utils/apiResponse');
const {
  getUsers,
  createUser,
  toggleUserActive,
  deleteUser,
  getAllQuizzes,
  getAllResults,
  getAnalytics,
} = require('../controllers/admin.controller');

// All routes below require a logged-in admin
router.use(authMiddleware, roleMiddleware('admin'));

// Kept from Phase 3 for quick manual verification of role protection
router.get('/test', (req, res) => {
  return success(res, 200, `Access granted. Hello admin (id: ${req.user.id})`);
});

router.get('/users', getUsers);
router.post('/users', createUser);
router.patch('/users/:id/toggle-active', toggleUserActive);
router.delete('/users/:id', deleteUser);

router.get('/quizzes', getAllQuizzes);
router.get('/results', getAllResults);
router.get('/analytics', getAnalytics);

module.exports = router;
