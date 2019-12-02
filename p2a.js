var fs = require('fs');
var assert = require('assert');

function run(values){
  // console.log("start = ",values);
  var pos = 0;
  while( values[pos] != 99 ){
    const opcode = values[pos];
    const r1 = values[pos+1];
    const r2 = values[pos+2];
    const t = values[pos+3];
    switch(opcode) {
      case 1: // Addition
        // console.log("add:",values[r1],values[r2],"=> pos[",t,"]")
        values[t] = values[r1] + values[r2];
        break;
      case 2: // Multiplication
        // console.log("mul:",values[r1],values[r2],"=> pos[",t,"]")
        values[t] = values[r1] * values[r2];
        break;
      default:
        console.error("invalid op code = ", opcode);
        throw new Error();
        break;
    }
    // console.log("result = ",values);
    pos += 4;
  }
  // console.log("program ended!")
  // console.log("final = ",values);
  // console.log("at zero = ",values[0]);
}

function execute(program, noun, verb){
    const memory = program.slice(0);
    memory[1] = noun;
    memory[2] = verb;
    run(memory)
    return memory[0];
}

// console.log(process.argv);
filename = process.argv[2];
fs.readFile(filename, 'utf8', function(err, contents) {
    const texts = contents.split(",");
    const program = texts.map(x => parseInt(x));

    // test that part one still works
    assert( execute(program,12,2) == 6327510 );
    console.log("part one test passed");

    // then part two, find specific value
    for (var noun = 0; noun < 100; noun++) {
      for (var verb = 0; verb < 100; verb++) {
        const result = execute(program,noun,verb);
        // console.log(memory[0])
        if( result == 19690720 ){
          console.log("found it:",noun,verb,"gives",result);
          console.log("so the answer is ", 100 * noun + verb);
        }
      }
    }
});
