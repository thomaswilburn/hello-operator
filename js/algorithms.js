/*

DSL for defining algorithms
[n] - start an algorithm block
C n - carrier
M a b - pipe a into b

Feedback is just more modulation for now
Later it'll need to be broken out

*/

var source = `

[1]
C 1 3
M 2 1
M 4 3
M 5 4
M 6 5
F 6 6

[2]
C 1 3
M 2 1
M 4 3
M 5 4
M 6 5
F 2 2

[3]
C 1 4
M 2 1
M 3 2
M 5 4
M 6 5
F 6 6

[4]
C 1 4
M 2 1
M 3 2
M 5 4
M 6 5
F 4 6

[5]
C 1 3 5
M 2 1
M 4 3
M 6 5
F 6 6

[6]
C 1 3 5
M 2 1
M 4 3
M 6 5
F 5 6

[7]
C 1 3
M 2 1
M 4 3
M 5 3
M 6 5
F 6 6

[8]
C 1 3
M 2 1
M 4 3
M 5 3
M 6 5
F 4 4

[9]
C 1 3
M 2 1
M 4 3
M 5 3
M 6 5
F 2 2

[10]
C 1 4
M 2 1
M 3 2
M 6 4
M 5 4
F 3 3

[11]
C 1 4
M 2 1
M 3 2
M 6 4
M 5 4
F 5 6

[12]
C 1 3
M 2 1
M 4 3
M 5 3
M 6 3
F 2 2

[13]
C 1 3
M 2 1
M 4 3
M 5 3
M 6 3
F 6 6

[14]
C 1 3
M 2 1
M 4 3
M 6 4
M 5 4
F 6 6

[15]
C 1 3
M 2 1
M 4 3
M 5 4
M 6 4
F 2 2

[16]
C 1
M 2 1
M 3 1
M 4 3
M 5 1
M 6 5
F 6 6

[17]
C 1
M 2 1
M 3 1
M 4 3
M 5 1
M 6 5
F 2 2

[18]
C 1
M 2 1
M 3 1
M 4 1
M 5 4
M 6 5
F 3 3

[19]
C 1 4 5
M 2 1
M 3 2
M 6 4
M 6 5
F 6 6

[20]
C 1 2 4
M 3 1
M 3 2
M 5 4
M 6 4
F 3 3

[21]
C 1 2 4 5
M 3 1
M 3 2
M 6 4
M 6 5
F 3 3

[22]
C 1 3 4 5
M 2 1
M 6 3
M 6 4
M 6 5
F 6 6

[23]
C 1 2 4 5
M 3 2
M 6 4
M 6 5
F 6 6

[24]
C 1 2 3 4 5
M 6 3
M 6 4
M 6 5
F 6 6

[25]
C 1 2 3 4 5
M 6 4
M 6 5
F 6 6

[26]
C 1 2 4
M 3 2
M 5 4
M 6 4
F 6 6

[27]
C 1 2 4
M 3 2
M 5 4
M 6 4
F 3 3

[28]
C 1 3 6
M 2 1
M 4 3
M 5 4
F 5 5

[29]
C 1 2 3 5
M 4 3
M 6 5
F 6 6

[30]
C 1 2 3 6
M 4 3
M 5 4
F 5 5

[31]
C 1 2 3 4 5
M 6 5
F 6 6

[32]
C 1 2 3 4 5 6
F 6 6

`.trim().split("\n");

export var algorithms = {};
var current = 1;

for (var line of source) {
  var first = line[0];
  if (first == "[") {
    var [ n ] = line.match(/\d+/);
    current = n;
    continue;
  }

  if (!algorithms[current]) {
    algorithms[current] = {
      carriers: [],
      modulators: []
    }
  }

  var algo = algorithms[current];

  var [ command, ...ops ] = line.trim().split(" ");
  ops = ops.map(Number);
  var [ from, to ] = ops;
  switch (command) {
    case "C":
      algo.carriers = ops.map(from => ({ from }));
      break;

    case "F":
      algo.feedback = { from, to };
      break;

    case "M":
      algo.modulators.push({ from, to });
      break;
  }
}