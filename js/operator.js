/*

Because WebAudio is designed to through away the audio graph cheaply, we
basically treat operators as similarly disposable. Each is used for the
duration of a single note, as part of a "voice." That means they have to be
configurable quickly and easily.

*/

export const OPERATOR_DEFAULTS = {
  enabled: true,
  fixed: false,
  coarse: 1,
  fine: 0,
  velocityScale: 1,
  attack: 0,
  decay: 0,
  sustain: 1,
  release: .1,
  wave: "sine",
  level: 1,
  feedback: 0
};

export class Operator {

  constructor(context, options = {}) {
    this.context = context;

    // merge in options
    this.options = { ...OPERATOR_DEFAULTS, ...options };

    var config = { channels: 1 };

    this.output = new GainNode(context, config);
    this.output.gain.value = this.options.level;

    this.envelope = new GainNode(context, config);
    this.envelope.connect(this.output);

    this.osc = new OscillatorNode(context, config);
    this.osc.type = this.options.wave;
    this.osc.frequency.value = 0;
    this.osc.connect(this.envelope);

    // the modulation gain adjusts the pitch up and down
    // it starts at 1, but signals get piped into its gain
    // they then sum, so they become the new multiplier
    this.modulation = new GainNode(context, config);
    this.modulation.connect(this.osc.frequency);
    this.modulation.gain.value = 0;

    var offset = new ConstantSourceNode(context, config);
    offset.connect(this.modulation.gain);
    offset.start();

    // this is the base pitch, but will be adjusted by modulation
    this.pitch = new ConstantSourceNode(context, config);
    this.pitch.start();
    this.pitch.connect(this.modulation);

    // feedback is an additional modulator, built-in
    this.feedback = new GainNode(context, config);
    this.feedback.connect(this.modulation.gain);
    this.feedback.gain.value = this.options.feedback;
  }

  start(t, frequency, velocity) {

    if (!this.options.enabled) return;

    var frequencyRatio = this.options.coarse + this.options.fine;
    this.pitch.offset.value = this.options.fixed || (frequency * frequencyRatio);

    var unscaled = this.options.level * (1 - this.options.velocityScale);
    var scaled = this.options.level * velocity * this.options.velocityScale;
    var pressure = scaled + unscaled;
    this.output.gain.value = pressure;

    this.osc.start(t);

    // schedule envelope: ADS
    var { attack, decay, sustain } = this.options;
    var a = t + attack;
    var d = a + decay;
    if (attack) {
      this.envelope.gain.setValueAtTime(0, t);
      this.envelope.gain.exponentialRampToValueAtTime(1, a);
    } else {
      this.envelope.gain.setValueAtTime(1, t);
    }
    if (sustain < 1) this.envelope.gain.exponentialRampToValueAtTime(sustain + .0001, d);
  }

  stop(frequency) {
    if (!this.options.enabled) return;
    var { release } = this.options;
    var t = this.context.currentTime;
    var v = this.envelope.gain.value;
    this.envelope.gain.cancelScheduledValues(t);
    this.envelope.gain.value = v;
    var r = t + release;
    this.envelope.gain.exponentialRampToValueAtTime(0.001, r);
    this.osc.stop(r);
  }

}