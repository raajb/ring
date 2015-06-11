/*
  Socket init.
*/

pw.init.register(function () {
  pw.socket.init({
    cb: function (socket) {
      window.socket = socket;
    }
  });
});

/*
  Socket related functions.
*/

pw.socket = {};

pw.socket.init = function (options) {
  return pw.socket.connect(
    options.host,
    options.port,
    options.protocol,
    options.connId,
    options.cb
  );
};

pw.socket.connect = function (host, port, protocol, connId, cb) {
  if(typeof host === 'undefined') host = window.location.hostname;
  if(typeof port === 'undefined') port = window.location.port;
  if(typeof protocol === 'undefined') protocol = window.location.protocol;
  if(typeof connId === 'undefined') connId = document.getElementsByTagName('body')[0].getAttribute('data-socket-connection-id');

  var wsUrl = '';

  if (protocol === 'http:') {
    wsUrl += 'ws://';
  } else if (protocol === 'https:') {
    wsUrl += 'wss://';
  }

  wsUrl += host;

  if (port) {
    wsUrl += ':' + port;
  }

  wsUrl += '/?socket_connection_id=' + connId;

  return new pw_Socket(wsUrl, cb);
};

var pw_Socket = function (url, cb) {
  var self = this;

  this.callbacks = {};

  this.url = url;
  this.initCb = cb;

  this.ws = new WebSocket(url);

  this.id = url.split('socket_connection_id=')[1]

  this.ws.onmessage = function (evt) {
    var data = JSON.parse(evt.data);
    if (data.id) {
      var cb = self.callbacks[data.id];
      if (cb) {
        cb.call(this, data);
        return;
      }
    }

    self.message(data);
  };

  this.ws.onclose = function (evt) {
    console.log('socket closed');
    self.reconnect();
  };

  this.ws.onopen = function (evt) {
    console.log('socket open');

    if(self.initCb) {
      self.initCb(self);
    }
  }
};

pw_Socket.prototype.send = function (message, cb) {
  message.id = pw.util.guid();
  if (!message.input) {
    message.input = {};
  }
  message.input.socket_connection_id = this.id;
  this.callbacks[message.id] = cb;
  this.ws.send(JSON.stringify(message));
}

//TODO handle custom messages (e.g. not pakyow specific)
pw_Socket.prototype.message = function (packet) {
  console.log('received message');
  console.log(packet);

  var selector = '*[data-channel="' + packet.channel + '"]';

  if (packet.channel.split(':')[0] === 'component') {
    pw.component.push(packet);
    return;
  }

  var nodes = document.querySelectorAll(selector);

  if (nodes.length === 0) {
    //TODO decide how to handle this condition; there are times where this
    // is going to be the case and not an error; at one point we were simply
    // reloading the page, but that doesn't work in all cases
    return;
  }

  pw.instruct.process(pw.collection.fromNodes(nodes, selector), packet, this);
};

pw_Socket.prototype.reconnect = function () {
  var self = this;

  if (!self.socketWait) {
    self.socketWait = 100;
  } else {
    self.socketWait *= 1.25;
  }

  console.log('reconnecting socket in ' + self.socketWait + 'ms');

  setTimeout(function () {
    pw.socket.init({ cb: self.initCb });
  }, self.socketWait);
};

pw_Socket.prototype.fetchView = function (channel, cb) {
  var uri = window.location.pathname + window.location.search;

  this.send({
    action: 'fetch-view',
    channel: channel,
    uri: uri
  }, function (res) {
    var e = document.createElement("div");
    e.innerHTML = res.body;

    var view = pw.view.init(e.childNodes[0]);
    view.node.removeAttribute('data-id');

    cb(view);
  });
}
