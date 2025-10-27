const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function putItem(tableName, item) {
  const params = {
    TableName: tableName,
    Item: item
  };
  
  try {
    const result = await dynamodb.put(params).promise();
    return result;
  } catch (error) {
    console.error('Error putting item:', error);
    throw error;
  }
}

async function getItem(tableName, key) {
  const params = {
    TableName: tableName,
    Key: key
  };
  
  try {
    const result = await dynamodb.get(params).promise();
    return result;
  } catch (error) {
    console.error('Error getting item:', error);
    throw error;
  }
}

async function updateItem(tableName, key, updateExpression, expressionAttributeValues) {
  const params = {
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  };
  
  try {
    const result = await dynamodb.update(params).promise();
    return result;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
}

async function deleteItem(tableName, key) {
  const params = {
    TableName: tableName,
    Key: key
  };
  
  try {
    const result = await dynamodb.delete(params).promise();
    return result;
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
}

async function queryItems(tableName, keyConditionExpression, expressionAttributeValues) {
  const params = {
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues
  };
  
  try {
    const result = await dynamodb.query(params).promise();
    return result;
  } catch (error) {
    console.error('Error querying items:', error);
    throw error;
  }
}

async function scanItems(tableName, filterExpression, expressionAttributeValues) {
  const params = {
    TableName: tableName,
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues
  };
  
  try {
    const result = await dynamodb.scan(params).promise();
    return result;
  } catch (error) {
    console.error('Error scanning items:', error);
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  putItem,
  getItem,
  updateItem,
  deleteItem,
  queryItems,
  scanItems
};
