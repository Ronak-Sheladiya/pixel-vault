import { Router } from 'express';
import {
    addComment,
    getComments,
    updateComment,
    deleteComment,
} from '../controllers/commentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/:fileId', addComment);
router.get('/:fileId', getComments);
router.patch('/:commentId', updateComment);
router.delete('/:commentId', deleteComment);

export default router;
