var express = require('express');
var redirect = require('express-redirect');
var app = express();
redirect(app);
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser');
var _ = require('lodash');
var port = process.env.PORT || 7777;

app.use('/assets', express.static('assets'));
app.use('/scripts', express.static('scripts'));
app.use(express.static('views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, ''));
app.set('view engine', 'pug');

app.get('/chatroom', function (req, res, next) {
  res.render('views/chat-room')
});

app.post('/login', function (req, res, next) {
  var post = req.body;
  if (!isExist(onlineNicks, post.nickname)) {
    res.redirect('/chatroom?nickname=' + post.nickname);
  } else {
    res.render('views/login', { err: 'Nickname is already registry.' })
  }
});

app.get('/', function(req, res, next) {
  res.render('views/login')
});

var messagesStore = [];
var onlineNicks = [];
var userTyping = [];

io.on('connection', function(client) {
  console.log('Client connected...');

  client.on('join', function(nickname) {
    addOnlineNick(nickname, function(nickname) {
      client.broadcast.emit('setOnlineUsers', [nickname]);
    });

    for(let i = 0; i< messagesStore.length; i++) {
      client.emit('thread', messagesStore[i]);
    }
  });

  client.on('getOnlineUsers', function() {
    client.emit('setOnlineUsers', onlineNicks);
  });

  client.on('messages', function(data) {
    messagesStore.push(data);
    client.emit('thread', data);
    client.broadcast.emit('thread', data);
  });

  client.on('typing', function(nickname) {
    if (nickname) {
      if (!isExist(userTyping, nickname)) {
        userTyping.push(nickname);
      }
      client.broadcast.emit('userIsTyping', userTyping);
    }
  });

  client.on('stopTyping', function(nickname) {
    var index = _.indexOf(userTyping, nickname);
    if (index >= 0) {
      userTyping = removeEleInArray(userTyping, nickname, index) || [];
      client.broadcast.emit('userIsTyping', userTyping);
    }
  });
});

server.listen(port);

function addOnlineNick(nickname, callback) {
  if (!isExist(onlineNicks, nickname)) {
    onlineNicks.push(nickname);

    if (typeof callback === 'function') {
      callback(nickname);
    }
  }
}

function isExist(array, ele) {
  return _.indexOf(array, ele) >= 0;
}

function removeEleInArray(array, ele, index) {
  _.remove(array, function(n, i) {
    return i === index;
  });
  return array;
}
