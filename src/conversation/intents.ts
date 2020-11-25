export enum INTENTS {
  Hi,
  No,
  Yes,
  RequestTimeOff,
  Edit,
  Fallback,
  AnnualLeaveCount,
}

export const intentsReverseMap: string[] = [
  'INTENT.Hi',
  'INTENT.No',
  'INTENT.Yes',
  'INTENT.RequestTimeOff',
  'INTENT.Edit',
  'INTENT.Fallback',
  'INTENT.AnnualLeaveCount',
];

export function getEnumFromIntentName(intent: string): INTENTS {
  return intentsReverseMap.indexOf(intent);
}
