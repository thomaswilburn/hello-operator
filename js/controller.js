
import { Synth } from "./synth.js";
import { MIDITarget } from "./midi.js";

var dx7 = new Synth();

var keys = "awsedftgyhujkolp;".split("");
var keyMap = {};
keys.forEach((k, i) => keyMap[k] = i + 72);

import createBinding from "./kudzu.js";

var main = document.querySelector("main");

var base = dx7.settings[0];
var binding = window.binding = createBinding(main, {
  ...base,
  enabled: {
    1: true,
    2: true,
    3: false,
    4: true,
    5: true,
    6: true
  },
  editing: 1,
  selectOp(e) {
    var editing = this.value * 1;
    binding.set({ editing });
    binding.updateOp();
  },
  updateOp() {
    var settings = dx7.settings[binding.editing - 1];
    var { coarse, fine, depth, fixed } = settings;
    var merged = { coarse, fine, depth, fixed };
    binding.set(merged);
  },
  toggleOp(e) {
    var operator = this.value * 1;
    var index = operator - 1;
    binding.set(`enabled.${operator}`, dx7.toggleOperator(index));
  },
  tweak(e) {
    var prop = this.getAttribute(":scaledvalue");
    var value = this.value * 1;
    console.log(prop, value);
    var operator = dx7.settings[binding.editing - 1];
    operator[prop] = value;
  }
});

// handle MIDI keys and assignments
var midi = new MIDITarget();

midi.on("noteon", function(e) {
  var { key, pressure } = e.data;
  var f = dx7.midiToFrequency(key);
  dx7.noteOn(f, pressure);
});

midi.on("noteoff", function(e) {
  var f = dx7.midiToFrequency(e.data.key);
  dx7.noteOff(f);
});

// volume is 24
// rotary encoders are 16-23
// buttons are 102, values 0-7
// modulation is 1
// pitch is pitchbend event

var controlMap = {
  16: "coarse",
  17: "fine",
  18: "fixed",
  19: "depth"
};

midi.on("controlchange", function(e) {
  var { controller, value } = e.data;
  if (controller in controlMap) {
    var target = controlMap[controller];
    binding.set(target, value / 127);
    return;
  }
  // handle switching between operators
  if (controller == 102) {
    binding.set({ editing: value + 1 });
    binding.updateOp();
  }
});

// keyboard fallback
document.documentElement.addEventListener("keydown", function(e) {
  if (e.key == "]") {
    dx7.algorithm = (dx7.algorithm + 1) % 33
    if (dx7.algorithm == 0) dx7.algorithm++;
    console.log(dx7.algorithm);
    return;
  }
  if (e.key == "[") {
    dx7.algorithm -= 1;
    if (dx7.algorithm < 1) dx7.algorithm = 32;
    console.log(dx7.algorithm);
    return;
  }
  if ("123456".includes(e.key)) {
    return dx7.toggleOperator(e.key - 1);
  }
  var note = keyMap[e.key];
  if (!note) return;
  var f = dx7.midiToFrequency(note);
  dx7.noteOn(f, 127);
});

document.documentElement.addEventListener("keyup", function(e) {
  var note = keyMap[e.key];
  if (!note) return;
  var f = dx7.midiToFrequency(note);
  dx7.noteOff(f);
});