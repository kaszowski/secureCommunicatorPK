const LRU = require('lru-cache');

module.exports = {
    SECRET_KEY: 'supersecretkey',
    tokenLifeInMinutes: 15,
    blacklist: new LRU.LRUCache({
        max: 10000,
        ttl: 1000 * 60 * 15,
      })
}