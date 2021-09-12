// utility for deep object references
var getPath = function(path, target) {
  var parts = path.split(".");
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    if (!(part in target)) return undefined;
    target = target[part];
  }
  return target;
};

var setPath = function(path, target, value) {
  var parts = path.split(".");
  var final = parts.pop();
  parts.forEach(p => target = p in target ? target[p] : target[p] = {});
  target[final] = value;
};

// utility for iterating over DOM collections
var each = function(list, fn) {
  for (var i = 0; i < list.length; i++) fn(list[i]);
};

// attribute prefixes
var prefix = {
  attr: /^(attr)?:/,
  className: /^class:/,
  event: /^(on:|@)/
};

// used to bind attributes to camelcase props
// start with some SVG attributes in place
var upcase = {
  preserveaspectratio: "preserveAspectRatio",
  viewbox: "viewBox",
  textcontent: "textContent"
};

[Element.prototype, HTMLInputElement.prototype, Image.prototype].forEach(function(proto) {
  var description = Object.getOwnPropertyDescriptors(proto);
  for (var k in description) {
    var d = description[k];
    var type = typeof d.value;
    if (d.set || (d.writable && type != "function")) {
      var low = k.toLowerCase();
      if (low != k) upcase[low] = k;
    }
  }
});

// constructors for rendering callbacks
var factories = {
  attr: function(element, attribute) {
    attribute = upcase[attribute] || attribute;
    if (attribute in element) {
      return v => element[attribute] = v;
    } else {
      return v => element.setAttribute(attribute, v);
    }
  },
  classToggle: function(element, className) {
    return v => element.classList[v ? "add" : "remove"](className);
  }
}

var createBinding = function(root, state) {
  // callbacks are stored under a key specifying the state value lookup path
  // each is a function expecting a single value, with their context memoized
  var callbacks = {};
  
  // store these so we can destroy them if asked
  var listeners = [];

  // memoize callbacks so that they don't do unnecessary work
  // this assumes that all data flows one way - toward the DOM
  var memoize = function(fn) {
    var memo;
    return function(v) {
      if (v == memo) return;
      memo = v;
      fn(v);
    }
  };

  var addCallback = function(k, v) {
    if (!callbacks[k]) callbacks[k] = [];
    callbacks[k].push(memoize(v));
  }

  var bind = function(element) {
    each(element.attributes, function(attr) {
      if (attr.name.match(prefix.attr)) {
        var k = attr.name.replace(prefix.attr, "");
        var v = attr.value;
        addCallback(v, factories.attr(element, k));
      }

      if (attr.name.match(prefix.className)) {
        var k = attr.name.replace(prefix.className, "");
        var v = attr.value;
        addCallback(v, factories.classToggle(element, k));
      }

      if (attr.name.match(prefix.event)) {
        var e = attr.name.replace(prefix.event, "");
        var v = attr.value;
        // wrapper in case the state object changes or is updated
        var listener = function(event) {
          if (!state[v]) return;
          var f = state[v];
          f.call(element, event);
        }
        element.addEventListener(e, listener);
        listeners.push({ element, listener, event: e });
      }
    });
  };

  // gather all nodes and in the darkness bind them
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, function(node) {
    if (node.hasAttribute("blackbox")) return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT;
  }, false);
  do {
    bind(walker.currentNode);
  } while (walker.nextNode());

  // render is always delayed until the next tick
  var scheduled = null;
  var render = function() {
    if (scheduled) return;
    scheduled = requestAnimationFrame(function() {
      scheduled = null;
      for (var k in callbacks) {
        var v = getPath(k, state);
        callbacks[k].forEach(fn => fn(v));
      }
    });
  };

  // call state.set() with a key/value pair or an object
  // deep keypaths are supported as keys in order to do narrow replacement
  Object.defineProperty(state, "set", {
    value: function(key, value) {
      if (typeof key == "object") {
        return Object.keys(key).forEach(k => state.set(k, key[k]));
      }
      setPath(key, state, value);
      render();
    },
    configurable: true
  });
  
  Object.defineProperty(state, "destroy", {
    value: function() {
      callbacks = null;
      listeners.forEach(def => def.element.removeEventListener(def.event, def.listener));
      if (scheduled) cancelAnimationFrame(scheduled);
    },
    configurable: true
  });

  render();

  return state;
};

export default createBinding;
