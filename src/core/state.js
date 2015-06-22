/*
  State related functions.
*/

pw.state = {};

pw.state.build = function (sigArr, parentObj) {
  var retState = [];
  for (var i = 0; i < sigArr.length; i++) {
    var nodeState = pw.state.buildForNode(sigArr[i], parentObj);
    if (!nodeState) continue;
    retState.push(nodeState);
  }

  return retState;
}

pw.state.buildForNode = function (sigTuple, parentObj) {
  var sig = sigTuple[0];
  var obj = {};

  if (sig.type === 'scope') {
    obj.scope = sig.node.getAttribute('data-scope');
    obj.id = sig.node.getAttribute('data-id');
  } else if (sig.type === 'prop' && parentObj) {
    parentObj[sig.node.getAttribute('data-prop')] = pw.node.value(sig.node);
    return;
  }

  return [obj, pw.state.build(sigTuple[1], obj)];
}

// creates and returns a new pw_State for the document or node
pw.state.init = function (node) {
  return new pw_State(node);
}


/*
  pw_State represents the state for a document or node.
*/

var pw_State = function (node) {
  this.initial = pw.state.build(pw.node.significant(node));
  this.current = JSON.parse(JSON.stringify(this.initial));
  this.diffs = [];
}

// diff the node and capture any changes
pw_State.prototype.diff = function (node) {
  return _.map(_.flatten(pw.state.build(pw.node.significant(pw.node.scope(node)))), function (nodeState) {
    var last = this.node(nodeState);

    var diffObj = {
      node: node,
      guid: pw.util.guid(),
      scope: nodeState.scope,
      id: nodeState.id
    };

    for (var key in nodeState) {
      if(!last || nodeState[key] !== last[key]) {
        diffObj[key] = nodeState[key];
      }
    }

    this.diffs.push(diffObj);
    // this.update(diffObj);

    return diffObj;
  }, this);
}

// update the current state (or state if passed) with diff
pw_State.prototype.update = function (diff, state) {
  _.each(_.filter(_.flatten(state || this.current), function (s) {
    return s.scope === diff.scope && s.id === diff.id;
  }), function (s) {
    for (var key in diff) {
      if (key === 'guid') continue;
      if (s[key] !== diff[key]) {
        s[key] = diff[key];
      }
    }
  });
}

// reverts back to the initial state, capturing the revert as a diff
pw_State.prototype.revert = function () {
  var diff = this.initial[0][0];
  this.diffs.push(diff);
  this.update(diff);
}

// rollback a diff by guid
pw_State.prototype.rollback = function (guid) {
  _.each(this.diffs, function (diff, i) {
    if (diff.guid === guid) {
      // rebuild state by starting at initial and applying diffs before i
      var rbState = JSON.parse(JSON.stringify(this.initial));
      _.each(this.diffs, function (aDiff) {
        if (diff.guid === aDiff.guid) {
          return;
        }

        this.update(aDiff, rbState);
      }, this);

      // apply diffs after i to get new current
      _.each(_.rest(this.diffs, i + 1), function (aDiff) {
        this.update(aDiff, rbState);
      }, this);

      // remove diff
      this.diffs.splice(i, 1);

      // set current state
      this.current = rbState;

      return;
    }
  }, this);
}

// returns the current state for a node
pw_State.prototype.node = function (nodeState) {
  return _.filter(_.flatten(this.current), function (s) {
    return s.scope === nodeState.scope && s.id === nodeState.id;
  })[0];
}