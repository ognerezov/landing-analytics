'use strict';

const redis = require('redis')
const redisUrl = process.env.REDIS_URL;
const client = redis.createClient({
    url: redisUrl
});

module.exports.receive = async (event) => {
    console.log(redisUrl)
    const body =event
    console.log(body)
    console.log(body['Records'])
    console.log(typeof body['Records'])
    const res = {}
    for(let record of body['Records']){
        console.log(record['messageAttributes'])
        console.log(record['attributes'])
        let ip = record['messageAttributes']['Ip']['stringValue']
        let time = record['attributes']['SentTimestamp']
        let event = record['messageAttributes']['Event']['stringValue']
        let agent = record['messageAttributes']['Agent']['stringValue']
        let language = record['messageAttributes']['Language']['stringValue']
        let project = record['messageAttributes']['Project']['stringValue']

        let data = res[ip]

        if(!data){
            data = {
                events : [],
                ip,
                agent,
                language
            }
            res[ip] = data;
        }
        data['events'].push(JSON.stringify({
            event,
            time,
            project,
            agent
        }))
    }
    await client.connect();
    for(let ip in res){
        await client.SADD(ip,...res[ip].events)
    }
    await client.disconnect();
    console.log(res)
      return {
        statusCode: 200,
        body: res
  };

};
