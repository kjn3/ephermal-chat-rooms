const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'eu-west-1',
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  }),
  maxAttempts: 3,
  retryMode: 'adaptive',
});

const dynamodb = DynamoDBDocumentClient.from(client);

async function putItem(tableName, item) {
  const command = new PutCommand({
    TableName: tableName,
    Item: item
  });
  
  try {
    const result = await dynamodb.send(command);
    return result;
  } catch (error) {
    console.error('Error putting item:', error);
    throw error;
  }
}

async function getItem(tableName, key) {
  const command = new GetCommand({
    TableName: tableName,
    Key: key
  });
  
  try {
    const result = await dynamodb.send(command);
    return result;
  } catch (error) {
    console.error('Error getting item:', error);
    throw error;
  }
}

async function updateItem(tableName, key, updatesOrExpression, expressionAttributeValues) {
  let command;
  if (typeof updatesOrExpression === 'string') {
    command = new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: updatesOrExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });
  } else {
    const updates = updatesOrExpression || {};
    const keys = Object.keys(updates);
    if (keys.length === 0) return { Attributes: {} };
    const exprParts = [];
    const exprValues = {};
    const exprNames = {};
    for (const k of keys) {
      const nameKey = `#${k}`;
      const valueKey = `:${k}`;
      exprParts.push(`${nameKey} = ${valueKey}`);
      exprValues[valueKey] = updates[k];
      exprNames[nameKey] = k;
    }
    command = new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: `SET ${exprParts.join(', ')}`,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
      ReturnValues: 'ALL_NEW'
    });
  }
  try {
    const result = await dynamodb.send(command);
    return result;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
}

async function deleteItem(tableName, key) {
  const command = new DeleteCommand({
    TableName: tableName,
    Key: key
  });
  
  try {
    const result = await dynamodb.send(command);
    return result;
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
}

async function queryItems(tableName, keyConditionExpression, expressionAttributeValues) {
  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues
  });
  
  try {
    const result = await dynamodb.send(command);
    return result;
  } catch (error) {
    console.error('Error querying items:', error);
    throw error;
  }
}

async function scanItems(tableName, filterExpression, expressionAttributeValues) {
  const command = new ScanCommand({
    TableName: tableName,
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues
  });
  
  try {
    const result = await dynamodb.send(command);
    return result;
  } catch (error) {
    console.error('Error scanning items:', error);
    throw error;
  }
}

module.exports = {
  putItem,
  getItem,
  updateItem,
  deleteItem,
  queryItems,
  scanItems
};
