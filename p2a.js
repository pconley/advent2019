var fs = require('fs');
var assert = require('assert');

function basicFuel(mass){
  // take its mass, divide by three, round down, and subtract 2
  return Math.floor(mass/3.0) - 2
}

function totalFuel(mass){
  const fuel_for_mass = basicFuel(mass);
  if( fuel_for_mass <= 0 ) return 0;
  return fuel_for_mass + totalFuel(fuel_for_mass);
}

const accumulator = (acc,val,fun) => acc+fun(val);
const basic_func = (acc,val) => accumulator(acc,val,basicFuel)
const total_func = (acc,val) => accumulator(acc,val,totalFuel)

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

// console.log(process.argv);
filename = process.argv[2];
fs.readFile(filename, 'utf8', function(err, contents) {
    const texts = contents.split(",");
    const program = texts.map(x => parseInt(x));

    // validate that part one still works
    var memory = program.slice(0);
    // replace position 1 with the value 12 and 
    // replace position 2 with the value 2.
    memory[1] = 12;
    memory[2] = 2;
    run(memory)
    console.log(memory[0])
    assert( memory[0] == 6327510 );

    // validate that memory is replaced
    memory = program.slice(0);
    // replace position 1 with the value 12 and 
    // replace position 2 with the value 2.
    memory[1] = 12;
    memory[2] = 2;
    run(memory)
    console.log(memory[0])
    assert( memory[0] == 6327510 );
    
    // then execute part two, find 19690720

    var noun, verb;
    for (noun = 0; noun < 100; noun++) {
      for (verb = 0; verb < 100; verb++) {
        var memory = program.slice(0);
        // console.log(noun,verb);
        memory[1] = noun;
        memory[2] = verb;
        run(memory);
        // console.log(memory[0])
        if( memory[0] == 19690720){
          console.log(noun,verb);
          console.error("found it");
          console.log("answer is ",100 * noun + verb);
        }
      }
    }
});
