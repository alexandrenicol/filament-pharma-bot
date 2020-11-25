/**
 * SIPPU Conversation Management Framework
 *
 * Based on conversational principles:
 * - State based
 * - Intent are not actions
 * - Personalisation
 * - Profile matters
 * - Unique answers
 */
import { STATES } from './states';
import { INTENTS } from './intents';

export interface SippuOutcome {
  texts: string[];
  state: STATES;
  memory: {
    [k: string]: string;
  };
  error?: boolean;
}

export interface SippuIncome {
  state: STATES;
  intent: INTENTS;
}

export abstract class SippuAction {
  constructor(
    public requiredInputState: STATES,
    public requiredInputIntent: INTENTS
  ) {}

  canHandle(incomingRequest: SippuIncome): boolean {
    return (
      incomingRequest.state === this.requiredInputState &&
      incomingRequest.intent === this.requiredInputIntent
    );
  }

  abstract async handle(
    incomingRequest: SippuIncome,
    options: any
  ): Promise<SippuOutcome>;
}

export class SippuConversationAdapter {
  constructor(private actions: SippuAction[]) {}

  async exec(incomingRequest: SippuIncome, options: any) {
    console.log(incomingRequest);

    for (let index = 0; index < this.actions.length; index++) {
      const action = this.actions[index];

      console.log(
        `Testing: ${action.constructor.name} with ${action.requiredInputIntent} & ${action.requiredInputState}`
      );

      if (action.canHandle(incomingRequest)) {
        console.log(action.constructor.name + ' can Handle: true');
        return await action.handle(incomingRequest, options);
      }
    }

    return {
      texts: ["Sorry, I'm not sure about that."],
      error: true,
    } as SippuOutcome;
  }
}
