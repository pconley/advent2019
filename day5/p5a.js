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

function print(mem){
  var line = `row: `
  for( var i=0; i<20; i+=5){
    console.log(`row: ${_.padEnd(mem[i+0],4)}| ${_.padEnd(mem[i+1],4)}| ${_.padEnd(mem[i+2],4)}| ${_.padEnd(mem[i+3],4)}| ${_.padEnd(mem[i+4],4)}| ${_.padEnd(mem[i+5],4)}`);
  }
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
    console.debug(`val: pos=${pos} mode=${mode} addr=${mem[pos]} >> result=${result}`)
  } else {
    // mode 1: immediate mode; aka interpreted as a value
    result = mem[pos]
    console.debug(`val: pos=${pos} mode=${mode} >> result=${result}`)

  }
  return result;
}

var input = 1;
var output = 999;

function run(memory){

  const commands = {
    1 : (m,p) => {
      // add has 3 parameters
      const modes = extract(memory[pos]);
      console.log("add.  memory=",m[p+0],m[p+1],m[p+2],m[p+3]);
      console.log("add.  modes =",(modes[0]),modes[1],modes[2]);
      const v1 = val(m,pos+1,modes[0]);
      const v2 = val(m,pos+2,modes[1]);
      console.log("add:",v1,"+",v2,"into pos",m[p+3]);
      m[m[p+3]] = v1 + v2;
      console.log(`result at m[${m[p+3]}] = ${m[m[p+3]]}`)
      return p+4;
    },
    2 : (m,p) => {
      // mul has 3 parameters
      const modes = extract(memory[pos]);
      console.log("mul.  memory=",m[p+0],m[p+1],m[p+2],m[p+3]);
      console.log("mul.  modes =",modes[0],modes[1],modes[2]);
      const v1 = val(m,pos+1,modes[0])
      const v2 = val(m,pos+2,modes[1])
      console.log("mul:",v1,"*",v2,"into pos",m[p+3]);
      m[m[p+3]] = v1 * v2;
      console.log(`result at m[${m[p+3]}] = ${m[m[p+3]]}`)
      return p+4;
    },
    // Opcode 3 takes a single integer as input and saves it to the position 
    // given by its only parameter. For example, the instruction 3,50 would 
    // take an input value and store it at address 50.
    3 : (m,p) => {
      console.log(`INPUT: move ${input} to pos ${m[p+1]}`);
      m[m[p+1]] = input;  // should ask user?
      return p+2;
    },
    // Opcode 4 outs the value of its only parameter. For example, the 
    // instruction 4,50 would out the value at address 50.
    4 : (m,p) => {
      const modes = extract(memory[pos]);
      console.log("out  memory=",m[p+0],m[p+1]);
      console.log("out  modes =",modes);
      output = val(m,p+1,modes[0]); // a global
      return p+2;
    },
    // Opcode 5 is jump-if-true: if the first parameter is non-zero, it sets the instruction 
    // pointer to the value from the second parameter. Otherwise, it does nothing.
    5 : (m,p) => {
      const modes = extract(memory[pos]);
      console.log("jump-if-true memory=",m[p+0],m[p+1],m[p+1]);
      console.log("jump-if-true modes =",modes);
      const v1 = val(m,pos+1,modes[0]);
      if( v1 == 0 ){
        console.log("no jump");
        return p+3; // next command
      } else {
        const v2 = val(m,pos+2,modes[1]);
        console.log(`jump to ${v2}`);
        return v2;
      }
    },
    // Opcode 6 is jump-if-false: if the first parameter is zero, it sets the instruction 
    // pointer to the value from the second parameter. Otherwise, it does nothing.
    6 : (m,p) => {
      const modes = extract(memory[pos]);
      console.log("jump-if-false memory=",m[p+0],m[p+1],m[p+1]);
      console.log("jump-if-false modes =",modes);
      const v1 = val(m,pos+1,modes[0]);
      if( v1 != 0 ){
        console.log("no jump");
        return p+3; // next command
      } else {
        const v2 = val(m,pos+2,modes[1]);
        console.log(`jump to ${v2}`);
        return v2;
      }
    },
    // Opcode 7 is less than: if the first parameter is less than the second parameter, 
    // it stores 1 in the position given by the third parameter. Otherwise, it stores 0.
    7 : (m,p) => {
      const modes = extract(memory[pos]);
      console.log("less-than memory=",m[p+0],m[p+1],m[p+1]);
      console.log("less-than modes =",modes);
      const v1 = val(m,pos+1,modes[0]);
      const v2 = val(m,pos+2,modes[1]);
      result = (v1 < v2) ? 1 : 0;
      console.log(`setting ${m[m[p+3]]} to ${result}`)
      m[m[p+3]] = result;
      return p+4; // next command
    },
    // Opcode 8 is equals: if the first parameter is equal to the second parameter, 
    // it stores 1 in the position given by the third parameter. Otherwise, it stores 0.
    8 : (m,p) => {
      const modes = extract(memory[pos]);
      console.log("equals memory=",m[p+0],m[p+1],m[p+1]);
      console.log("equals modes =",modes);
      const v1 = val(m,pos+1,modes[0]);
      const v2 = val(m,pos+2,modes[1]);
      result = (v1 == v2) ? 1 : 0;
      console.log(`setting pos ${m[p+3]} to ${result}`)
      m[m[p+3]] = result;
      return p+4; // next command
    },
  }

  var pos = 0;
  var cnt = 0;
  while( memory[pos] != 99 ){
    cnt += 1;
    if( cnt > 1000 ) break; //failsafe
    const opcode = memory[pos] % 100;
    console.log(`\n[${cnt}] pos=${pos}: raw=${memory[pos]} opcode=${opcode}`);
    pos = commands[opcode](memory,pos);
  }
  console.log("program ended!")
}

