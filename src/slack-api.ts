import { Block, WebAPICallResult, WebClient } from '@slack/web-api';
import fetch from 'node-fetch';

// Read a token from the environment variables
const token = process.env.SLACK_TOKEN;

// Initialize
const web = new WebClient(token);

export async function sendMessage(
  text: string,
  channel: string
): Promise<WebAPICallResult> {
  const result = await web.chat.postMessage({
    text,
    channel,
  });
  return result;
}

export async function sendBlock(
  blocks: Block[],
  text: string,
  channel: string
): Promise<WebAPICallResult> {
  const result = await web.chat.postMessage({
    text,
    blocks,
    channel,
  });
  return result;
}

export async function sendInteractionResponse(url: string, blocks: Block[]) {
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'aplication/json',
    },
    body: JSON.stringify({
      replace_original: true,
      blocks,
    }),
  });
}
