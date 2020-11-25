import { SippuAction, SippuIncome } from './sippu';
import { getMessage, BLOCKS, getMessageWithOptions } from './messages';

import { STATES } from './states';
import { INTENTS } from './intents';
import { isoToReadable, timeOffCalculationLogic } from './timeoff';
import { addTimeOffRequest, ALRequest, ALStatus, User } from '../db';
import { sendBlock } from '../slack-api';

export class HelloAction extends SippuAction {
  constructor() {
    super(STATES.DEFAULT, INTENTS.Hi);
  }

  canHandle(incomingRequest: SippuIncome) {
    return INTENTS.Hi === incomingRequest.intent;
  }

  async handle(incomingRequest: SippuIncome, options) {
    return {
      texts: [getMessage('GREETINGS'), getMessage('GREETINGS2')],
      state: STATES.DEFAULT,
      memory: { ...options.user.conversation.memory },
    };
  }
}

export class ALCountAction extends SippuAction {
  constructor() {
    super(STATES.DEFAULT, INTENTS.AnnualLeaveCount);
  }

  async handle(incomingRequest: SippuIncome, options) {
    const aLCountConsumed = options.user.requests.reduce((acc, request) => {
      return request.status === ALStatus.Approved
        ? acc + request.leaveCount
        : acc;
    }, 0);

    const aLCountLeft = options.user.initialLeaveCount - aLCountConsumed;

    return {
      texts: [
        getMessageWithOptions('ANNUAL_LEAVE_COUNT', { left: aLCountLeft }),
      ],
      state: STATES.DEFAULT,
      memory: { ...options.user.conversation.memory },
    };
  }
}

export class FallbackDetailAction extends SippuAction {
  constructor() {
    super(STATES.DEFAULT, INTENTS.Fallback);
  }

  canHandle(incomingRequest: SippuIncome): boolean {
    return (
      incomingRequest.intent === this.requiredInputIntent &&
      (incomingRequest.state === STATES.AL_DETAILS_ASKED ||
        incomingRequest.state === STATES.AL_RETURN_DATE_ASKED ||
        incomingRequest.state === STATES.AL_START_DATE_ASKED)
    );
  }
  async handle(incomingRequest: SippuIncome, options) {
    return {
      texts: [getMessage('TIME_OFF_DETAILS_FALLBACK')],
      state: incomingRequest.state,
      memory: { ...options.user.conversation.memory },
    };
  }
}

export class TimeOffStart extends SippuAction {
  constructor() {
    super(STATES.DEFAULT, INTENTS.RequestTimeOff);
  }

  async handle(incomingRequest: SippuIncome, options) {
    // next state?
    let nextState = options.user.conversation.state;
    let responses: string[];
    let memory = { ...options.slots };

    if (
      (memory.date && memory.date1) ||
      (memory.date && memory.duration) ||
      (memory.date1 && memory.duration)
    ) {
      // all information fetched
      const result = timeOffCalculationLogic(memory, options.user);
      nextState = result.nextState;
      responses = result.responses;
      memory = result.memory;
    } else if (memory.date || memory.date1) {
      // 1 date, assuming start date at this point
      // asking end date
      nextState = STATES.AL_RETURN_DATE_ASKED;
      responses = [getMessage('TIME_OFF_END_QUESTION')];
    } else if (memory.duration) {
      // only got the duration
      // asking start date
      nextState = STATES.AL_START_DATE_ASKED;
      responses = [getMessage('TIME_OFF_START_QUESTION')];
    } else {
      // no details
      // asking for details
      nextState = STATES.AL_DETAILS_ASKED;
      responses = [getMessage('TIME_OFF_START_QUESTION')];
    }

    return {
      texts: responses,
      state: nextState,
      memory,
    };
  }
}

export class TimeOffDetails extends SippuAction {
  constructor() {
    // not actually using this as canHandle override
    super(STATES.AL_DETAILS_ASKED, INTENTS.RequestTimeOff);
  }

