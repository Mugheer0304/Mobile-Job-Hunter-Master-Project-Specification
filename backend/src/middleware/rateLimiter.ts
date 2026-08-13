import rateLimit from 'express-rate-limit';
import { isTest } from '../config/env';

// Brute-force protection for login/refresh endpoints.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 1000 : 20, // 20 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

// General API limiter.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isTest ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
