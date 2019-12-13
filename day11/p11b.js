var _ = require('lodash');
var fs = require('fs');
var assert = require('assert');
// var Combinatorics = require('js-combinatorics');

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
  logger.trace(`val: pos=${pos} mem[${pos}]=${mem[pos]} mode=${mode} base=${base}`);
  var v = 0;
  if( mode == 2 ){ // relative mode
    v = mem[mem[pos]+base];
    logger.trace(`  mem[mem[${pos}]+${base}] = ${v}`)
    logger.trace(`  mem[${mem[pos]+base}] = ${v}`)
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
  logger.info(`set: pos=${pos} mode=${mode} base=${base} to value ${value}`)
  if( mode == 2 ){ // relative mode
    logger.trace(`    set: mem[mem[${pos}+${base}]] to ${value}`)
    logger.trace(`    set: mem[${mem[pos]+base}] to ${value}`)
    mem[mem[pos]+base] = value;
  }
  if( mode == 0 ){ // position mode
    mem[mem[pos]] = value;
  }
  if( mode == 1 ){ // value mode
    // not allowed
    loger.fatal("mode 1 not allowed for set!")
  }
  logger.info();
}

var output = 999;
var input_ptr = 0;
var inputs = [];


function run(mem, pos){

  function fun4(m,p,mode,base,res){ set(m,p+3,mode,base,res); return p+4; }

  function comp(m,p,mode,base,bool){ 
    logger.trace(`comp: bool=${bool} p+3=${p+3} v2=${v2} v3=${v3}`)
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
      console.log(`INPUT: ${inputs[input_ptr]}`);
      set(mem,pos+1,modes[0],base,inputs[input_ptr]);
      input_ptr++;
      return pos+2; },
    4 : (modes) => { 
      output = v1;
      console.log(`OUTPUT: ${v1}`);
      return pos+2; },
    9 : (modes) => { 
      base += v1;
      logger.info(`set base = ${base}\n`)
      return pos+2; },
  }

  var v1, v2, v3;

  while( mem[pos] != 99 ){
    logger.trace(`top: mem[0] = ${mem[0]}, ${mem[1]}`);
    const opcode = mem[pos] % 100;
    const [m1,m2,m3] = extract(mem[pos]);
    v1 = val(mem,pos+1,m1,base);
    v2 = val(mem,pos+2,m2,base);
    v3 = val(mem,pos+3,m3,base);
    logger.debug(`${pos}: mem=${mem[pos]} >> opcode=${opcode} op=${names[opcode]} vals=[${v1},${v2}] modes=[${m1},${m2},${m3}] base=${base}`);
    pos = commands[opcode]([m1,m2,m3]);
    // halt on processed "output" command
    if( opcode == 4 ) return [mem, pos, base]; 
  }
  // console.log("program halted with output=",output);
  return null;
}

const BLACK=0;
const WHITE=1;

const LEFT=0;
const RIGHT=1;

const _UP = 0;
const _RT = 1;
const _DN = 2;
const _LT = 3;

function color(val){ return val==BLACK?"B":"W"; }
function direct(val){ return val==RIGHT?"R":"L"; }
function heading(val){
       if( val==_UP ) return "^";
  else if( val==_RT ) return ">";
  else if( val==_DN ) return "v";
  else if( val==_LT ) return "<";
  return "*" // error
}

function turn(heading,direction){
  // here is the magic +1 right; -1 left
  const d = direction==RIGHT ? 1 : -1;
  // console.log(d, heading+d, (4+heading+d) % 4)
  return (4+heading+d) % 4;
}

function move(pos,heading){
  if( heading==_UP ) return [pos[0]-1,pos[1]]
  if( heading==_DN ) return [pos[0]+1,pos[1]]
  if( heading==_RT ) return [pos[0],pos[1]+1]
  if( heading==_LT ) return [pos[0],pos[1]-1]
}

assert( turn(_UP,RIGHT) == _RT )
assert( turn(_UP,LEFT) == _LT )

//==== MAINLINE ====//

filename = process.argv[2]; 
logger.level = process.argv[3]; // trace debug info warn error fatal

const contents = fs.readFileSync(filename, 'utf8');
const program = contents.split(",").map(x => parseInt(x));

output = 998;
var mem = program.splice(0);
var pos = 0;
var base = 0;

robot_position = [0,0];
robot_heading = _UP;

hull = {};
hull[robot_position] = WHITE; // PART2 start on WHITE

for( var loop=0; loop<1000; loop++ ){
  console.log();

  input_ptr = 0;
  const v = hull[robot_position];
  in_val = v == undefined ? BLACK : v;
  console.log("set inputs", in_val);
  inputs = [in_val];

  const result1 = run(mem,pos,base);
  if( result1 == null ){
    console.log("program ended at 1");
    break;
  }  
  [mem, pos, base] = result1;
  const color_to_paint = output;

  console.log(`paint hull ${color(color_to_paint)} at ${robot_position} (facing ${heading(robot_heading)})`);
  const [r,c] = robot_position;
  hull[[r,c]] = color_to_paint;
  console.log(loop,"hull size =",Object.keys(hull).length);

  const result2 = run(mem,pos,base);
  if( result2 == null ){
    console.log("program ended at 2");
    break;
  }
  [mem, pos, base] = result2;
  const direction_to_turn = output;

  console.log(`turn ${direct(direction_to_turn)} from current ${heading(robot_heading)}`)
  robot_heading = turn(robot_heading,direction_to_turn);
  robot_position = move(robot_position, robot_heading);
}

console.log(hull);

const screen = new Array(100).fill(0).map(() => new Array(100).fill('-'));

Object.keys(hull).forEach(pos => {
  const [x,y] = pos.split(",").map(x=>parseInt(x));
  screen[x][y] = hull[pos]==0?" ":"X";
});
for( i=0; i<10; i++){
  console.log(screen[i].splice(0,50).join(""))
};


// Part1: Your puzzle answer was 2160.
// Part2: LRZECGFE