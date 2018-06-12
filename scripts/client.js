// var post = process.env.PORT || 7777;
var socket = io();

function getNickName() {
  var urlString = window.location.href;
  var url = new URL(urlString);
  return url.searchParams.get("nickname");
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
  var nicknameElement = nicknameValue === nickname ? '' : `<p class='nick-label'>${nickname}</p>`;
  if (nickname) {
    $('#thread').append(`<div class=${className}>${nicknameElement}<span class='message-inner'><p class='message'>${message}</p></span></div>`);
  }
  scrollToBottom();
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
  var message = $('#message-box').val();
  if (!message) {
    $('.submit-btn-wrapper').fadeTo(0, 0.5);
  } else {
    $('.submit-btn-wrapper').fadeTo(0, 1);
  }
  socket.emit('stopTyping', nickname);
}, 500));

$('.submit-btn').click(function() {
  $('.submit-btn-wrapper').fadeTo(0, 0.5);
})

function scrollToBottom() {
  var threadContainer = $('#thread-container');
  var thread = $('#thread');
  var headerInfoHeight = $('.header-info').innerHeight();
  var newMessage = thread.children('div:last-child');
  var clientHeight = threadContainer.prop('clientHeight');
  var scrollHeight = thread.prop('scrollHeight');
  var translateTop = clientHeight - scrollHeight;

  if (scrollHeight >= (clientHeight - headerInfoHeight)) {
    thread.scrollTop(scrollHeight);
    translateTop = headerInfoHeight;
  }
  thread.css({"transform": `translate3d(0px, ${translateTop}px, 0px)`});
}
