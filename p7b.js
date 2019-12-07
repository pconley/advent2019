var _ = require('lodash');
var fs = require('fs');
var assert = require('assert');

const ADR = 'A';
const VAL = 'V';

function extract(command){

  function x(mode){ return mode==0?ADR:VAL; }

  var modes = [5,5,5];
  modes[2] = x(Math.trunc(command / 10000)); 
  modes[1] = x(Math.trunc(command / 1000) % 10);
  modes[0] = x(Math.trunc(command / 100) % 10);
  // console.log(command,modes);
  return modes;
}

function same(arr1, arr2){
  for( var i=0; i<arr1.length; i++ ){
    if( arr1[i] != arr2[i] ) return false;
  }
  return arr1.length== arr2.length;
}

assert(same(extract(11104),([VAL,VAL,VAL])))
assert(same(extract(10104),([VAL,ADR,VAL])))
assert(same(extract(1104),([VAL,VAL,ADR])))
assert(same(extract(104),([VAL,ADR,ADR])))

// ABCDE >>> 1002
//    DE - two-digit opcode,      02 == opcode 2
//   C - mode of 1st parameter,  0 == position mode
//  B - mode of 2nd parameter,  1 == immediate mode
// A - mode of 3rd parameter,  0 == position mode,

assert(same(extract(1002),([ADR,VAL,ADR])))

function val(mem,pos,mode){
  if( mode == ADR ){
    // mode 0: address mode; aka interpreted as a address
    result = mem[mem[pos]]
    // console.debug(`val: pos=${pos} mode=${mode} addr=${mem[pos]} >> result=${result}`)
  } else {
    // mode 1: immediate mode; aka interpreted as a value
    result = mem[pos]
    // console.debug(`val: pos=${pos} mode=${mode} >> result=${result}`)
  }
  return result;
}


var output = 999;

function run(state, input){

  var index = 0;

  const commands = {
    1 : (m,p) => {
      // add has 3 parameters
      const modes = extract(memory[pos]);
      // console.log("add.  memory=",m[p+0],m[p+1],m[p+2],m[p+3]);
      // console.log("add.  modes =",(modes[0]),modes[1],modes[2]);
      const v1 = val(m,pos+1,modes[0]);
      const v2 = val(m,pos+2,modes[1]);
      // console.log("add:",v1,"+",v2,"into pos",m[p+3]);
      m[m[p+3]] = v1 + v2;
      // console.log(`result at m[${m[p+3]}] = ${m[m[p+3]]}`)
      return p+4;
    },
    2 : (m,p) => {
      // mul has 3 parameters
      const modes = extract(memory[pos]);
      // console.log("mul.  memory=",m[p+0],m[p+1],m[p+2],m[p+3]);
      // console.log("mul.  modes =",modes[0],modes[1],modes[2]);
      const v1 = val(m,pos+1,modes[0])
      const v2 = val(m,pos+2,modes[1])
      // console.log("mul:",v1,"*",v2,"into pos",m[p+3]);
      m[m[p+3]] = v1 * v2;
      // console.log(`result at m[${m[p+3]}] = ${m[m[p+3]]}`)
      return p+4;
    },
    // Opcode 3 takes a single integer as input and saves it to the position 
    // given by its only parameter. For example, the instruction 3,50 would 
    // take an input value and store it at address 50.
    3 : (m,p) => {
      console.log(`INPUT: move ${input[index]} to pos ${m[p+1]}`);
      m[m[p+1]] = input[index++]; 
      return p+2;
    },
    // Opcode 4 outs the value of its only parameter. For example, the 
    // instruction 4,50 would out the value at address 50.
    4 : (m,p) => {
      const modes = extract(memory[pos]);
      // console.log("out  memory=",m[p+0],m[p+1]);
      // console.log("out  modes =",modes);
      output = val(m,p+1,modes[0]); // a global
      console.log(`OUTPUT: ${output}`);
      return p+2;
    },
    // Opcode 5 is jump-if-true: if the first parameter is non-zero, it sets the instruction 
    // pointer to the value from the second parameter. Otherwise, it does nothing.
    5 : (m,p) => {
      const modes = extract(memory[pos]);
      // console.log("jump-if-true memory=",m[p+0],m[p+1],m[p+1]);
      // console.log("jump-if-true modes =",modes);
      const v1 = val(m,pos+1,modes[0]);
      if( v1 == 0 ){
        // console.log("no jump");
        return p+3; // next command
      } else {
        const v2 = val(m,pos+2,modes[1]);
        // console.log(`jump to ${v2}`);
        return v2;
      }
    },
    // Opcode 6 is jump-if-false: if the first parameter is zero, it sets the instruction 
    // pointer to the value from the second parameter. Otherwise, it does nothing.
    6 : (m,p) => {
      const modes = extract(memory[pos]);
      // console.log("jump-if-false memory=",m[p+0],m[p+1],m[p+1]);
      // console.log("jump-if-false modes =",modes);
      const v1 = val(m,pos+1,modes[0]);
      if( v1 != 0 ){
        // console.log("no jump");
        return p+3; // next command
      } else {
        const v2 = val(m,pos+2,modes[1]);
        // console.log(`jump to ${v2}`);
        return v2;
      }
    },
    // Opcode 7 is less than: if the first parameter is less than the second parameter, 
    // it stores 1 in the position given by the third parameter. Otherwise, it stores 0.
    7 : (m,p) => {
      const modes = extract(memory[pos]);
      // console.log("less-than memory=",m[p+0],m[p+1],m[p+1]);
      // console.log("less-than modes =",modes);
      const v1 = val(m,pos+1,modes[0]);
      const v2 = val(m,pos+2,modes[1]);
      result = (v1 < v2) ? 1 : 0;
      // console.log(`setting ${m[m[p+3]]} to ${result}`)
      m[m[p+3]] = result;
      return p+4; // next command
    },
    // Opcode 8 is equals: if the first parameter is equal to the second parameter, 
    // it stores 1 in the position given by the third parameter. Otherwise, it stores 0.
    8 : (m,p) => {
      const modes = extract(memory[pos]);
      // console.log("equals memory=",m[p+0],m[p+1],m[p+1]);
      // console.log("equals modes =",modes);
      const v1 = val(m,pos+1,modes[0]);
      const v2 = val(m,pos+2,modes[1]);
      result = (v1 == v2) ? 1 : 0;
      // console.log(`setting pos ${m[p+3]} to ${result}`)
      m[m[p+3]] = result;
      return p+4; // next command
    },
  }

  var memory, pos;
  [memory,pos] = state;

  var cnt = 0;
  while( memory[pos] != 99 ){
    cnt += 1;
    if( cnt > 1000 ) break; //failsafe
    const opcode = memory[pos] % 100;
    // console.log(`\n[${cnt}] pos=${pos}: raw=${memory[pos]} opcode=${opcode}`);
    pos = commands[opcode](memory,pos);
    if( opcode == 4 ) {
      // just executed the OUTPUT command; halt the pgm
      // and return the state (so it can restart)
      return [memory, pos]; 
    }
  }
  console.log("program ended!")
  return null;
}

