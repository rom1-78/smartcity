import express from 'express';
import { loginUser, registerUser } from '../controllers/auth.controller';
import { loginLimiter } from '../middleware/rateLImiter'; // NOUVEAU


const router = express.Router();
router.post('/register', registerUser);
router.post('/login', loginLimiter, loginUser);
export default router;
