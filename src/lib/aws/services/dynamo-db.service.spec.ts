import { DynamoDb } from './dynamo-db.service';
import { config, DynamoDB } from 'aws-sdk';
import {
  DbGetParams,
  DbPutParams,
  DbUpdateParams,
  DbDeleteParams,
  DbScanParams,
} from '../interfaces/dynamo-db';

import 'jasmine';

describe('DynamoDb', () => {
  describe('get()', () => {
    const getParams: DbGetParams = {
      TableName: 'DYNAMODB_TABLE_NAME',
      Key: { bpid: '1234' },
    };

    let paramsWatcher: DbGetParams = {
      TableName: '',
      Key: { bpid: '' },
    };

    const Item = {
      one: 'one',
      two: 'two',
    };

    const dynamoDb = {
      get: (getParams: DbGetParams) => {
        paramsWatcher = getParams;
        return {
          promise: async () => {
            return {
              Item,
            };
          },
        };
      },
    };

    beforeEach(() => {
      spyOn<any>(DynamoDb, 'init').and.returnValue(dynamoDb);
    });

    it('should call init', async () => {
      await DynamoDb.get(getParams);

      expect(DynamoDb.init).toHaveBeenCalled();
    });

    it('should call get with the correct params', async () => {
      await DynamoDb.get(getParams);

      expect(paramsWatcher).toEqual(getParams);
    });

    it('should return an item', async () => {
      const result = await DynamoDb.get(getParams);

      expect(result).toEqual(Item);
    });
  });

  describe('getAll', () => {
    const item = { thing: 'thing' };
    const output = {
      Items: [item, item, item],
      LastEvaluatedKey: { thing: 'thing' },
    };
    const outPutLast = { Items: [item, item, item] };

    it('should call scan with the correct params', async () => {
      spyOn(DynamoDb, 'scan').and.returnValues(
        Promise.resolve(output),
        Promise.resolve(outPutLast)
      );

      const params = { TableName: 'TableName', Limit: 3 };

      await DynamoDb.getAll(params);

      expect(DynamoDb.scan).toHaveBeenCalledWith(params);
    });

    it('should call scan the correct amount of times', async () => {
      spyOn(DynamoDb, 'scan').and.returnValues(
        Promise.resolve(output),
        Promise.resolve(output),
        Promise.resolve(outPutLast)
      );

      const params = { TableName: 'TableName', Limit: 3 };

      await DynamoDb.getAll(params);

      expect(DynamoDb.scan).toHaveBeenCalledTimes(3);
    });

    it('should log end of scan when no items are returned', async () => {
      spyOn(DynamoDb, 'scan').and.returnValue(Promise.resolve({}));

      const params = { TableName: 'TableName', Limit: 3 };

      await DynamoDb.getAll(params);
    });

    it('should return an array of results', async () => {
      spyOn(DynamoDb, 'scan').and.returnValues(
        Promise.resolve(output),
        Promise.resolve(output),
        Promise.resolve(outPutLast)
      );

      const params = { TableName: 'TableName', Limit: 3 };

      const result = await DynamoDb.getAll(params);
      expect(result).toEqual([
        { thing: 'thing' },
        { thing: 'thing' },
        { thing: 'thing' },
        { thing: 'thing' },
        { thing: 'thing' },
        { thing: 'thing' },
        { thing: 'thing' },
        { thing: 'thing' },
        { thing: 'thing' },
      ]);
    });
  });

  describe('buildScanParams', () => {
    it('should build the params in the correct format', async () => {
      const result = DynamoDb.buildScanParams('tableName', 'field', [
        'value1',
        'value2',
        'value3',
      ]);

      const expectedResult = {
        TableName: 'tableName',
        FilterExpression: '#field in (:x0, :x1, :x2)',
        ExpressionAttributeNames: { '#field': 'field' },
        ExpressionAttributeValues: {
          ':x0': 'value1',
          ':x1': 'value2',
          ':x2': 'value3',
        },
      };

      expect(result).toEqual(expectedResult);
    });
  });

  describe('buildUpdateParams', () => {
    it('should build the params in the correct format', async () => {
      const result = DynamoDb.buildUpdateParams(
        'tableName',
        { key: 'key' },
        'field',
        'value'
      );

      const expectedResult = {
        TableName: 'tableName',
        Key: { key: 'key' },
        UpdateExpression: 'set #c = :newValue',
        ExpressionAttributeValues: { ':newValue': 'value' },
        ExpressionAttributeNames: { '#c': 'field' },
        ReturnValues: 'UPDATED_NEW',
      };

      expect(result).toEqual(expectedResult);
    });
  });

  describe('scan', () => {
    const scanParams: DbScanParams = {
      TableName: 'tableName',
      FilterExpression: '#field in (:x0, :x1, :x2)',
      ExpressionAttributeNames: { '#field': 'field' },
      ExpressionAttributeValues: {
        ':x0': 'value1',
        ':x1': 'value2',
        ':x2': 'value3',
      },
    };

    let paramsWatcher: DbScanParams;

    const dynamoDb = {
      scan: (getParams: DbScanParams) => {
        paramsWatcher = getParams;
        return {
          promise: async () => {
            return true;
          },
        };
      },
    };

    beforeEach(() => {
      spyOn<any>(DynamoDb, 'init').and.returnValue(dynamoDb);
    });

    it('should call init', async () => {
      await DynamoDb.scan(scanParams);

      expect(DynamoDb.init).toHaveBeenCalled();
    });

    it('should call put with the correct params', async () => {
      await DynamoDb.scan(scanParams);

      expect(paramsWatcher).toEqual(scanParams);
    });
  });

  describe('put', () => {
    const putParams: DbPutParams = {
      TableName: 'DYNAMODB_TABLE_PROFILE',
      Item: { bpid: '1234' },
    };

    let paramsWatcher: DbPutParams = {
      TableName: '',
      Item: {},
    };

    const dynamoDb = {
      put: (getParams: DbPutParams) => {
        paramsWatcher = getParams;
        return {
          promise: async () => {
            return true;
          },
        };
      },
    };

    beforeEach(() => {
      spyOn<any>(DynamoDb, 'init').and.returnValue(dynamoDb);
    });

    it('should call init', async () => {
      await DynamoDb.put(putParams);

      expect(DynamoDb.init).toHaveBeenCalled();
    });

    it('should call put with the correct params', async () => {
      await DynamoDb.put(putParams);

      expect(paramsWatcher).toEqual(putParams);
    });
  });

  describe('update', () => {
    const updateParams: DbUpdateParams = {
      TableName: 'DYNAMODB_TABLE_PROFILE',
      Key: { bpid: '12345' },
      UpdateExpression: 'set syncedWithOnzo = :newStatus',
      ExpressionAttributeValues: {
        ':newStatus': 'a new status',
      },
      ReturnValues: 'UPDATED_NEW',
    };

    let paramsWatcher: DbUpdateParams = {
      TableName: '',
      Key: { bpid: '' },
      UpdateExpression: '',
      ExpressionAttributeValues: {
        ':newStatus': '',
      },
      ReturnValues: 'UPDATED_NEW',
    };

    const dynamoDb = {
      update: (updateParams: DbUpdateParams) => {
        paramsWatcher = updateParams;
        return {
          promise: async () => {
            return true;
          },
        };
      },
    };

    beforeEach(() => {
      spyOn<any>(DynamoDb, 'init').and.returnValue(dynamoDb);
    });

    it('should call init', async () => {
      await DynamoDb.update(updateParams);

      expect(DynamoDb.init).toHaveBeenCalled();
    });

    it('should call update with correct params', async () => {
      await DynamoDb.update(updateParams);
      expect(paramsWatcher).toEqual(updateParams);
    });
  });

  describe('delete', () => {
    const deleteParams: DbDeleteParams = {
      TableName: 'TABLENAME',
      Key: { bpid: '12345' },
    };

    let paramsWatcher: DbDeleteParams = {
      Key: {},
      TableName: '',
    };

    const dynamoDb = {
      delete: (deleteParams: DbDeleteParams) => {
        paramsWatcher = deleteParams;
        return {
          promise: async () => {
            return true;
          },
        };
      },
    };

    beforeEach(() => {
      spyOn<any>(DynamoDb, 'init').and.returnValue(dynamoDb);
    });

    it('should call init', async () => {
      await DynamoDb.delete(deleteParams);

      expect(DynamoDb.init).toHaveBeenCalled();
    });

    it('should call delete with correct params', async () => {
      await DynamoDb.delete(deleteParams);
      expect(paramsWatcher).toEqual(deleteParams);
    });
  });

  describe('init', () => {
    beforeEach(() => {
      spyOn(config, 'update');
    });

    it('should init dynamoDB if no instance exists already', async () => {
      DynamoDb.dynamoDbInstance = undefined;

      await DynamoDb.init();

      expect(config.update).toHaveBeenCalledWith({ region: 'eu-west-1' });
    });

    it('should not set the dynamoDbInstance if already set', async () => {
      DynamoDb.dynamoDbInstance = new DynamoDB.DocumentClient();
      await DynamoDb.init();
    });
  });
});
