const AWS = require('aws-sdk')
const uuid = require('uuid')
const Joi = require('@hapi/joi')

const dynamoDB = new AWS.DynamoDB.DocumentClient()

class Handler {
  constructor({ dynamoDbSvc }) {
    this.dynamoDbSvc = dynamoDbSvc
    this.dynamoDbTable = process.env.DYNAMODB_TABLE
  }

  static validator() {
    return Joi.object({
      name: Joi.string().max(100).min(2).required(),
      power: Joi.string().max(20).required()
    })
  }

  async insertItem(params) {
    return this.dynamoDbSvc.put(params).promise()
  }

  prepareData(data) {
    const params = {
      TableName: this.dynamoDbTable,
      Item: {
        ...data,
        id: uuid.v1(),
        createdAt: new Date().toISOString()
      }
    }

    return params
  }

  handleSuccess(data) {
    const response = {
      statusCode: 200,
      body: JSON.stringify(data)
    }

    return response
  }

  handleError(data) {
    return {
      statusCode: data.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Couldn\'t create item!'
    }
  }

  async main(event) {
    try {
      const data = JSON.parse(event.body)
      const { error, value } = await Handler.validator().validate(data)
      console.log({
        error,
        value
      })
      return {
        statusCode: 200
      }
      // const dbParams = this.prepareData(data)

      // await this.insertItem(dbParams)

      // return this.handleSuccess(dbParams.Item)
    } catch (error) {
      console.error('Deu ruim**', error.stack)

      return this.handleError({ statusCode: 500 })
    }
  }
}

const handler = new Handler({
  dynamoDbSvc: dynamoDB
})

module.exports = handler.main.bind(handler)