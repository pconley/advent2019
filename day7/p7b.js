var _ = require('lodash');
var fs = require('fs');
var assert = require('assert');
var Combinatorics = require('js-combinatorics');

function extract(command){
  return [100,1000].map(d=>(Math.trunc(command / d) % 10));
}

function val(mem,pos,mode){
  return mode==0 ? mem[mem[pos]] : mem[pos]
}

var output = 999;

function run(state, input){

  const commands = {
    1 : (m,p) => {
      m[m[p+3]] = v1 + v2;
      return p+4;
    },
    2 : (m,p) => {
      m[m[p+3]] = v1 * v2;
      return p+4;
    },
    3 : (m,p) => {
      m[m[p+1]] = input[index++]; 
      return p+2;
    },
    4 : (m,p) => {
      output = v1;
      return p+2;
    },
    5 : (m,p) => {
      return v1 == 0 ? p+3 : v2;
    },
    6 : (m,p) => {
      return v1 != 0 ? p+3 : v2;
    },
    7 : (m,p) => {
      m[m[p+3]] = (v1 < v2) ? 1 : 0;;
      return p+4; 
    },
    8 : (m,p) => {
      m[m[p+3]] = (v1 == v2) ? 1 : 0;;
      return p+4;
    },
  }

  var v1, v2;
  var index = 0;
  var memory = state[0];
  var pos = state[1];

  while( memory[pos] != 99 ){
    const opcode = memory[pos] % 100;
    const [m1,m2] = extract(memory[pos]);
    v1 = val(memory,pos+1,m1);
    v2 = val(memory,pos+2,m2);
    pos = commands[opcode](memory,pos);
    // halt on processed "output" command
    if( opcode == 4 ) return [memory, pos]; 
  }
  return null; // program ended 
}

function run_feedback(program, phases){
  // amp state is [memory,pos] (so set the start state)
  const states = _.range(0,6).map(x=>[program.slice(0),0,0]);
  var signal = 0;
  for( var amp=0; true; amp++ ){
    const i = amp%5;
    inputs = amp<5 ? [phases[i],signal] : [signal];
    console.log(`>>> amp${amp} inputs=${inputs}`);
      states[i] = run(states[i],inputs);
    console.log(`<<< output signal = ${output}`);
    if( states[i] == null ) return output
    signal = output; // next input
  }
}

//------------------------------------------------------------------------------
// 
//------------------------------------------------------------------------------

filename = process.argv[2];
fs.readFile(filename, 'utf8', function(err, contents) {
  const lines = contents.split("\n");
  const phases = lines[0].split(",").map(x => parseInt(x));
  const program = lines[1].split(",").map(x => parseInt(x));
  const expected_result = parseInt(lines[2]);

  var biggie = 0;
  Combinatorics.permutation([5,6,7,8,9]).toArray().forEach(phases=>{
    const signal = run_feedback(program, phases);
    if( signal > biggie ) biggie = signal;
  });

  console.log("biggie = ",biggie)
  assert(biggie == expected_result)
});
