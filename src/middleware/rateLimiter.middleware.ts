import rateLimit from 'express-rate-limit';
import { rateLimitMetricsService } from '../services/rate-limit-metrics.service';
import logger from '../utils/logger';

/**
 * Factory function to create rate limiters with consistent configuration
 */
function createRateLimiter(opts: {
  windowMs: number;
  max: number;
  message: string;
  name: string;
  keyGenerator?: (req: any) => string;
}) {
  return rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    keyGenerator: opts.keyGenerator,
    message: { error: 'Too Many Requests', message: opts.message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const key = opts.keyGenerator ? opts.keyGenerator(req) : (req.ip || 'unknown');
      const userId = (req as any).user?.userId || (req as any).userId;

      // Track the hit in the background
      rateLimitMetricsService.recordHit({
        endpoint: opts.name,
        key: key,
        ip: req.ip,
        userId: userId,
      }).catch(err => logger.error(`Failed to record hit for ${opts.name}:`, err));

      res.status(429).json({ error: 'Too Many Requests', message: opts.message });
    },
  });
}

// Authentication endpoints
export const challengeRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many challenge requests from this IP, please try again after 15 minutes',
  name: 'auth/challenge',
});

export const connectRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  name: 'auth/connect',
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  name: 'auth/general',
});

// Chat message rate limiter (per user)
export const chatMessageRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'You can only send 5 messages per minute. Please wait before sending another message.',
  keyGenerator: (req) => (req as any).user?.userId || req.ip || 'unknown',
  name: 'chat/message',
});

// Prediction submission rate limiter (per user)
export const predictionRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many prediction submissions. Please wait before submitting another.',
  keyGenerator: (req) => (req as any).user?.userId || req.ip || 'unknown',
  name: 'prediction/submit',
});

// Admin round creation rate limiter (per IP)
export const adminRoundRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many round creation requests. Please wait before creating another round.',
  name: 'admin/round-create',
});

// Oracle round resolution rate limiter (per IP)
export const oracleResolveRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many resolve requests. Please wait before resolving another round.',
  name: 'oracle/round-resolve',
});

