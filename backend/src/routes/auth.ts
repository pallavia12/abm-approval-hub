import express from 'express';
import { checkAbmUser } from '../controllers/authController.js';

const router = express.Router();

// Match n8n webhook endpoints for easy migration
router.get('/check-abm-user', checkAbmUser);

export default router;