function perm(xs) {
  let ret = [];

  for (let i = 0; i < xs.length; i = i + 1) {
    let rest = perm(xs.slice(0, i).concat(xs.slice(i + 1)));

    if(!rest.length) {
      ret.push([xs[i]])
    } else {
      for(let j = 0; j < rest.length; j = j + 1) {
        ret.push([xs[i]].concat(rest[j]))
      }
    }
  }
  return ret;
}

function run_feedback(program, phases){

  // 1st signal is Zero
  // for each amp...
  //    1st input... is its phase
  //    all subsequent inputs are signals from prev
  // do not "restart" the program for each amp
  // so keep 5 copies of the program state so that
  // we can restart the execution at the same place
  const states = _.range(0,6).map(x=>[program.slice(0),0])

  // first pass through the loop is special because
  // we pass two inputs... phase, then signal
  
  signal = 0;
  for( var i=0; i<5; i++ ){
    const phase = phases[i];
    const state = states[i];
    console.log(`\n***INITIAL amp${i} phase=${phase} signal=${signal} `);
    const result = run(state,[phase,signal]);
    states[i] = result; // save for next exec
    console.log(`output signal = ${output}`);
    signal = output;
  }

  // subsequent passes through the loop has just signal
  // as the input

  var pass = 0;
  while( signal != null ){
    for( var i=0; i<5; i++ ){
      const phase = phases[i];
      const state = states[i];
      console.log(`\n****SUBSEQ ${pass++} amp${i} phase=${phase} signal=${signal} `);
      const result = run(state,[signal]);
      console.log(`output signal = ${output}`);
      if( result == null ) return output
      states[i] = result; // save for next exec
      signal = output;
    }
  }
  return 0; // error
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

    // test case
    // const sigout = run_feedback(program, phases)
    // console.log(`final signal = ${sigout}`);
    // assert( sigout == expected_result );

    // search for optimal phase settings
    const permutations = perm([5,6,7,8,9]);
    var biggie = 0;
    _.each(permutations,phases=>{
      const signal = run_feedback(program, phases);
      if( signal > biggie ){
        biggie = signal
      }
    });
    console.log("biggie = ",biggie)
});
