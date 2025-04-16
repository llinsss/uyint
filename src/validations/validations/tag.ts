import Joi from 'joi';

export const createTagSchema = Joi.object({
  generateQR: Joi.boolean().default(true),
});

export const linkTagSchema = Joi.object({
  petId: Joi.string().hex().length(24).required(),
});

export const revokeTagSchema = Joi.object({
  reason: Joi.string().max(500).optional(),
});

export const generateTokenSchema = Joi.object({
  expiresInHours: Joi.number().min(1).max(720).default(24), // 1 hour to 30 days max
});

export const verifyTokenSchema = Joi.object({
  token: Joi.string().required(),
});