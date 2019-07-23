var amqp = require('amqplib');

var config = require('./config.json');

var send = {
    conn: null,
    ch  : null
};

var get = {
    conn: null,
    ch  : null
};

function checkConfigParams(config) {
    if (!config) {
        console.log("Please create config.json file and configure parameters in this file (see README file)");
        return false;
    }

    // uriGet, uriSend and exchangeMap are required parameters and has no default settings

    if (!config.uriGet) {
        console.log("Please set uriGet parameter in config.json to your 'master' RabbitMQ connect URI");
        return false;
    }
    if (!config.uriSend) {
        console.log("Please set uriSend parameter in config.json to your 'slave' RabbitMQ connect URI");
        return false;
    }
    if (!config.exchangeMap) {
        console.log("Please define exchangeMap in config.json");
        return false;
    }

    // queuePrefix and queueOptions are optional and has default settings

    if (!config.queuePrefix) {
        config.queuePrefix = '';
    }

    if (typeof config.queueOptions === 'string') {
        if (config[config.queueOptions]) {
            config.queueOptions = config[config.queueOptions];
        } else {
            console.log("queueOptions parameter is set to '"+ config.queueOptions +"' profile which is not defined in config.json. Falling back to default queueOptions settings.");
            config.queueOptions = null;
        }
    }
    if (!config.queueOptions) {
        config.queueOptions = { // default options
            exclusive: true
        }
    }

    return true;
}

function main(config) {
    console.log('RabbitMQ Resender v0.1.0 (https://github.com/structinfo/rabbit-resender)');

    if (!checkConfigParams(config)) return;

    console.log('Connecting to target RabbitMQ', config.uriSend);
    amqp.connect(config.uriSend).then(function(conn){
        send.conn = conn;
        console.log('Creating target channel');
        return conn.createChannel();
    }).then(function(ch){
        send.ch = ch;
        console.log('Connecting to source RabbitMQ', config.uriGet);
        return amqp.connect(config.uriGet);
    }).then(function(conn) {
        get.conn = conn;
        console.log('Creating source channel');
        return conn.createChannel();
    }).then(function(ch){
        get.ch = ch;
        console.log('Set prefetch 1 on source channel');
        return ch.prefetch(1);
    }).then(function(){
        console.log('Asserting and binding all queues');
        var p = Promise.resolve();
        config.exchangeMap.forEach(function(map) {
            var exchangeGet = map[0];
            var exchangeSend = map[1];
            var queueName = config.queuePrefix + exchangeGet;
            p = p.then(function(){
                //TODO: change assertExchange to checkExchange and handle channel closing
                console.log('Asserting target exchange', exchangeSend);
                return send.ch.assertExchange(exchangeSend, 'topic');
            }).then(function(){
                console.log('Checking source exchange', exchangeGet);
                return get.ch.checkExchange(exchangeGet);
                //return get.ch.assertExchange(exchangeGet);
            }).then(function(){
                console.log('Asserting source queue', queueName);
                return get.ch.assertQueue(queueName, config.queueOptions);
            }).then(function(){
                console.log('Binding source queue', queueName, 'to source exchange', exchangeGet);
                return get.ch.bindQueue(queueName, exchangeGet, '#');
            }).then(function(){
                console.log('Installing message consumer to source queue', queueName);
                return get.ch.consume(queueName, function(message) {
                    //TODO: add param in config to log or not log messages consumed
                    console.log('Consuming message from queue', queueName, message);
                    //TODO: maybe match message.fields.exchange to exchangeMap and send to desired exchange
                    // It will allow use of single queue for all exchanges.
                    // In this case all exchanges should be asserted before installing message consumer.
                    // Also possibly check message.fields.routingKey and change routing accordingly
                    console.log('Publising message to exchange', exchangeSend, 'routing key', message.fields.routingKey);
                    var isSent = send.ch.publish(exchangeSend, message.fields.routingKey, message.content); // new Buffer(message.content)
                    //TODO: maybe support 'drain' event. See docs:
                    // #publish mimics the stream.Writable interface in its return value;
                    // it will return false if the channel’s write buffer is ‘full’, and true otherwise.
                    // If it returns false, it will emit a 'drain' event at some later time.
                    if (isSent) {
                        console.log('Acking message from queue', queueName);
                        return get.ch.ack(message);
                    } else {
                        console.log('Message not sent. Maybe channel\'s buffer id full. Try later.');
                    }
                    //console.log('Error consuming message from queue', queueName, err);
                })
            }).catch(function(err){
                console.log('Error mapping exchanges', err);
            })
        });
        return p;
    }).then(function(){
        console.log('Successfully inited');
    }).catch(function(err){
        console.log('Error initing', err);
    })
}

// process.once('SIGINT', ()=>connection1.close())

main(config);
