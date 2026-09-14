import { createClient } from 'redis';
import config from '@app/config';

export const redis = createClient({
  username: config.redis.user,
  password: config.redis.password,
  socket: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

redis.on('error', (err) => console.error('Redis error:', err.message));