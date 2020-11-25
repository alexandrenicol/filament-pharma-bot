export function getScanParams() {
  return {
    TableName: 'tableName',
    FilterExpression: '#field in (:x0, :x1, :x2)',
    ExpressionAttributeNames: { '#field': 'field' },
    ExpressionAttributeValues: {
      ':x0': 'value1',
      ':x1': 'value2',
      ':x2': 'value3',
    },
  };
}

export function getUpdateParams() {
  return {
    TableName: 'tableName',
    Key: { key: 'key' },
    UpdateExpression: 'set #c = :newValue',
    ExpressionAttributeValues: { ':newValue': 'value' },
    ExpressionAttributeNames: { '#c': 'field' },
    ReturnValues: 'UPDATED_NEW',
  };
}
