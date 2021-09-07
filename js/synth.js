import { Operator } from "./operator.js";
import { algorithms } from "./algorithms.js";

var acConfig = {
  channels: 1
};

export class Voice {
  constructor(context, operators, algorithm) {
    this.operators = operators.map(o => new Operator(context, o));
  }

  assemble(output, a) {
    // here's where we should assemble them according to the schema
    // for now we're just connecting stuff to output
    var algorithm = algorithms[a];
    // connect carriers to output
    for (var c of algorithm.carriers) {
      var op = this.operators[c.from - 1];
      if (op) {
        op.output.connect(output);
        console.log(`Connecting carrier: ${c.from}`)
      }
    }
    for (var m of algorithm.modulators) {
      var a = this.operators[m.from - 1];
      var b = this.operators[m.to - 1];
      if (a && b) {
        a.output.connect(b.modulation.gain);
        console.log(`Connecting modulator: ${m.from} -> ${m.to}`)
      }
    }
    if (algorithm.feedback) {
      var f = algorithm.feedback;
      var a = this.operators[f.from - 1];
      var b = this.operators[f.to - 1];
      if (a && b) {
        a.output.connect(b.feedback);
        console.log(`Connecting feedback: ${f.from} -> ${f.to}`)
      }
    }
  }

  start(time, frequency, velocity) {
    this.operators.forEach(o => o.start(time, frequency, velocity));
  }

  stop() {
    this.operators.forEach(o => o.stop());
  }
}

export class Synth {
  constructor() {
    this.voices = new Map();

    var context = this.context = new AudioContext();

    this.operators = [
      { sustain: 0, decay: 5, detune: 5 },
      { level: .6, detune: 1 },
      { level: 1, detune: -1 },
      { sustain: 0, decay: 1.5, detune: -5, enabled: false },
      { sustain: 0, decay: 5, detune: 1},
      { frequencyRatio: 2 }
    ];

    this.algorithm = 10;

    this.amp = new GainNode(context, acConfig);
    this.amp.connect(context.destination);
  }

  midiToFrequency(midi) {
    var semitones = midi - 69;
    var f = Math.pow(2, semitones/12) * 440;
    return f;
  }

  noteOn(frequency, velocity) {
    console.log("synth", frequency);
    this.context.resume();
    var voice = this.voices.get(frequency);
    if (voice) return;
    voice = new Voice(this.context, this.operators);
    voice.assemble(this.amp, this.algorithm);
    this.voices.set(frequency, voice);
    voice.start(this.context.currentTime, frequency, velocity);
  }

  noteOff(frequency) {
    var voice = this.voices.get(frequency);
    if (!voice) return;
    voice.stop();
    this.voices.delete(frequency);
  }


}