import { APIGatewayProxyEvent } from 'aws-lambda';
import qs from 'querystring';

// const bucketName = process.env.BUCKET;

const AWS = require('aws-sdk');
const sqs = new AWS.SQS({
  region: 'eu-west-1',
});

async function sendMessageToQueue(event: APIGatewayProxyEvent) {
  return new Promise((resolve, reject) => {
    const queueUrl = `https://sqs.eu-west-1.amazonaws.com/822055506908/EventQueue`;
    // response and status of HTTP endpoint
    const responseBody = {
      message: '',
      messageId: '',
    };
    let responseCode = 200;
    // SQS message parameters
    const params = {
      MessageBody: JSON.stringify(event),
      QueueUrl: queueUrl,
    };
    sqs.sendMessage(params, (error, data) => {
      if (error) {
        console.info('error:', `failed to send message${error}`);
        responseCode = 500;
        reject({ body: JSON.stringify(error) });
      } else {
        console.info('data:', data.MessageId);
        responseBody.message = `Sent to ${queueUrl}`;
        responseBody.messageId = data.MessageId;
      }
      resolve({
        body: JSON.stringify(responseBody),
      });
    });
  });
}

export const handler = async (event: APIGatewayProxyEvent) => {
  console.log('EVENT', JSON.stringify(event, null, 2));
  let bodyString = event.body;

  if (event.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
    console.log(qs.parse(event.body));
    bodyString = qs.parse(event.body).payload as string;
  }

  const slackEvent = JSON.parse(bodyString);

  console.log('SLACK EVENT: \n' + JSON.stringify(slackEvent, null, 2));

  let responseBody: any;

  switch (slackEvent.type) {
    case 'url_verification':
      responseBody = { challenge: slackEvent.challenge };
      break;
    case 'event_callback':
      if (
        slackEvent.event.type === 'message' &&
        !slackEvent.event.bot_profile
      ) {
        // send to queue
        responseBody = await sendMessageToQueue(event);
      }
      break;
    case 'block_actions':
      // send to queue
      responseBody = await sendMessageToQueue(event);
      break;
    default:
      break;
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify(responseBody.body),
  };
  return response;
};
