import { config, DynamoDB } from 'aws-sdk';

// Interfaces
import {
  DbPutParams,
  DbGetParams,
  DbDeleteParams,
  DbUpdateParams,
  DbScanParams,
} from '../interfaces/dynamo-db';

export abstract class DynamoDb {
  static dynamoDbInstance: DynamoDB.DocumentClient | undefined;

  /**
   * Get an item
   *
   * @static
   * @param {DbGetParams} params
   * @memberof DynamoDb
   */
  static async get(params: DbGetParams) {
    const dynamoDb = await this.init();
    const result: any = await dynamoDb.get(params).promise();
    return result.Item;
  }

  /**
   * put a record in a DynamoDb table
   *
   * @static
   * @param {DbPutParams} params
   * @returns
   * @memberof DynamoDb
   */
  static async put(params: DbPutParams) {
    const dynamoDb = await this.init();
    return dynamoDb.put(params).promise();
  }

  /**
   * update a record
   *
   * @static
   * @param {DbUpdateParams} params
   * @returns
   * @memberof DynamoDb
   */
  static async update(params: DbUpdateParams) {
    const dynamoDb = await this.init();
    return dynamoDb.update(params).promise();
  }

  /**
   * Delete an item
   *
   * @static
   * @param {DbDeleteParams} params
   * @returns
   * @memberof DynamoDb
   */
  static async delete(params: DbDeleteParams) {
    const dynamoDb = await this.init();
    return await dynamoDb.delete(params).promise();
  }

  /**
   * Scan all records for field with expected values
   *
   * @static
   * @param {DbScanParams} params
   * @returns
   * @memberof DynamoDb
   */
  static async scan(params: DbScanParams): Promise<any> {
    const dynamoDb = await this.init();
    return await dynamoDb.scan(params).promise();
  }

  /**
   * Gets all the items from a DB
   *
   * @static
   * @memberof DynamoDb
   */
  static async getAll(params: DbScanParams): Promise<any[]> {
    const results: any[] = [];
    let items;
    let count = 0;

    do {
      count++;
      items = await this.scan(params);
      if (items && items.Items) {
        items.Items.forEach((item: any) => results.push(item));
      } else {
        console.log(`end of scan: ${count}`);
      }
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey != 'undefined');

    console.log(`${params.TableName}: ${count} scans`);
    return results;
  }

  /**
   * Init DynamoDb
   *
   * @static
   * @returns
   * @memberof DynamoDb
   */
  static async init() {
    if (!this.dynamoDbInstance) {
      const region = process.env.REGION;
      config.update({ region });
      this.dynamoDbInstance = new DynamoDB.DocumentClient();
    }
    return this.dynamoDbInstance;
  }

  /**
   * Builds and formats the params for scan
   *
   * @static
   * @param {string} TableName
   * @param {string} fieldName
   * @param {string[]} expectedValues
   * @returns
   * @memberof DynamoDb
   */
  static buildScanParams(
    TableName: string,
    fieldName: string,
    expectedValues: string[]
  ) {
    let expectedVarNames = '';
    const expectedAttributeValues: any = {};

    for (let i = 0; i < expectedValues.length; i++) {
      expectedVarNames += ':x' + i + ', ';
      expectedAttributeValues[':x' + i] = expectedValues[i];
    }

    expectedVarNames = expectedVarNames.replace(/,\s$/, '');

    return {
      TableName,
      FilterExpression: `#field in (${expectedVarNames})`,
      ExpressionAttributeNames: {
        '#field': fieldName,
      },
      ExpressionAttributeValues: expectedAttributeValues,
    };
  }

  /**
   *
   *
   * @static
   * @param {string} TableName
   * @param {{ [key: string]: string }} Key
   * @param {string} field
   * @param {*} value
   * @returns
   * @memberof DynamoDb
   */
  static buildUpdateParams(
    TableName: string,
    Key: { [key: string]: string },
    field: string,
    value: any
  ) {
    const UpdateExpression = `set #c = :newValue`;

    return {
      TableName,
      Key,
      UpdateExpression,
      ExpressionAttributeValues: {
        ':newValue': value,
      },
      ExpressionAttributeNames: {
        '#c': `${field}`,
      },
      ReturnValues: 'UPDATED_NEW',
    };
  }
}
