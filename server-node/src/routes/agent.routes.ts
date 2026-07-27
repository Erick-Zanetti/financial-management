import { Router } from 'express';
import { agentController } from '../controllers/agent.controller';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.post('/chat', asyncHandler(agentController.chat.bind(agentController)));

export default router;
