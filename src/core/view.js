/*
  View related functions.
*/

pw.view = {};

// creates and returns a new pw_View for the document or node
pw.view.init = function (node) {
  return new pw_View(node);
}

/*
  pw_View contains a document with state. It watches for
  interactions with the document that trigger mutations
  in state. It can also apply state to the view.
*/

var pw_View = function (node) {
  this.node = node;
}

pw_View.prototype.applyState = function (stateArr, nodes) {
  if(!nodes) {
    nodes = pw.node.significant(this.node);
  }

  _.each(stateArr, function (state, i) {
    var node = nodes[i];
    pw.node.bind(state[0], node[0].node);
    this.applyState(state[1], node[1])
  }, this);
};

pw_View.prototype.clone = function () {
  return pw.view.init(pw.node.clone(this.node));
}

// pakyow api

pw_View.prototype.remove = function () {
  pw.node.remove(this.node);
};

pw_View.prototype.clear = function () {
  pw.node.clear(this.node);
};

pw_View.prototype.title = function (value) {
  pw.node.title(this.node, value);
};

pw_View.prototype.text = function (value) {
  pw.node.text(node, value);
};

pw_View.prototype.html = function (value) {
  pw.node.html(node, value);
};

pw_View.prototype.after = function (view) {
  pw.node.after(this.node, view.node);
}

pw_View.prototype.before = function (view) {
  pw.node.before(this.node, view.node);
}

pw_View.prototype.replace = function (view) {
  pw.node.replace(this.node, view.node);
}

pw_View.prototype.append = function (view_or_data) {
  if (typeof view_or_data === Node) {
    pw.node.append(this.node, view_or_data.node);
    return view_or_data;
  } else {
    console.log('append as an operation');
  }
}

pw_View.prototype.prepend = function (view_or_data) {
  if (view_or_data instanceof pw_View) {
    pw.node.prepend(this.node, view_or_data.node);
    return view_or_data;
  } else {
    //TODO really want to be able to fetch the view here, but
    // we don't have a channel to fetch by; perhaps fetch by
    // the component name + scope? I dunno.
    //
    // consider fetching by channel, OR by component + scope
    // (could just look up the path for this info)
    var prependable = pw.view.init(pw.node.clone(this.node));
    prependable.bind(view_or_data);
    this.before(prependable);
    return prependable;
  }
}

pw_View.prototype.attrs = function () {
  return pw.attrs.init(this);
};

pw_View.prototype.scope = function (name) {
  return _.map(pw.node.byAttr(this.node, 'data-scope', name), function (node) {
    return pw.view.init(node);
  });
};

pw_View.prototype.prop = function (name) {
  return _.map(pw.node.byAttr(this.node, 'data-prop', name), function (node) {
    return pw.view.init(node);
  });
};

pw_View.prototype.component = function (name) {
  return _.map(pw.node.byAttr(this.node, 'data-ui', name), function (node) {
    return pw.view.init(node);
  });
};

pw_View.prototype.with = function (cb) {
  pw.node.with(this.node, cb);
};

pw_View.prototype.match = function (data) {
  pw.node.match(this.node, data);
};

pw_View.prototype.for = function (data, cb) {
  pw.node.for(this.node, data, cb);
};

pw_View.prototype.repeat = function (data, cb) {
  pw.node.repeat(this.node, data, cb);
};

pw_View.prototype.bind = function (data, cb) {
  pw.node.bind(data, this.node, cb);
};

pw_View.prototype.apply = function (data, cb) {
  pw.node.apply(data, this.node, cb);
};