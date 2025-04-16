import Tag, { ITag, TAG_STATUS } from '../models/Tag';
import { NotFoundError, ForbiddenError } from '../errors';
import crypto from 'crypto';

class TagService {
  // Create a new tag (with optional QR code generation)
  async createTag(generateQR: boolean = true): Promise<ITag> {
    const tagData: Partial<ITag> = {
      isActive: true,
      isRevoked: false
    };

    if (generateQR) {
      // QR code will be generated in pre-save hook
      const tag = new Tag(tagData);
      return await tag.save();
    } else {
      // Create without QR code (will be added later)
      const tag = new Tag({
        ...tagData,
        qrCode: ''
      });
      return await tag.save();
    }
  }

  // Get tag by ID
  async getTagById(tagId: string): Promise<ITag> {
    const tag = await Tag.findOne({ tagId });
    if (!tag) throw new NotFoundError('Tag not found');
    return tag;
  }

  // Link tag to a pet
  async linkTagToPet(tagId: string, petId: string): Promise<ITag> {
    const tag = await this.getTagById(tagId);
    
    if (tag.isRevoked) {
      throw new ForbiddenError('Cannot link a revoked tag');
    }
    
    if (tag.pet && tag.pet.toString() !== petId) {
      throw new ForbiddenError('Tag is already linked to another pet');
    }
    
    tag.pet = petId;
    tag.isActive = true;
    return await tag.save();
  }

  // Unlink tag from pet
  async unlinkTagFromPet(tagId: string): Promise<ITag> {
    const tag = await this.getTagById(tagId);
    tag.pet = undefined;
    return await tag.save();
  }

  // Revoke tag (for lost/stolen tags)
  async revokeTag(tagId: string, reason: string = ''): Promise<ITag> {
    const tag = await this.getTagById(tagId);
    tag.isRevoked = true;
    tag.isActive = false;
    tag.revocationReason = reason;
    return await tag.save();
  }

  // Reactivate a revoked tag
  async reactivateTag(tagId: string): Promise<ITag> {
    const tag = await this.getTagById(tagId);
    tag.isRevoked = false;
    tag.isActive = true;
    tag.revocationReason = undefined;
    return await tag.save();
  }

  // Generate a new QR code for a tag
  async regenerateQRCode(tagId: string): Promise<ITag> {
    const tag = await this.getTagById(tagId);
    tag.qrCode = await tag.generateQRCode();
    return await tag.save();
  }

  // Generate temporary access token
  async generateTemporaryToken(tagId: string, expiresInHours: number = 24): Promise<string> {
    const tag = await this.getTagById(tagId);
    
    if (tag.isRevoked || !tag.isActive) {
      throw new ForbiddenError('Cannot generate token for inactive or revoked tag');
    }
    
    const token = tag.generateTemporaryToken(expiresInHours);
    await tag.save();
    return token;
  }

  // Verify temporary access token
  async verifyTemporaryToken(tagId: string, token: string): Promise<boolean> {
    return await Tag.verifyTemporaryToken(tagId, token);
  }

  // Check access permissions
  async checkAccess(tagId: string, token?: string): Promise<{
    hasAccess: boolean;
    isTemporary: boolean;
    tag?: ITag;
  }> {
    const tag = await this.getTagById(tagId);
    
    // Check if tag is active and not revoked
    if (!tag.isActive || tag.isRevoked) {
      return { hasAccess: false, isTemporary: false };
    }
    
    // If no token provided, only allow if tag is active
    if (!token) {
      return { hasAccess: tag.isActive && !tag.isRevoked, isTemporary: false, tag };
    }
    
    // Verify token if provided
    const isTokenValid = await this.verifyTemporaryToken(tagId, token);
    return {
      hasAccess: isTokenValid,
      isTemporary: isTokenValid,
      tag
    };
  }

  // Get all tags by status
  async getTagsByStatus(status: keyof typeof TAG_STATUS): Promise<ITag[]> {
    let query: any = {};
    
    switch(status) {
      case 'ACTIVE':
        query.isActive = true;
        query.isRevoked = false;
        break;
      case 'INACTIVE':
        query.isActive = false;
        query.isRevoked = false;
        break;
      case 'REVOKED':
        query.isRevoked = true;
        break;
    }
    
    return await Tag.find(query);
  }

  // Get tag by pet ID
  async getTagByPetId(petId: string): Promise<ITag | null> {
    return await Tag.findOne({ pet: petId });
  }
}

export default new TagService();