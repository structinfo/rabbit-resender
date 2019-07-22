# RabbitMQ Resender v0.1


### Use in 3 easy steps:

##### Step 1
```
npm install
```

##### Step 2
Configure in resender.json file.

##### Step 3
```
npm start
```

### Sample resender.json file

```
{
  "uriGet" : "amqp://login1:password1@100.100.100.100:5672",
  "uriSend": "amqp://login2:password2@200.200.200.200:5672",

  "exchangeMap": [
    [ "exchangeToGetFrom1",   "exchangeToSendTo1" ],
    [ "exchangeToGetFrom2",   "exchangeToSendTo2" ],
    [ "exchangeToGetFrom3",   "exchangeToSendTo3" ]
  ],

  "queuePrefix": "resender.",

  "queueOptions": "queueOptionsLight",

  "queueOptionsLight": {
    "description": "Set queueOptions=queueOptionsLight if you resend messages for testing purposes and don't worry much if some messages will be lost (when resender is stopped etc).",
    "autoDelete": true
  },
  "queueOptionsDurable": {
    "description": "Set queueOptions=queueOptionsDurable if it is important for you to resend all the messages.",
    "durable": true,
    "autoDelete": false,
    "messageTtl": 3600000,
    "messageTtlComment": "Specify appropriate messageTtl in milliseconds (ex. 3600000 is 1 hour) so your messages will not flood RabbitMQ server when resender is stopped."
  }
}
```