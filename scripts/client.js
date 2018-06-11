var socket = io.connect('http://localhost:7777');

function getNickName() {
  var urlString = window.location.href;
  var url = new URL(urlString);
  return url.searchParams.get("nickname");
}

window.onbeforeunload = function(){
  socket.emit('logout', getNickName());
}

socket.on('connect', function(data) {
  var nickname = getNickName();
  socket.emit('join', nickname);
  socket.emit('getOnlineUsers');
});

socket.on('setOnlineUsers', function(onlineNicks) {
  if (onlineNicks.length) {
    onlineNicks.forEach(function(nickname) {
      $('.list-online').append(`<li class="user-online">${nickname}</li>`);
    });
  }
});

socket.on('thread', function({ message, nickname }) {
  var nicknameValue = getNickName();
  var className = nicknameValue === nickname ? 'own-messages' : 'other-message';
  var nicknameValue = nicknameValue === nickname ? '' : `${nickname}`;
  if (nickname) {
    $('#thread').append(`<li class=${className}><p class='nick-label'>${nicknameValue}</p><span class='message-wrapper'><p class='message'>${message}</p></span></li>`);
  }
});

socket.on('userIsTyping', function(nicknames) {
  var typingEle = $('.typing');
  var currrentUser = getNickName();
  var userTyping = _.remove(nicknames, function(nickname) {
    return nickname !== currrentUser;
  });
  var numUserTyping = userTyping.length;
  if (numUserTyping) {
    var messageTyping = `${userTyping[0]} is typing...`;
    if (numUserTyping > 1) {
      var userIsTyping = '';
      _.forEach(userTyping, function(nickname) {
        userIsTyping = userIsTyping + ', ' + nickname;
      })
      messageTyping = `${userIsTyping} is typing...`;
    }
    typingEle.html(messageTyping).addClass('show');
  } else {
    typingEle.removeClass('show');
  }
});

$('#messages-form').submit(function() {
  var message = $('#message-box').val();
  var nickname = getNickName();
  if (message) {
    socket.emit('messages', { message, nickname });
    this.reset();
  }
  return false;
});

$('#message-box').keydown(function() {
  var nickname = getNickName();
  socket.emit('typing', nickname);
});

$('#message-box').keyup(_.debounce(function() {
  var nickname = getNickName();
  socket.emit('stopTyping', nickname);
}, 500));


