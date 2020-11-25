import { detectIntent } from './nlp';
import { sendMessage } from './slack-api';

import { SippuConversationAdapter } from './conversation/sippu';

import {
  ALCountAction,
  FallbackDetailAction,
  HelloAction,
  TimeOffCancel,
  TimeOffConfirm,
  TimeOffDetails,
  TimeOffStart,
} from './conversation/actions';
import { getEnumFromIntentName } from './conversation/intents';
import { getUserOrCreate, updateUserConversationState } from './db';

export interface IncomingSlackMessage {
  text: string;
  user: string;
  channel: string;
  team: string;
}

const sleep = m => new Promise(r => setTimeout(r, m));

function configureConversationAdapter() {
  return new SippuConversationAdapter([
    new HelloAction(),
    new TimeOffStart(),
    new TimeOffDetails(),
    new TimeOffConfirm(),
    new TimeOffCancel(),
    new FallbackDetailAction(),
    new ALCountAction(),
  ]);
}

export async function processIncomingRequest(
  incomingRequest: IncomingSlackMessage
) {
  const adapter = configureConversationAdapter();

  const user = await getUserOrCreate(incomingRequest.user);

  const nplResponse = await detectIntent(incomingRequest.text);

  const nextStep = await adapter.exec(
    {
      state: user.conversation.state,
      intent: getEnumFromIntentName(nplResponse.intent),
    },
    {
      slots: nplResponse.slots ?? undefined,
      user: user,
    }
  );

  console.log('nextStep', nextStep);

  for (let index = 0; index < nextStep.texts.length; index++) {
    const text = nextStep.texts[index];
    const apiResult = await sendMessage(text, incomingRequest.channel);
    await sleep(500);
    console.log(JSON.stringify(apiResult));
  }

  //set user state in DB
  await updateUserConversationState(user.slackID, {
    memory: nextStep.memory,
    state: nextStep.state,
  });
}
