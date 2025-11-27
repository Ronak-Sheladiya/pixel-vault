import { Router } from 'express';
import {
    createFolder,
    getFolders,
    getFolder,
    updateFolder,
    deleteFolder,
    moveFolder,
} from '../controllers/folderController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', createFolder);
router.get('/', getFolders);
router.get('/:id', getFolder);
router.patch('/:id', updateFolder);
router.delete('/:id', deleteFolder);
router.patch('/:id/move', moveFolder);

export default router;
