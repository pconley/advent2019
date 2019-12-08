var _ = require('lodash');
var fs = require('fs');
var assert = require('assert');
var Combinatorics = require('js-combinatorics');

var log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = 'info';
logger.trace('Entering cheese testing');
logger.debug('Got cheese.');
logger.info('Cheese is Comté.');
logger.warn('Cheese is quite smelly.');
logger.error('Cheese is too ripe!');
logger.fatal('Cheese was breeding ground for listeria.');

function extract(command){
  return [100,1000].map(d=>(Math.trunc(command / d) % 10));
}

function val(mem,pos,mode){
  return mode==0 ? mem[mem[pos]] : mem[pos]
}

var signal = 0;

function run(state, input){

  function fun4(m,p,res){ m[m[p+3]] = res; return p+4; }

  function comp(m,p,bool){ return bool ? p+3 : v2; }

  const commands = {
    1 : () => { return fun4(mem,pos,v1 + v2) },
    2 : () => { return fun4(mem,pos,v1 * v2) },
    7 : () => { return fun4(mem,pos,+(v1 < v2)) },
    8 : () => { return fun4(mem,pos,+(v1 == v2)) },
    5 : () => { return comp(mem,pos,(v1 == 0)) },
    6 : () => { return comp(mem,pos,(v1 != 0)) },
    3 : () => { 
      mem[mem[pos+1]] = input[index++];
      return pos+2; },
    4 : () => { 
      signal = v1; // output signal
      return pos+2; },
  }

  var v1, v2;
  var index = 0;
  var mem = state[0];
  var pos = state[1];

  while( mem[pos] != 99 ){
    const opcode = mem[pos] % 100;
    const [m1,m2] = extract(mem[pos]);
    v1 = val(mem,pos+1,m1);
    v2 = val(mem,pos+2,m2);
    pos = commands[opcode]();
    // halt on processed "output" command
    if( opcode == 4 ) return [mem, pos]; 
  }
  return null; // program ended 
}

function run_feedback(program, phases){
  signal = 0;
  // amp state is [memory,pos] (so set the start state)
  const states = _.range(0,6).map(x=>[program.slice(0),0]);
  for( var count=0; true; count++ ){
    const i = count%5; // the amp number
    inputs = count<5 ? [phases[i],signal] : [signal];
    const result = states[i] = run(states[i],inputs);
    logger.trace(`${count}: amp[${i}] inputs=${inputs} signal=${signal}`);
    if( result == null ) return signal
  }
}

filename = process.argv[2];
fs.readFile(filename, 'utf8', function(err, contents) {
  const lines = contents.split("\n");
  const phases = lines[0].split(",").map(x => parseInt(x));
  const program = lines[1].split(",").map(x => parseInt(x));
  const expected_result = parseInt(lines[2]);

  var biggie = 0;
  Combinatorics.permutation([5,6,7,8,9]).toArray().forEach(phases=>{
    logger.debug(phases);
    const signal = run_feedback(program, phases);
    if( signal > biggie ) biggie = signal;
  });

  logger.info("biggie = ",biggie)
  assert(biggie == expected_result)
});
