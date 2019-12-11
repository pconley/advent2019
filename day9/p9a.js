var _ = require('lodash');
var fs = require('fs');
var assert = require('assert');
var Combinatorics = require('js-combinatorics');

var log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = 'trace'; // trace debug info warn error fatal

function extract(command){
  return [100,1000,10000].map(d=>(Math.trunc(command / d) % 10));
}

// x = extract(204)
// logger.trace(x)
// assert( JSON.stringify(x)==JSON.stringify([2,0]))

function val(mem,pos,mode,base){
  // return mode==0 ? mem[mem[pos]] : mem[pos]
  logger.trace(`val: pos=${pos} mode=${mode} base=${base}`);
  var v = 0;
  if( mode == 2 ){ // relative mode
    v = mem[mem[pos]+base];
  }
  if( mode == 0 ){ // position mode
    v = mem[mem[pos]];
  }
  if( mode == 1 ){ // value mode
    v = mem[pos];
  }
  if( v == NaN ) v=0; // default
  if( v == undefined ) v=0; // default
  logger.trace(`-> val result = ${v}`);
  return v;
}

function set(mem,pos,mode,base,value){
  logger.info(`set: pos=${pos} mode=${mode} base=${base} to value ${value}\n`)
  if( mode == 2 ){ // relative mode
    mem[mem[pos]+base] = value;
  }
  if( mode == 0 ){ // position mode
    mem[mem[pos]] = value;
  }
  if( mode == 1 ){ // value mode
    // not allowed
    loger.fatal("mode 1 not allowed for set!")
  }
}

var output = 0;

function run(mem, input){

  function fun4(m,p,mode,base,res){ set(m,p+3,mode,base,res); return p+4; }

  function comp(m,p,mode,base,bool){ 
    logger.error(`comp: bool=${bool} p+3=${p+3} v2=${v2} v3=${v3}`)
    // const loc = bool ? p+3 : v2;
    const loc = bool ? p+3 : v2;
    logger.info(`jump to ${loc}\n`);
    return loc;
  };

  const names = {1: "add", 2: "mul", 3: "in", 4: "out", 5: "zero", 6: "non-zero", 7: "lt", 8: "eq", 9: "base"}

  const commands = {
    1 : (modes) => { return fun4(mem,pos,modes[2],base,v1 + v2) },
    2 : (modes) => { return fun4(mem,pos,modes[2],base,v1 * v2) },
    7 : (modes) => { return fun4(mem,pos,modes[2],base,+(v1 < v2)) },
    8 : (modes) => { return fun4(mem,pos,modes[2],base,+(v1 == v2)) },

    5 : (modes) => { return comp(mem,pos,modes[2],base,(v1 == 0)) },
    6 : (modes) => { return comp(mem,pos,modes[2],base,(v1 != 0)) },

    3 : (modes) => { 
      console.log(`INPUT: mode=${modes} input=${input[index]}\n`);
      set(mem,pos+1,modes[0],base,input[index]);
      index++;
      // mem[mem[pos+1]] = input[index++];
      return pos+2; },
    4 : (modes) => { 
      output = v1;
      console.log(`OUTPUT: ${v1}\n`);
      return pos+2; },
    9 : (modes) => { 
      base += v1;
      logger.info(`base = ${base}\n`)
      return pos+2; },
  }

  var v1, v2, v3;
  var index = 0;
  var base = 0;
  var pos = 0;

  var failsafe = 0;
  while( mem[pos] != 99 ){
    logger.trace(`top: ${mem}`);
    // if( failsafe++ > 50 ) break;
    const opcode = mem[pos] % 100;
    const [m1,m2,m3] = extract(mem[pos]);
    v1 = val(mem,pos+1,m1,base);
    v2 = val(mem,pos+2,m2,base);
    v3 = val(mem,pos+3,m3,base);
    logger.debug(`${pos}: mem=${mem[pos]} >> opcode=${opcode} op=${names[opcode]} vals=[${v1},${v2}] modes=[${m1},${m2},${m3}] base=${base}`);
    pos = commands[opcode]([m1,m2,m3]);
    // halt on processed "output" command
    // if( opcode == 4 ) return [mem, pos]; 
  }
}

function run_program(program){
  output = 0;
  index = 0;
  inputs = [2];
  const result = run(program,inputs);
  logger.trace(`inputs=${inputs} result=${result}`);
}

//==== MAINLINE ====//

filename = process.argv[2]; 
logger.level = process.argv[3]; // trace debug info warn error fatal

const contents = fs.readFileSync(filename, 'utf8');
const lines = contents.split("\n");
// const phases = lines[0].split(",").map(x => parseInt(x));
const program = lines[1].split(",").map(x => parseInt(x));
// const expected_result = parseInt(lines[2]);

logger.trace(program);
run_program(program);
logger.info("last output was",output)
// assert(result == expected_result)


// PART ONE
// OUTPUT: 3518157894


// PART TWO
// INPUT: mode=2,0,0 input=2
// OUTPUT: 80379
