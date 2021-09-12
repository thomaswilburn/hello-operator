import { Operator } from "./operator.js";
import { algorithms } from "./algorithms.js";

var acConfig = {
  channels: 1
};

var sustain = 0;
var release = .1;

const EPIANO = [
  { sustain, release, decay: 10 },
  { level: .3 },
  { enabled: false },
  { sustain, release, decay: 1.5 },
  { },
  { coarse: 3 }
];

export class Voice {
  constructor(context, settings) {
    this.operators = settings.map(o => new Operator(context, o));
  }

  assemble(output, a, verbose) {
    // here's where we should assemble them according to the schema
    // for now we're just connecting stuff to output
    var algorithm = algorithms[a];
    // connect carriers to output
    for (var c of algorithm.carriers) {
      var op = this.operators[c.from - 1];
      if (op) {
        op.output.connect(output);
        if (verbose) console.log(`Connecting carrier: ${c.from}`)
      }
    }
    for (var m of algorithm.modulators) {
      var a = this.operators[m.from - 1];
      var b = this.operators[m.to - 1];
      if (a && b && a.options.enabled) {
        a.output.connect(b.modulation.gain);
        if (verbose) console.log(`Connecting modulator: ${m.from} -> ${m.to}`)
      }
    }
    if (algorithm.feedback) {
      var f = algorithm.feedback;
      var a = this.operators[f.from - 1];
      var b = this.operators[f.to - 1];
      if (a && b && a.options.enabled) {
        a.output.connect(b.feedback);
        if (verbose) console.log(`Connecting feedback: ${f.from} -> ${f.to}`)
      }
    }
  }

  disassemble() {
    for (var op of this.operators) {
      op.output.disconnect();
    }
  }

  start(time, frequency, velocity) {
    this.operators.forEach(o => o.start(time, frequency, velocity));
  }

  stop() {
    for (var op of this.operators) {
      op.stop();
    }
  }
}

export class Synth {
  constructor() {
    this.voices = new Map();

    var context = this.context = new AudioContext();

    this.settings = JSON.parse(JSON.stringify(EPIANO));

    // build some output processing
    this.amp = new GainNode(context, acConfig);
    this.amp.connect(context.destination);
    this.compressor = new DynamicsCompressorNode(context, acConfig);
    this.compressor.connect(this.amp);

    this.setAlgorithm(10);
  }

  setAlgorithm(id) {
    this.algorithm = id;
    // preview the algorithm
    var v = new Voice(this.context, this.settings);
    v.assemble(this.compressor, id, true);
    v.disassemble();
  }

  midiToFrequency(midi) {
    var semitones = midi - 69;
    var f = Math.pow(2, semitones/12) * 440;
    return f;
  }

  noteOn(frequency, velocity) {
    this.context.resume();
    var voice = this.voices.get(frequency);
    if (voice) return;
    voice = new Voice(this.context, this.settings);
    voice.assemble(this.compressor, this.algorithm);
    this.voices.set(frequency, voice);
    voice.start(this.context.currentTime, frequency, velocity);
  }

  noteOff(frequency) {
    var voice = this.voices.get(frequency);
    if (!voice) return;
    voice.stop();
    this.voices.delete(frequency);
  }

  toggleOperator(index, value) {
    var operator = this.settings[index];
    if (!operator) return;
    if (typeof value != "undefined") {
      operator.enabled = value;
    } else {
      operator.enabled = "enabled" in operator ? !operator.enabled : false;
    }
    console.log(`Toggled operator #${index + 1}: ${operator.enabled ? "on" : "off"}`);
  }

}