function execute(program, inval){
  // this wrapper allows multiple executions
  const memory = program.slice(0);
  input = inval;
  run(memory)
  return output;
}

function test(pgm, input, exout){
  console.log(`\n\n******* test: ${pgm}`)
  const out = execute(pgm,input); 
  console.log(`test: output = ${out}`)
  assert( out == exout );
}

// Part2: tests

// Using position mode, consider whether the input is equal to 8; output 1 (if it is) or 0 (if it is not).
const test1 = [3,9,8,9,10,9,4,9,99,-1,8];
test(test1,8,1); 
test(test1,9,0);
// Using position mode, consider whether the input is less than 8; output 1 (if it is) or 0 (if it is not).
const test2 = [3,9,7,9,10,9,4,9,99,-1,8];
test(test2,7,1); 
test(test2,9,0);
// Using immediate mode, consider whether the input is equal to 8; output 1 (if it is) or 0 (if it is not).
const test3 = [3,3,1108,-1,8,3,4,3,99];
test(test3,8,1); 
test(test3,9,0);
// Using immediate mode, consider whether the input is less than 8; output 1 (if it is) or 0 (if it is not).
const test4 = [3,3,1107,-1,8,3,4,3,99];
test(test4,7,1); 
test(test4,9,0);
// Here are some jump tests that take an input, then output 0 if the input was zero or 1 if the input was non-zero:
const test5 = [3,12,6,12,15,1,13,14,13,4,13,99,-1,0,1,9] // using position mode
test(test5,0,0); // input is zero
test(test5,9,1); // input is NOT zero
const test6 = [3,3,1105,-1,9,1101,0,0,12,4,12,99,1] // using immediate mode
test(test6,0,0); // input is zero
test(test6,9,1); // input is NOT zero

// The next example program uses an input instruction to ask for a single number. The program will then output 999
// if the input value is below 8, output 1000 if the input value is equal to 8, or output 1001 if the input value is 
// greater than 8.
test0 = [3,21,1008,21,8,20,1005,20,22,107,8,21,20,1006,20,31,1106,0,36,98,0,0,1002,21,125,20,4,20,1105,1,46,104,999,1105,1,46,1101,1000,1,20,4,20,1105,1,46,98,99];
test(test0,7, 999); // lt 8
test(test0,8,1000); // eq 8
test(test0,9,1001); // gt8


// the real challenges are in the file

filename = process.argv[2];
fs.readFile(filename, 'utf8', function(err, contents) {
    const texts = contents.split(",");
    const program = texts.map(x => parseInt(x));

    // console.log("\n\n****** PART 1");
    // const out1 = execute(program,1); 
    // console.log(`part 1: output = ${out1}`);
    // assert( out1 == 13787043 );

    console.log("\n\n****** PART 2");
    const out2 = execute(program,5); 
    console.log(`part 2: output = ${out2}`);
    assert( out2 == 3892695 );
});
