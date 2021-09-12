import ElementBase from "./elementBase.js";

export class RotaryEncoder extends ElementBase {
  static template = `
<style>
:host {
  display: inline-block;
}

.container {
  position: relative;
}

circle {
  fill: none;
  stroke: black;
  transform: rotate(-90deg);
  transform-origin: center;
}

line {
  stroke: black;
  stroke-width: 1px;
}

[as=indicator] {
  stroke-width: 2px;
  stroke: #808;
}

input[as="display"] {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80%;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  transform: translate(-50%, -50%);
  appearance: none;
  text-align: center;
}

input[as="display"]:focus {
  border-bottom: 2px solid black;
  outline: none;
}

</style>
<div class="container">
  <svg width=48 height=48 viewBox="0 0 32 32">
    <circle as="outer" cx=16 cy=16 r=14 />
    <circle as="indicator" cx=16 cy=16 r=12 />
    <line as="twelve" x1=16 x2=16 y1=0 y2=12 />
  </svg>
  <input as="display">
</div>
  `

  static boundMethods = ["onInput", "onWheel", "onKey"];
  constructor() {
    super();

    this.elements.display.addEventListener("input", this.onInput);
    this.elements.display.addEventListener("keydown", this.onKey);
    this.elements.display.addEventListener("keyup", this.onKey);
    this.elements.display.addEventListener("keypress", this.onKey);

    this.addEventListener("wheel", this.onWheel);

    this.updateIndicator();
  }

  updateIndicator() {
    var { indicator } = this.elements;
    var scaled = this.scaledValue;
    var l = indicator.getTotalLength();
    indicator.style.strokeDasharray = `${l} ${l}`;
    indicator.style.strokeDashoffset = `${l - l * scaled}`;
  }

  static observedAttributes = ["min", "max", "step", "value"];
  static mirroredProps = ["min", "max", "step"];
  attributeChangedCallback(attr, was, is) {
    switch (attr) {
      case "value":
        this.value = is;
        break;
    }
  }

  get value() {
    return this.elements.display.value * 1;
  }

  set value(v) {
    this.elements.display.value = v;
    this.updateIndicator();
  }

  get scaledValue() {
    var v = this.value;
    var min = this.min * 1;
    var max = this.max * 1;
    return (v - min) / (max - min);
  }

  set scaledValue(v) {
    var min = this.min * 1;
    var max = this.max * 1;
    var d = max - min;
    this.value = v * d + min;
    this.updateIndicator();
  }

  onInput(e) {
    e.stopImmediatePropagation();
    this.updateIndicator();
  }

  onWheel(e) {
    e.stopImmediatePropagation();
    var step = this.step || (this.max - this.min) * .01;
    var v = this.value;
    if (e.deltaY < 0) {
      v += step;
    } else {
      v -= step;
    }
    if (v > this.max * 1) v = this.max;
    if (v < this.min * 1) v = this.min;
    this.value = v;
  }

  onKey(e) {
    e.stopImmediatePropagation();
  }

}

RotaryEncoder.define("rotary-encoder");