  canHandle(incomingRequest: SippuIncome): boolean {
    return (
      incomingRequest.intent === INTENTS.RequestTimeOff &&
      (incomingRequest.state === STATES.AL_DETAILS_ASKED ||
        incomingRequest.state === STATES.AL_RETURN_DATE_ASKED ||
        incomingRequest.state === STATES.AL_START_DATE_ASKED)
    );
  }

  async handle(incomingRequest: SippuIncome, options) {
    let nextState = options.user.conversation.state;
    let responses: string[];
    let memory = { ...options.user.conversation.memory };

    // consolidation
    if (options.slots.date && options.slots.date1) {
      memory.date = options.slots.date;
      memory.date1 = options.slots.date1;
    } else if (
      (options.slots.date || options.slots.date1) &&
      !memory.date &&
      !memory.date1
    ) {
      memory.date = options.slots.date ?? options.slots.date1;
    } else if ((options.slots.date || options.slots.date1) && memory.date) {
      memory.date1 = options.slots.date ?? options.slots.date1;
    } else if ((options.slots.date || options.slots.date1) && memory.date1) {
      memory.date = options.slots.date ?? options.slots.date1;
    }

    if (options.slots.duration) {
      memory.duration = options.slots.duration;
    }

    //next step
    if (
      (memory.date && memory.date1) ||
      (memory.date && memory.duration) ||
      (memory.date1 && memory.duration)
    ) {
      // all information fetched
      const result = timeOffCalculationLogic(memory, options.user);
      nextState = result.nextState;
      responses = result.responses;
      memory = result.memory;
    } else if (memory.date || memory.date1) {
      // 1 date, assuming start date at this point
      // asking end date
      nextState = STATES.AL_RETURN_DATE_ASKED;
      responses = [getMessage('TIME_OFF_END_QUESTION')];
    } else if (memory.duration) {
      // only got the duration
      // asking start date
      nextState = STATES.AL_START_DATE_ASKED;
      responses = [getMessage('TIME_OFF_START_QUESTION')];
    } else {
      // no details
      // asking for details
      nextState = STATES.AL_DETAILS_ASKED;
      responses = [getMessage('TIME_OFF_START_QUESTION')];
    }

    return {
      texts: responses,
      state: nextState,
      memory,
    };
  }
}

export class TimeOffConfirm extends SippuAction {
  constructor() {
    super(STATES.AL_CONFIRMATION_ASKED, INTENTS.Yes);
  }

  async handle(incomingRequest: SippuIncome, options) {
    let nextState = STATES.DEFAULT;
    let responses = [getMessage('TIME_OFF_REQUEST_SUBMITTED')];
    let memory = { ...options.user.conversation.memory };

    const user: User = options.user;

    const newRequest: ALRequest = {
      startDate: memory.date,
      returnDate: memory.date1,
      leaveCount: memory.duration,
      status: ALStatus.Requested,
    };

    const newRequestID = await addTimeOffRequest(
      user.slackID,
      user.requests,
      newRequest
    );
    await sendBlock(
      BLOCKS.approvalRequest(user.slackID, {
        startDate: isoToReadable(newRequest.startDate),
        returnDate: isoToReadable(newRequest.returnDate),
        aLCount: newRequest.leaveCount,
        aLLeft: memory.left,
        id: newRequestID.toString(),
      }),
      'New time off request',
      user.lineManagerID
    );

    return {
      texts: responses,
      state: nextState,
      memory: {},
    };
  }
}

export class TimeOffCancel extends SippuAction {
  constructor() {
    super(STATES.DEFAULT, INTENTS.No);
  }

  canHandle(incomingRequest: SippuIncome): boolean {
    return (
      incomingRequest.intent === INTENTS.No &&
      (incomingRequest.state === STATES.AL_DETAILS_ASKED ||
        incomingRequest.state === STATES.AL_RETURN_DATE_ASKED ||
        incomingRequest.state === STATES.AL_CONFIRMATION_ASKED ||
        incomingRequest.state === STATES.AL_START_DATE_ASKED)
    );
  }

  async handle(incomingRequest: SippuIncome, options) {
    let nextState = STATES.DEFAULT;
    let responses = [getMessage('GENERIC_END')];
    let memory = {};
    return {
      texts: responses,
      state: nextState,
      memory,
    };
  }
}
