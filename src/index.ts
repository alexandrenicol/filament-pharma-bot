import { SQSEvent } from 'aws-lambda';
import { BLOCKS, getMessage } from './conversation/messages';
import { isoToReadable } from './conversation/timeoff';
import { ALStatus, getUserOrCreate, updateTimeOffRequestState } from './db';
import qs from 'querystring';

import { IncomingSlackMessage, processIncomingRequest } from './engine';
import { sendInteractionResponse, sendMessage } from './slack-api';

export const handler = async (event: SQSEvent) => {
  console.log('EVENT', JSON.stringify(event, null, 2));
  let originalEvent = JSON.parse(event.Records[0].body);

  let bodyString = originalEvent.body;

  if (
    originalEvent.headers['Content-Type'] ===
    'application/x-www-form-urlencoded'
  ) {
    bodyString = qs.parse(originalEvent.body).payload as string;
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
        const incomingRequest: IncomingSlackMessage = slackEvent.event;
        await processIncomingRequest(incomingRequest);
      }
      break;
    case 'block_actions':
      if (slackEvent.actions && slackEvent.actions.length > 0) {
        for (let index = 0; index < slackEvent.actions.length; index++) {
          const element = slackEvent.actions[index];
          const info = element.value.split('_');
          const action = info[0];
          if (action === 'approvetimeoff') {
            const userID = info[1];
            const requestID = info[2];
            const user = await getUserOrCreate(userID);
            console.log(JSON.stringify(user));
            const request = await updateTimeOffRequestState(
              userID,
              requestID,
              user.requests,
              ALStatus.Approved
            );
            console.log(JSON.stringify(request));
            await sendMessage(getMessage('TIME_OFF_REQUEST_APPROVED'), userID);
            await sendInteractionResponse(
              slackEvent.response_url,
              BLOCKS.requestApproved(userID, {
                startDate: isoToReadable(request.startDate),
                returnDate: isoToReadable(request.returnDate),
                aLCount: request.leaveCount,
              })
            );
          } else if (action === 'declinetimeoff') {
            const userID = info[1];
            const requestID = info[2];
            const user = await getUserOrCreate(userID);
            const request = await updateTimeOffRequestState(
              userID,
              requestID,
              user.requests,
              ALStatus.Declined
            );
            await sendMessage(getMessage('TIME_OFF_REQUEST_DECLINED'), userID);
            await sendInteractionResponse(
              slackEvent.response_url,
              BLOCKS.requestDeclined(userID, {
                startDate: isoToReadable(request.startDate),
                returnDate: isoToReadable(request.returnDate),
                aLCount: request.leaveCount,
              })
            );
          }
        }
      }
      break;
    default:
      break;
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify({}),
  };
  return response;
};
