// a good practice to have more robust structure
'use strict';

var http = require('http');
var server = http.createServer().listen(4000);
var io = require('socket.io').listen(server);
var cookie_reader = require('cookie');
var querystring = require('querystring');

var redis = require('redis');
var sub = redis.createClient();


// subscribing to a new channel chat in reddis
sub.subscribe('chat');

// setting authorization function have two parameters, first for data
// and second for the result of authorization that is accepted or rejected.
io.set('authorization', function(data, accept){
    // using cookie of django to authorize the user
    if(data.headers.cookie){
        data.cookie = cookie_reader.parse(data.headers.cookie);
        return accept(null, true);
    }
    return accept('error', false);
});

io.on('connection', function(socket){
    console.log('A user connected');
    console.log(socket.request.cookie);
    //Grab message from Redis and send to client
    sub.on('message', function(channel, message){
        socket.send(message);
    });

    //Client is sending message through socket.io
      socket.on('send_message', function (message) {

        values = querystring.stringify({
            comment: message,
            sessionid: socket.request.cookie['sessionid'],
        });

        var options = {
            host: 'localhost',
            port: 8000,
            path: '/node_api',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': values.length
            }
        };

        //Send message to Django server
        var request = http.request(options, function(response){
            response.setEncoding('utf8');

            //Print out error message, django gives the message a response
            // if everything is correct it should be 'Everything worked:'
            response.on('data', function(message){
                if(message != 'Everything worked :)'){
                    console.log('Message: ' + message);
                }
            });
        });

        request.write(values);
        request.end();

        //Whenever someone disconnects this piece of code executed
        socket.on('disconnect', function () {
          console.log('A user disconnected');
        });

    });
});


// diff code

sub.on("error", function (err) {
    console.log("Error " + err);
});
