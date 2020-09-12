var Tick = require('./@pqina/flip');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
users = [];
connections = [];
choices = [];
results = [];
maxRounds = 3;
currentRound = 0;
score1 = 0;
score2 = 0;

server.listen(process.env.PORT || 3000);
console.log('Sever running...');
console.log(Tick);

app.get('/', function (rer, res) {
    res.sendFile(__dirname + '/views/index.html')
});
app.get('/chat', function (rer, res) {
    res.sendFile(__dirname + '/views/chat-now.html')
});

io.sockets.on('connection', function (socket) {
    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length);

    socket.on('disconnect', function (data) {
        users.splice(users.indexOf(socket.username), 1);
        updateUsernames();
        connections.splice(connections.indexOf(socket), 1)
        io.emit('disconnected', socket.username);
        console.log('Disconnected: %s sockets connected', connections.length);
    });

    socket.on('send message', function (data) {
        io.sockets.emit('new message', {
            msg: data,
            user: socket.username
        });
    });

    socket.on('add user', function (data, callback) {
        socket.username = data;

        if (users.indexOf(socket.username) > -1) {
            callback(false);
        } else {
            users.push(socket.username);
            updateUsernames();
            callback(true);

            if (Object.keys(users).length == 2) {
                io.emit('connected', socket.username);
                io.emit('game start');
            }
        }
    });

    socket.on('player choice', function (username, choice) {
        choices.push({
            'user': username,
            'choice': choice
        });
        console.log('%s chose %s.', username, choice);

        if (choices.length == 2) {
            console.log('[socket.io] Both players have made choices.');

            switch (choices[0]['choice']) {
                case 'rock':
                    switch (choices[1]['choice']) {
                        case 'rock':
                            io.emit('tie', choices);
                            results.push({
                                'round': currentRound,
                                'winner': 0,
                                'choices': choices
                            })
                            break;

                        case 'paper':
                            io.emit('player 2 win', choices);
                            results.push({
                                'round': currentRound,
                                'winner': 2,
                                'choices': choices
                            })
                            break;

                        case 'scissors':
                            io.emit('player 1 win', choices);
                            results.push({
                                'round': currentRound,
                                'winner': 1,
                                'choices': choices
                            })
                            break;

                        default:
                            break;
                    }
                    break;

                case 'paper':
                    switch (choices[1]['choice']) {
                        case 'rock':
                            io.emit('player 1 win', choices);
                            results.push({
                                'round': currentRound,
                                'winner': 1,
                                'choices': choices
                            })
                            break;

                        case 'paper':
                            io.emit('tie', choices);
                            results.push({
                                'round': currentRound,
                                'winner': 0,
                                'choices': choices
                            })
                            break;

                        case 'scissors':
                            io.emit('player 2 win', choices);
                            results.push({
                                'round': currentRound,
                                'winner': 2,
                                'choices': choices
                            })
                            break;

                        default:
                            break;
                    }
                    break;

                case 'scissors':
                    switch (choices[1]['choice']) {
                        case 'rock':
                            io.emit('player 2 win', choices);
                            results.push({
                                'round': currentRound,
                                'winner': 2,
                                'choices': choices
                            })
                            break;

                        case 'paper':
                            io.emit('player 1 win', choices);
                            results.push({
                                'round': currentRound,
                                'winner': 1,
                                'choices': choices
                            })
                            break;

                        case 'scissors':
                            io.emit('tie', choices);

                            results.push({
                                'round': currentRound,
                                'winner': 0,
                                'choices': choices
                            })
                            break;

                        default:
                            break;
                    }
                    break;

                default:
                    break;
            }
            io.emit('end round', results);
            currentRound++;
            choices = [];
        }
    });

    function updateUsernames() {
        io.sockets.emit('get user', users);
    }
});