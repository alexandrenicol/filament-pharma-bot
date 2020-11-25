function template(strings, ...keys) {
  return function(...values) {
    let dict = values[values.length - 1] || {};
    let result = [strings[0]];
    keys.forEach(function(key, i) {
      let value = Number.isInteger(key) ? values[key] : dict[key];
      result.push(value, strings[i + 1]);
    });
    return result.join('');
  };
}

// export const t3Closure = template`I'm ${'name'}. I'm almost ${'age'} years old.`;
// t3Closure({name: 'MDN', age: 30});

export const MESSAGES = {
  GREETINGS: ['Hi there!', 'Hello', 'Hi!'],
  GREETINGS2: [
    'How can I help you today?',
    'What can I do for you today?',
    'How can I help?',
  ],
  TIME_OFF_START_QUESTION: ['When would you like your time off to start?'],
  TIME_OFF_END_QUESTION: ['When yould you like to go back to work?'],
  TIME_OFF_REQUEST_RECAP: [
    template`Let's recap, your annual leave will start on ${'date'}, until ${'date1'}. You'll use ${'duration'} annual leave days, and you'll have ${'left'} annual leave days remaining. Please remember to reschedule any meetings booked during this period.`,
  ],
  TIME_OFF_REQUEST_ASK_CONFIRM: [
    'Would you like to submit this request for approval?',
  ],
  TIME_OFF_AUTO_DECLINE: [
    template`Sorry, you don't have enough annual leave left to book this holiday. You only have ${'left'} days left, and you need ${'duration'} to book this holiday.`,
  ],
  TIME_OFF_AUTO_APPROVE: ['All done, your request was approved automatically.'],
  TIME_OFF_REQUEST_SUBMITTED: [
    'Thank you, your request has been submitted to your line manager.',
  ],
  TIME_OFF_REQUEST_APPROVED: [
    'Your line manager has approved your holiday request.',
  ],
  TIME_OFF_REQUEST_DECLINED: [
    "Your line manager has declined your holiday request. They'll be in touch soon to explain their decision.",
  ],
  TIME_OFF_DETAILS_FALLBACK: ['Please type a date, in example: 21 December.'],
  ANNUAL_LEAVE_COUNT: [
    template`You have ${'left'} annual leave days remaining`,
  ],
  GENERIC_END: [
    'Okay.',
    'Okay, no problem',
    'Okay, see you later!',
    'Okay, have a good day.',
  ],
};

export function randomInt(max: number): number {
  return Math.floor(Math.random() * Math.floor(max));
}

export function getMessage(key: string): string {
  return MESSAGES[key][randomInt(MESSAGES[key].length)];
}

export function getMessageWithOptions(key: string, options): string {
  const closure = MESSAGES[key][randomInt(MESSAGES[key].length)];
  return closure(options);
}

export const BLOCKS = {
  approvalRequest: (
    userID: string,
    request: {
      startDate: string;
      returnDate: string;
      aLCount: number;
      aLLeft: number;
      id: string;
    }
  ) => {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `You have a new holiday request:\n*<@${userID}>*`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Start:*\n${request.startDate}`,
          },
          {
            type: 'mrkdwn',
            text: `*Return:*\n${request.returnDate}`,
          },
          {
            type: 'mrkdwn',
            text: `*Annual leave use for this request:*\n${request.aLCount}`,
          },
          {
            type: 'mrkdwn',
            text: `*Annual leave left if approved:*\n${request.aLLeft}`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              emoji: true,
              text: 'Approve',
            },
            style: 'primary',
            value: `approvetimeoff_${userID}_${request.id}`,
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              emoji: true,
              text: 'Deny',
            },
            style: 'danger',
            value: `declinetimeoff_${userID}_${request.id}`,
          },
        ],
      },
    ];
  },
  requestApproved: (
    userID: string,
    request: {
      startDate: string;
      returnDate: string;
      aLCount: number;
    }
  ) => {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `You have approved the following holiday request from:\n*<@${userID}>*`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Start:*\n${request.startDate}`,
          },
          {
            type: 'mrkdwn',
            text: `*Return:*\n${request.returnDate}`,
          },
          {
            type: 'mrkdwn',
            text: `*Annual leave use for this request:*\n${request.aLCount}`,
          },
        ],
      },
    ];
  },
  requestDeclined: (
    userID: string,
    request: {
      startDate: string;
      returnDate: string;
      aLCount: number;
    }
  ) => {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `You have declined the following holiday request from:\n*<@${userID}>*`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Start:*\n${request.startDate}`,
          },
          {
            type: 'mrkdwn',
            text: `*Return:*\n${request.returnDate}`,
          },
          {
            type: 'mrkdwn',
            text: `*Annual leave use for this request:*\n${request.aLCount}`,
          },
        ],
      },
    ];
  },
};
