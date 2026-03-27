import { prisma } from '../lib/prisma';
import logger from '../utils/logger';

export class RateLimitMetricsService {
  /**
   * Records a rate-limit hit in the database
   */
  async recordHit(data: {
    endpoint: string;
    key: string;
    ip?: string;
    userId?: string;
  }): Promise<void> {
    try {
      await prisma.rateLimitMetric.create({
        data: {
          endpoint: data.endpoint,
          key: data.key,
          ip: data.ip,
          userId: data.userId,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to record rate-limit hit:', error);
    }
  }

  /**
   * Retrieves summary statistics for rate-limit hits
   */
  async getSummary(limit: number = 10) {
    try {
      const topEndpoints = await prisma.rateLimitMetric.groupBy({
        by: ['endpoint'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: limit,
      });

      const recentEvents = await prisma.rateLimitMetric.findMany({
        orderBy: {
          timestamp: 'desc',
        },
        take: limit * 2,
      });

      const topAbusers = await prisma.rateLimitMetric.groupBy({
        by: ['key', 'endpoint'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: limit,
      });

      return {
        topEndpoints: topEndpoints.map(e => ({
          endpoint: e.endpoint,
          hits: e._count.id,
        })),
        topAbusers: topAbusers.map(a => ({
          key: a.key,
          endpoint: a.endpoint,
          hits: a._count.id,
        })),
        recentEvents,
      };
    } catch (error) {
      logger.error('Failed to get rate-limit summary:', error);
      throw error;
    }
  }

  /**
   * Clears old metrics (optional, for maintenance)
   */
  async clearOldMetrics(days: number = 7): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    try {
      const result = await prisma.rateLimitMetric.deleteMany({
        where: {
          timestamp: {
            lt: date,
          },
        },
      });
      return result.count;
    } catch (error) {
      logger.error('Failed to clear old rate-limit metrics:', error);
      return 0;
    }
  }
}

export const rateLimitMetricsService = new RateLimitMetricsService();
