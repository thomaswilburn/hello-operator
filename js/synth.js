import { Operator } from "./operator.js";

var acConfig = {
  channels: 1
};

export class Voice {
  constructor(context, operators, algorithm) {
    this.operators = operators.map(o => new Operator(context, o));
  }

  assemble(output, algorithm) {
    // here's where we should assemble them according to the schema
    // for now we're just connecting stuff to output
    var [ op1, op2, op3 ] = this.operators;
    op1.output.connect(output);
    op2.output.connect(op1.modulation);
    op3.output.connect(output);
  }

  start(frequency, velocity) {
    this.operators.forEach(o => o.start(frequency, velocity));
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
      { frequencyRatio: .5, envelope: { attack: .1, decay: .3, sustain: .1, release: 0 } },
      { fixed: 3000, envelope: { attack: 0, decay: 0, sustain: 1, release: 0 } },
      { frequencyRatio: 1 }
    ];

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
    voice.assemble(this.amp);
    this.voices.set(frequency, voice);
    voice.start(frequency, velocity);
  }

  noteOff(frequency) {
    var voice = this.voices.get(frequency);
    if (!voice) return;
    voice.stop();
    this.voices.delete(frequency);
  }


}