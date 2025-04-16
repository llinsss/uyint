import { Router } from 'express';
import tagController from '../controllers/tag.controller';
import authMiddleware from '../middlewares/auth.middleware';
import adminMiddleware from '../middlewares/admin.middleware';

const router = Router();

router.use(authMiddleware);

// Tag management
router.post('/', adminMiddleware, tagController.createTag);
router.get('/:tagId', tagController.getTag);
router.put('/:tagId/link', tagController.linkTag);
router.put('/:tagId/unlink', tagController.unlinkTag);
router.put('/:tagId/revoke', tagController.revokeTag);
router.put('/:tagId/reactivate', adminMiddleware, tagController.reactivateTag);
router.post('/:tagId/regenerate-qr', adminMiddleware, tagController.regenerateQR);

// Token management
router.post('/:tagId/tokens', tagController.generateToken);
router.post('/:tagId/verify-token', tagController.verifyToken);
router.get('/:tagId/access', tagController.checkAccess);

// Query endpoints
router.get('/status/:status', adminMiddleware, tagController.getTagsByStatus);
router.get('/pet/:petId', tagController.getTagByPet);

export default router;