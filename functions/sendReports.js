const aws = require('aws-sdk');
const lambda = new aws.Lambda({
    region: process.env.AWS_REGION //same region
});

const ses = new aws.SES();

async function mail(subject, body){
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
                    Data: `<html lang='en-En'><div>${body}</div></html>`
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

function readData(){
    const params = {
        FunctionName: 'sqs-redis-dev-read-redis',
        InvocationType: 'RequestResponse',
        LogType: 'Tail'
    };
    return invokeLambda(params)
}

function delData(keys){
    const params = {
        FunctionName: 'sqs-redis-dev-del-redis',
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: JSON.stringify(keys)
    };
    return invokeLambda(params)
}

function invokeLambda(params){
    return new Promise((resolve, reject) => {
        lambda.invoke(params, function(err, data ) {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                resolve(data.Payload);
            }
        })
    })
}

function getText(records){
    let res = '<table>'
    for(let r of records){
        res +=`<tr><td>${formatTime(r.time)}</td> <td> ${r.event}</td><td> ${r.project || ''}</td></tr>`
    }
    return res + '</table>';
}

function formatTime(timestamp){
    const newDate = new Date();
    newDate.setTime(timestamp);
    return  newDate.toISOString().split('.')[0];
}

function getCaption(key){
    return `<h3>${key}</h3>`
}

module.exports.report = async () => {
     const response = await readData();
     if (typeof response !== 'string'){
         return {
             statusCode : 500,
             body : 'wrong data format'
         }
     }
     const data = JSON.parse(response);
     console.log(data);
     if(data.length ===0){
         return {
             statusCode : 200,
             body : 'No new events for the moment'
         }
     }
     let text = '';
     let ip = ''
     const keys = [];
     for(let d of data){
         if (ip !== d.ip){
             ip = d.ip;
             keys.push(ip)
             text += getCaption(ip)
         }
         text += getText(d.events)
     }

     const subject = 'Landing page event list';
     let body;
     let statusCode = 200;

     try{
         body = await mail(subject,text);
         await delData(keys);
     }catch (e){
         body = e;
         statusCode = 500;
     }
     return {
         statusCode,
         body
     }

}