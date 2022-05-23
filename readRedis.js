'use strict';

const redis = require('redis')
const redisUrl = process.env.REDIS_URL;
const client = redis.createClient({
    url: redisUrl
});

const aws = require('aws-sdk');
// const lambda = new aws.Lambda({
//     region: process.env.AWS_REGION //same region
// });

const ses = new aws.SES();

async function mail(subject, body, from){
    const params = {
        Destination: {
            ToAddresses: [
                process.env.TO
            ]
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: `<html lang='en-En'><h2>${from}</h2><div>${body}</div></html>`
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: subject
            }
        },
        Source: process.env.FROM,
    };
    await ses.sendEmail(params).promise();
}
// function sendEmail(body){
//     const params = {
//         FunctionName: 'emailMe',
//         InvocationType: 'RequestResponse',
//         LogType: 'Tail',
//         Payload: JSON.stringify({
//             from: process.env.FROM,
//             subject: process.env.SUBJECT,
//             body
//         })
//     };
//     return new Promise((resolve, reject) => {
//         lambda.invoke(params, function(err, data ) {
//             if (err) {
//                 console.log(err);
//                 reject(err);
//             } else {
//                 resolve(data.Payload);
//             }
//         })
//     })
// }

function getText(key, records){
    let res = `<h3>${key}</h3>`
    for(let record of records){
        res +=`<p>${record.time} ${record.event} at ${record.project}</p>`
    }

    return res;
}

module.exports.read = async () => {
    await client.connect();
    const keys = await client.KEYS('*');
    console.log(keys)
    let body = '';
    for(let key of keys){
        const recods = await client.SMEMBERS(key);
        console.log(recods);
        if(!recods || recods.length ===0){
            continue
        }
        body+=getText(key,recods);
    }
    const sentRes= await mail(process.env.SUBJECT, body, process.env.FROM);
    console.log(sentRes)
    await client.disconnect();
    return {
        statusCode: 200,
        body: keys
    };
}