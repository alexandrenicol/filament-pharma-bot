export interface DbUpdateParams {
  TableName: string;
  Key: { [key: string]: string | number };
  UpdateExpression: string;
  ExpressionAttributeValues: DbExpressionAttributeValues;
  ExpressionAttributeNames?: DbExpressionAttributeValues;
  ReturnValues: string;
}

export interface DbExpressionAttributeValues {
  [key: string]: any;
}

export interface DbGetItemParams {
  AttributesToGet: string[];
  TableName: string;
  Key: DbExpressionAttributeValues;
}

export interface DbPutParams {
  TableName: string;
  Item: object;
  ReturnItemCollectionMetrics?: string;
  ReturnConsumedCapacity?: string;
  ReturnValues?: string;
}

export interface DbDeleteParams {
  TableName: string;
  Key: DbExpressionAttributeValues;
}

export interface DbGetParams {
  AttributesToGet?: string[];
  TableName: string;
  Key: DbExpressionAttributeValues;
  ConsistentRead?: boolean;
}

export interface DbGetAllParams {
  AttributesToGet?: string[];
  TableName: string;
}

export interface DbScanParams {
  TableName: string;
  FilterExpression?: string;
  AttributesToGet?: string[];
  ExpressionAttributeNames?: { [key: string]: string };
  ExpressionAttributeValues?: { [key: string]: string };
  ExclusiveStartKey?: { [key: string]: string };
  Limit?: number;
}
