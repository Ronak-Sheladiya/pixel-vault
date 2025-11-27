import { Router } from 'express';
import multer from 'multer';
import {
    uploadFiles,
    getFiles,
    getFile,
    deleteFile,
    renameFile,
    moveFile,
} from '../controllers/fileController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB
    },
    fileFilter: (req, file, cb) => {
        // Accept images and videos
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed'));
        }
    },
});

// All routes require authentication
router.use(authenticate);

router.post('/upload', upload.array('files', 10), uploadFiles);
router.get('/', getFiles);
router.get('/:id', getFile);
router.delete('/:id', deleteFile);
router.patch('/:id/rename', renameFile);
router.patch('/:id/move', moveFile);

export default router;
