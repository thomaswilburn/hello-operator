
import { Synth, EPIANO } from "./synth.js";
import { MIDITarget } from "./midi.js";

var $ = (s, d = document) => [...d.querySelectorAll(s)];
$.one = (s, d = document) => d.querySelector(s);

var keys = "awsedftgyhujkolp;".split("");
var keyMap = {};
keys.forEach((k, i) => keyMap[k] = i + 72 - 12);

var controlMap = {
  16: "coarse",
  17: "fine",
  18: "fixed",
  19: "level"
};

var enabledChecks = $(".op-enabled input");
var paramEncoders = $("rotary-encoder[data-param]");
var editingSelect = $.one("#op-selected");

var params = {
  coarse: { min: .5, max: 4, step: .1 },
  fine: { min: -.5, max: .5, step: .05 },
  fixed: { min: 0, max: 2000, step: 50 },
  level: { min: 0, max: 1, step: .1 }
};

var bound = `
  onNoteOn onNoteOff onKeyDown onKeyUp onControlChange
  onEditSelect syncEnabledFromUI syncParamsFromUI
`.trim().split(/\s+/g);

export class Controller {
  constructor() {
    // binding
    for (var b of bound) {
      this[b] = this[b].bind(this);
    }

    this.dx7 = new Synth();

    this.midi = new MIDITarget();
    this.midi.on("noteon", this.onNoteOn);
    this.midi.on("noteoff", this.onNoteOff);
    this.midi.on("controlchange", this.onControlChange);
    document.documentElement.addEventListener("keydown", this.onKeyDown);
    document.documentElement.addEventListener("keyup", this.onKeyUp);

    $.one(".op-enabled").addEventListener("change", this.syncEnabledFromUI);
    editingSelect.addEventListener("change", this.onEditSelect);

    this.syncEnabledFromSynth();

    this.editing = 0;
    
    this.params = {};
    for (var p in params) {
      var config = params[p];
      var encoder = $.one(`rotary-encoder[data-param="${p}"]`);
      for (var c in config) {
        encoder[c] = config[c];
      }
      this.params[p] = {
        ...config,
        encoder
      }
    }
    this.syncParamsFromSynth();
  }

  getEditing() {
    return this.dx7.settings[this.editing];
  }

  syncEnabledFromSynth() {
    for (var c of enabledChecks) {
      c.checked = this.dx7.settings[c.value].enabled;
    }
  }

  syncEnabledFromUI() {
    for (var c of enabledChecks) {
      this.dx7.settings[c.value].enabled = c.checked;
    }
  }

  syncParamsFromSynth() {
    var operator = this.getEditing();
    for (var p in this.params) {
      var { encoder } = this.params[p];
      encoder.value = operator[p];
    }
  }

  syncParamsFromUI() {

  }

  onNoteOn(e) {
    var { key, pressure } = e.data;
    var f = this.dx7.midiToFrequency(key);
    this.dx7.noteOn(f, pressure / 127);
  }

  onNoteOff(e) {
    var f = this.dx7.midiToFrequency(e.data.key);
    this.dx7.noteOff(f);
  }

  onControlChange(e) {
    var { controller, value } = e.data;
    if (controller in controlMap) {
      var target = controlMap[controller];
      var ratio = value / 127;
      var param = this.params[target]
      if (!param) return;
      param.encoder.scaledValue = ratio;
      var editing = this.getEditing();
      editing[target] = param.encoder.value;
      return;
    }
    // handle switching between operators
    if (controller == 102) {
      // set current operator for editing
      var current = editingSelect.value * 1;
      if (current == value) {
        this.dx7.toggleOperator(current);
      } else {
        editingSelect.value = value;
        this.editing = value;
      }
      this.syncEnabledFromSynth();
      this.syncParamsFromSynth();
    }
  }

  onKeyDown(e) {
    if ("123456".includes(e.key)) {
     // set current operator for editing
      var current = editingSelect.value * 1;
      var value = e.key - 1;
      if (current == value) {
        this.dx7.toggleOperator(current);
      } else {
        editingSelect.value = value;
      }
      this.syncEnabledFromSynth();
      return;
    }
    var note = keyMap[e.key];
    if (!note) return;
    var f = this.dx7.midiToFrequency(note);
    this.dx7.noteOn(f, 1);
  }

  onKeyUp(e) {
    var note = keyMap[e.key];
    if (!note) return;
    var f = this.dx7.midiToFrequency(note);
    this.dx7.noteOff(f);
  }

  onEditSelect() {
    var value = editingSelect.value;
    this.editing = value;
    this.syncParamsFromSynth();
  }

}

export var controller = new Controller();

// volume is 24
// rotary encoders are 16-23
// buttons are 102, values 0-7
// modulation is 1
// pitch is pitchbend event
