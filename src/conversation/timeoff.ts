import { DateTime } from 'luxon';
import { ALStatus, User } from '../db';
import { getMessage, getMessageWithOptions } from './messages';
import { STATES } from './states';

export interface TimeOffRequest {
  startDate: DateTime;
  endDate: DateTime;
  startDateReadable: string;
  endDateReadable: string;
  duration: number;
}

export function isoToReadable(date: string): string {
  return DateTime.fromISO(date).toFormat('cccc d LLLL');
}

export function calculateBusinessDays(d1: DateTime, d2: DateTime) {
  const days = d2.diff(d1, 'days').days;
  let newDay = d1,
    workingDays: number = 0,
    sundays: number = 0,
    saturdays: number = 0;
  for (let i = 0; i < days; i++) {
    const day = newDay.weekday;

    const isWeekend = day > 5;
    if (!isWeekend) {
      workingDays++;
    } else {
      if (day === 6) saturdays++;
      if (day === 7) sundays++;
    }

    newDay = newDay.plus({ days: 1 });
  }
  console.log(
    'Total Days:',
    days,
    'workingDays',
    workingDays,
    'saturdays',
    saturdays,
    'sundays',
    sundays
  );
  return workingDays;
}

export function getTimeOffRequestFrom2Dates(
  date: string,
  date1: string
): TimeOffRequest {
  let startDate = DateTime.fromISO(date);
  let endDate = DateTime.fromISO(date1);

  if (endDate < startDate) {
    let tmp = endDate;
    endDate = startDate;
    startDate = tmp;
  }

  return {
    startDate,
    endDate,
    startDateReadable: startDate.toFormat('cccc d LLLL'),
    endDateReadable: endDate.toFormat('cccc d LLLL'),
    duration: calculateBusinessDays(startDate, endDate),
  };
}

export function getTimeOffRequestFromDateAndDuration(
  date: string,
  duration: string
): TimeOffRequest {
  let startDate = DateTime.fromISO(date);
  let endDate = startDate.plus({ days: Number(duration) });

  return {
    startDate,
    endDate,
    startDateReadable: startDate.toFormat('cccc d LLLL'),
    endDateReadable: endDate.toFormat('cccc d LLLL'),
    duration: calculateBusinessDays(startDate, endDate),
  };
}

export function timeOffCalculationLogic(
  memory: {
    date?: string;
    date1?: string;
    duration?: number;
    left?: number;
  },
  user: User
) {
  let nextState = user.conversation.state;
  let responses: string[];

  let timeOffRequest: TimeOffRequest;

  if (memory.date && memory.date1) {
    timeOffRequest = getTimeOffRequestFrom2Dates(memory.date, memory.date1);
  } else {
    timeOffRequest = getTimeOffRequestFromDateAndDuration(
      memory.date ?? memory.date1,
      memory.duration.toString()
    );
  }

  console.log('time off request', timeOffRequest);

  // calculating user consumed AL
  const aLCountConsumed = user.requests.reduce((acc, request) => {
    return request.status === ALStatus.Approved
      ? acc + request.leaveCount
      : acc;
  }, 0);

  const aLCountLeft = user.initialLeaveCount - aLCountConsumed;

  if (timeOffRequest.duration > aLCountLeft) {
    // request cannot be submitted
    nextState = STATES.DEFAULT;
    responses = [
      getMessageWithOptions('TIME_OFF_AUTO_DECLINE', {
        left: aLCountLeft,
        duration: timeOffRequest.duration,
      }),
    ];
    memory = {};
  } else {
    // sending recap and confirm
    nextState = STATES.AL_CONFIRMATION_ASKED;
    responses = [
      getMessageWithOptions('TIME_OFF_REQUEST_RECAP', {
        date: timeOffRequest.startDateReadable,
        date1: timeOffRequest.endDateReadable,
        duration: timeOffRequest.duration,
        left: aLCountLeft - timeOffRequest.duration,
      }),
      getMessage('TIME_OFF_REQUEST_ASK_CONFIRM'),
    ];
    memory = {
      ...user.conversation.memory,
      date: timeOffRequest.startDate.toISO(),
      date1: timeOffRequest.endDate.toISO(),
      duration: timeOffRequest.duration,
      left: aLCountLeft - timeOffRequest.duration,
    };
  }

  return {
    nextState,
    responses,
    memory,
  };
}
