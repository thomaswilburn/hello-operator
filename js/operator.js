/*

Because WebAudio is designed to through away the audio graph cheaply, we
basically treat operators as similarly disposable. Each is used for the
duration of a single note, as part of a "voice." That means they have to be
configurable quickly and easily.

*/

var base = {
  fixed: false,
  frequencyRatio: 1,
  velocityScale: 1,
  envelope: {
    attack: .1,
    decay: .2,
    sustain: 1,
    release: .1
  }
};

export class Operator {

  constructor(context, options = {}) {
    this.context = context;

    // merge in options
    this.options = { ...base, ...options };

    var config = { channels: 1 };

    this.output = new GainNode(context, config);

    this.envelope = new GainNode(context, config);
    this.envelope.connect(this.output);

    this.osc = new OscillatorNode(context, config);
    this.osc.connect(this.envelope);

    this.modulation = new GainNode(context, config);
    // this is key! you need a lot of gain to convert from signal to cents
    this.modulation.gain.value = 1200;
    this.modulation.connect(this.osc.detune);
  }

  start(frequency, velocity) {
    // either use fixed position or scale accordingly
    var f = this.options.fixed || (frequency * this.options.frequencyRatio);
    console.log("OP", f);
    this.osc.frequency.value = f;

    // schedule envelope: ADS
    var { attack, decay, sustain } = this.options.envelope;
    var t = this.context.currentTime;
    var a = t + attack;
    var d = a + decay;
    this.osc.start();
    if (attack) {
      this.envelope.gain.setValueAtTime(0, t);
      this.envelope.gain.linearRampToValueAtTime(1, a);
    } else {
      this.envelope.gain.setValueAtTime(1, t);
    }
    if (sustain < 1) this.envelope.gain.linearRampToValueAtTime(sustain, d);

    setTimeout(() => console.log(this.envelope.gain.value), (attack + decay) * 1000);
  }

  stop(frequency) {
    var { release } = this.options.envelope;
    var t = this.context.currentTime;
    this.envelope.gain.cancelScheduledValues(t);
    var r = t + release;
    this.envelope.gain.linearRampToValueAtTime(0, r);
    this.osc.stop(r);
  }

}