export class MIDITargetEvent extends Event {
  constructor(type, data) {
    super(type);
    this.data = data;
  }
}

const NOTE_OFF = 8;
const NOTE_ON = 9;
const AFTERTOUCH = 10;
const CONTROL_CHANGE = 11;
const PROGRAM_CHANGE = 12;
const CHANNEL_AFTERTOUCH = 13;
const PITCH_BEND = 14;

export class MIDITarget extends EventTarget {

  constructor() {
    super();

    this.onMIDI = this.onMIDI.bind(this);

    this.getAccess();
  }

  async getAccess() {
    if (!navigator.requestMIDIAccess) return;
    var midi = await navigator.requestMIDIAccess();
    this.midi = midi;
    for (var [ key, entry ] of midi.inputs) {
      entry.onmidimessage = this.onMIDI;
    }
    this.fire("ready");
  }

  onMIDI(e) {
    var [ a, b, c ] = e.data;
    var message = a >> 4;
    var channel = a & 0xF;
    console.log(message, channel, b, c);
    switch (message) {
      case NOTE_ON:
      case NOTE_OFF:
        if (c == 0 || message == NOTE_OFF) {
          this.fire("noteoff", { channel, key: b });
        } else {
          this.fire("noteon", { channel, key: b, pressure: c });
        }
        break;

      case CONTROL_CHANGE:
        this.fire("controlchange", { channel, controller: b, value: c });
        break;

      // other message types unimplemented because my keyboard doesn't fire them

    }

  }

  sendMIDI(message, channel = 0, b = 0, c = 0) {
    if (!this.midi) return;
    // should probably be targeted?
    var a = (message << 4) + channel;
    for (var [ key, entry ] of this.midi.outputs) {
      entry.send([a, b, c]);
    }
  }

  sendReset() {
    // reset all controllers, all channels
    for (var i = 0; i < 16; i++) {
      this.sendMIDI(CONTROL_CHANGE, i, 121);
    }
  }

  fire(event, data) {
    var e = new MIDITargetEvent(event, data);
    this.dispatchEvent(e);
  }

  on(event, callback) {
    this.addEventListener(event, callback);
  }

  off(event, callback) {
    this.removeEventListener(event, callback);
  }

}