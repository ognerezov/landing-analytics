'use strict';

const redis = require('redis')
const redisUrl = process.env.REDIS_URL;
const client = redis.createClient({
    url: redisUrl
});

module.exports.del = async (keys) => {
    await client.connect();
    try {
        await client.DEL(keys)
    } catch (e) {
        console.log(e)
    }
    await client.disconnect();
    return {
        statusCode : 200
    };
}