# RabbitMQ Resender v0.1.0

Resends messages from selected exchanges in one instance of RabbitMQ
to exchanges in another instance.
Useful for testing and other purposes.
Requires Node.js & NPM.

### Use in 4 easy steps:

##### Step 1

You need Node.js & NPM to be installed.

##### Step 2

```
npm install
```

##### Step 3

Configure Resender via config.json file.

##### Step 4

```
npm start
```

### Sample config.json file

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
    "exclusive": true
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