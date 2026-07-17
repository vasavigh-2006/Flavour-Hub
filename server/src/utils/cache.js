import NodeCache from 'node-cache';
import redis from 'redis';
import logger from './logger.js';

let cache;

if (process.env.REDIS_URL) {
  // Use Redis if available
  const client = redis.createClient({ url: process.env.REDIS_URL });
  
  client.on('error', (err) => {
    logger.error('Redis Client Error', err);
  });

  client.connect().then(() => {
    logger.info('Redis connected');
  });

  cache = {
    get: async (key) => {
      try {
        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        logger.error('Redis get error', error);
        return null;
      }
    },
    set: async (key, value, ttl) => {
      try {
        await client.setEx(key, ttl || 3600, JSON.stringify(value));
      } catch (error) {
        logger.error('Redis set error', error);
      }
    },
    del: async (key) => {
      try {
        await client.del(key);
      } catch (error) {
        logger.error('Redis del error', error);
      }
    },
  };
} else {
  // Fallback to node-cache
  const nodeCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
  logger.info('Using node-cache for caching');
  
  cache = {
    get: async (key) => {
      return nodeCache.get(key) || null;
    },
    set: async (key, value, ttl) => {
      nodeCache.set(key, value, ttl || 3600);
    },
    del: async (key) => {
      nodeCache.del(key);
    },
  };
}

export default cache;

