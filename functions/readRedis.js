'use strict';

const redis = require('redis')
const redisUrl = process.env.REDIS_URL;
const client = redis.createClient({
    url: redisUrl
});

module.exports.read = async () => {
    const res = []
    await client.connect();
    try {
        const keys = await client.KEYS('*');
        console.log(keys)
        for (let key of keys) {
            res.push({
                ip: key,
                events: (await client.SMEMBERS(key)).map(JSON.parse).sort(function (a, b) {
                    return a.time - b.time
                })
            })
            console.log(res);
        }
    } catch (e) {
        console.log(e)
    }
    await client.disconnect();
    return res;
}