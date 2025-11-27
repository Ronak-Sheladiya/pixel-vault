import { Router } from 'express';
import {
    shareFolder,
    generatePublicLink,
    getFolderMembers,
    removeMember,
    updatePermission,
    getSharedFolders,
} from '../controllers/shareController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/folder/:folderId', shareFolder);
router.post('/folder/:folderId/public-link', generatePublicLink);
router.get('/folder/:folderId/members', getFolderMembers);
router.delete('/:shareId', removeMember);
router.patch('/:shareId/permission', updatePermission);
router.get('/shared-with-me', getSharedFolders);

export default router;
