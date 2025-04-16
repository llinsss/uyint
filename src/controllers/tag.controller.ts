import { Request, Response } from 'express';
import tagService from '../services/tag.service';
import {
  createTagSchema,
  linkTagSchema,
  revokeTagSchema,
  generateTokenSchema,
  verifyTokenSchema
} from '../validations/tag';
import { validate } from '../utils/validation';

class TagController {
  async createTag(req: Request, res: Response) {
    const { generateQR } = validate(createTagSchema, req.body);
    const tag = await tagService.createTag(generateQR);
    res.status(201).json(tag);
  }

  async getTag(req: Request, res: Response) {
    const tag = await tagService.getTagById(req.params.tagId);
    res.json(tag);
  }

  async linkTag(req: Request, res: Response) {
    const { petId } = validate(linkTagSchema, req.body);
    const tag = await tagService.linkTagToPet(req.params.tagId, petId);
    res.json(tag);
  }

  async unlinkTag(req: Request, res: Response) {
    const tag = await tagService.unlinkTagFromPet(req.params.tagId);
    res.json(tag);
  }

  async revokeTag(req: Request, res: Response) {
    const { reason } = validate(revokeTagSchema, req.body);
    const tag = await tagService.revokeTag(req.params.tagId, reason);
    res.json(tag);
  }

  async reactivateTag(req: Request, res: Response) {
    const tag = await tagService.reactivateTag(req.params.tagId);
    res.json(tag);
  }

  async regenerateQR(req: Request, res: Response) {
    const tag = await tagService.regenerateQRCode(req.params.tagId);
    res.json(tag);
  }

  async generateToken(req: Request, res: Response) {
    const { expiresInHours } = validate(generateTokenSchema, req.body);
    const token = await tagService.generateTemporaryToken(
      req.params.tagId,
      expiresInHours
    );
    res.json({ token });
  }

  async verifyToken(req: Request, res: Response) {
    const { token } = validate(verifyTokenSchema, req.body);
    const isValid = await tagService.verifyTemporaryToken(
      req.params.tagId,
      token
    );
    res.json({ valid: isValid });
  }

  async checkAccess(req: Request, res: Response) {
    const token = req.headers['x-access-token'] as string | undefined;
    const result = await tagService.checkAccess(req.params.tagId, token);
    res.json(result);
  }

  async getTagsByStatus(req: Request, res: Response) {
    const status = req.params.status as keyof typeof TAG_STATUS;
    const tags = await tagService.getTagsByStatus(status);
    res.json(tags);
  }

  async getTagByPet(req: Request, res: Response) {
    const tag = await tagService.getTagByPetId(req.params.petId);
    res.json(tag);
  }
}

export default new TagController();