import ElementBase from "./elementBase.js";

var range = function(start, end, step = 1) {
  var out = [];
  for (var i = start; i < end; i += step) {
    out.push(i);
  }
  return out;
}

export class OperatorPanel extends ElementBase {
  static template = `
<div class="operator-container">
  ${range(0, 6).map(n => `
  <div class="operator">
    <rotary-encoder min=".5" max="4" value=1>coarse</rotary-encoder>
    <rotary-encoder min="-.5" max=".5" value=0 step=".1">fine</rotary-encoder>
    <rotary-encoder value=100 min=1 max=10000 step=100>fixed</rotary-encoder>
    <rotary-encoder value=1>depth</rotary-encoder>

    <rotary-encoder value=0 max=10>attack</rotary-encoder>
    <rotary-encoder value=0 max=10>decay</rotary-encoder>
    <rotary-encoder value=1 step=".1">sustain</rotary-encoder>
    <rotary-encoder value=0 max=10>release</rotary-encoder>
  <div>
  `.trim()).join("\n")}
</div>
  `
}

OperatorPanel.define("operator-panel");