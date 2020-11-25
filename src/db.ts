import { STATES } from './conversation/states';
import { DynamoDb } from './lib/aws';

export enum ALStatus {
  Requested,
  Approved,
  Declined,
}

export interface ALRequest {
  id?: number;
  startDate: string; // iso date
  returnDate: string; // iso date
  leaveCount: number;
  financialYear?: number;
  status: ALStatus;
}

export interface Conversation {
  state: STATES;
  memory: {
    [k: string]: string;
  };
}

export interface User {
  slackID: string;
  lineManagerID: string; // SlackID
  autoApproval: boolean;
  initialLeaveCount: number; // 25
  requests: ALRequest[];
  conversation: Conversation;
}

export interface Approver extends User {
  team: User[];
}

export async function getUserOrCreate(slackID: string) {
  let user = await DynamoDb.get({
    TableName: process.env.DDB_TABLE_NAME,
    Key: {
      slackID,
    },
  });
  if (user) {
    return user as User;
  }

  const newUser = {
    slackID,
    lineManagerID: '',
    autoApproval: false,
    initialLeaveCount: 25,
    requests: [],
    conversation: {
      state: STATES.DEFAULT,
      memory: {},
    },
  } as User;

  await DynamoDb.put({ TableName: process.env.DDB_TABLE_NAME, Item: newUser });

  return newUser;
}

export async function updateUserConversationState(
  slackID: string,
  conversationInfo: Conversation
) {
  const updated = await DynamoDb.update({
    TableName: process.env.DDB_TABLE_NAME,
    Key: { slackID },
    ReturnValues: 'ALL_NEW',
    ExpressionAttributeValues: {
      ':s': conversationInfo.state,
      ':m': conversationInfo.memory,
    },
    ExpressionAttributeNames: {
      '#Conv': 'conversation',
      '#S': 'state',
      '#M': 'memory',
    },
    UpdateExpression: 'SET #Conv.#S = :s, #Conv.#M = :m',
  });
  return updated;
}

export async function addTimeOffRequest(
  slackID: string,
  existingRequest: ALRequest[],
  newRequest: ALRequest
) {
  const newRequestID = existingRequest.length + 1;
  newRequest.id = newRequestID;

  const requestsUpdate = [...existingRequest, newRequest];

  const updated = await DynamoDb.update({
    TableName: process.env.DDB_TABLE_NAME,
    Key: { slackID },
    ReturnValues: 'ALL_NEW',
    ExpressionAttributeValues: {
      ':r': requestsUpdate,
    },
    ExpressionAttributeNames: {
      '#R': 'requests',
    },
    UpdateExpression: 'SET #R = :r',
  });
  console.log('addTimeOffRequest', updated);
  return newRequestID;
}

export async function updateTimeOffRequestState(
  slackID: string,
  requestID: number,
  requests: ALRequest[],
  newStatus: ALStatus
) {
  let updatedRequest: ALRequest;
  console.log(requestID);
  console.log(JSON.stringify(requests));
  for (let index = 0; index < requests.length; index++) {
    const request = requests[index];
    if (request.id == requestID) {
      request.status = newStatus;
      updatedRequest = request;
    }
  }

  const result = await DynamoDb.update({
    TableName: process.env.DDB_TABLE_NAME,
    Key: { slackID },
    ReturnValues: 'ALL_NEW',
    ExpressionAttributeValues: {
      ':r': requests,
    },
    ExpressionAttributeNames: {
      '#R': 'requests',
    },
    UpdateExpression: 'SET #R = :r',
  });
  console.log(result);
  return updatedRequest;
}
