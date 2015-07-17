pw.instruct = {
  process: function (collection, packet, socket) {
    if (collection.length() === 1 && collection.views[0].node.getAttribute('data-version') === 'empty') {
      pw.instruct.fetchView(packet, socket, collection.views[0].node);
    } else {
      pw.instruct.perform(collection, packet.payload);
    }
  },

  fetchView: function (packet, socket, node) {
    socket.fetchView({ channel: packet.channel }, function (view) {
      var parent = node.parentNode;
      parent.replaceChild(view.node, node);

      var selector = '*[data-channel="' + packet.channel + '"]';
      var nodes = pw.node.toA(parent.querySelectorAll(selector));
      pw.instruct.perform(pw.collection.fromNodes(nodes, selector), packet.payload);
    });
  },

  template: function (view, cb) {
    var lookup = {};
    var node = view.first().node;

    if (node.hasAttribute('data-channel')) {
      lookup.channel = view.first().node.getAttribute('data-channel');
    } else {
      lookup.component = pw.node.component(node).getAttribute('data-ui');
      lookup.scope = node.getAttribute('data-scope');
    }

    window.socket.fetchView(lookup, function (view) {
      cb(view);
    });
  },

  perform: function (collection, instructions) {
    var self = this;

    (instructions || []).forEach(function (instruction, i) {
      var method = instruction[0];
      var value = instruction[1];
      var nested = instruction[2];

      if (collection[method]) {
        if (method == 'with' || method == 'for' || method == 'bind' || method == 'repeat' || method == 'apply') {
          collection.endpoint(self)[method].call(collection, value, function (datum) {
            pw.instruct.perform(this, nested[value.indexOf(datum)]);
          });
          return;
        } else if (method == 'attrs') {
          self.performAttr(collection.attrs(), nested);
          return;
        } else {
          var mutatedViews = collection[method].call(collection, value);
        }
      } else {
        console.log('could not find method named: ' + method);
        return;
      }

      if (nested instanceof Array) {
        pw.instruct.perform(mutatedViews, nested);
      } else if (mutatedViews) {
        collection = mutatedViews;
      }
    });
  },

  performAttr: function (context, attrInstructions) {
    attrInstructions.forEach(function (attrInstruct) {
      var attr = attrInstruct[0];
      var value = attrInstruct[1];
      var nested = attrInstruct[2];

      if (value) {
        context.set(attr, value);
      } else {
        context[nested[0][0]](attr, nested[0][1]);
      }
    });
  }
};
