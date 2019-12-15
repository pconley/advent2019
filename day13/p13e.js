var _ = require('lodash');
var fs = require('fs');
var assert = require('assert');
// var Combinatorics = require('js-combinatorics');

var log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = 'trace'; // trace debug info warn error fatal

function count(arr,val){
  return _.sum(arr.map(x=>x==val?1:0));
}

class Computer {
  constructor(program) {
    this.program = program.slice(0);
    this.base = 0;
    this.instruction = 0;
    this.show(0);
  }

  value(pos,mode){
    var v = 0;
    const raw = this.program[pos];
    if( mode == 2 ){ // relative mode
      v = this.program[raw+this.base];
    }
    if( mode == 0 ){ // position mode
      v = this.program[raw];
    }
    if( mode == 1 ){ // value mode
      v = raw;
    }
    if( v == NaN ) v=0; // default
    if( v == undefined ) v=0; // default
    return v;
  }

  show(start){
    console.log("program:",this.program.slice(start,start+5));
  }

  execute(){
    console.log("execute");
    this.show(0);
    const result = this.run(this.program, this.instruction, this.base);
    return output;
  }

  run(mem, pos, base){

    console.log("new run",pos);

    function fun4(m,p,mode,base,res){ 
      set(m,p+3,mode,base,res); 
      return p+4; 
    }
  
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
        logger.warn(`INPUT: ${inputs[input_ptr]}`);
        set(mem,pos+1,modes[0],base,inputs[input_ptr]);
        input_ptr++;
        return pos+2; },
      4 : (modes) => { 
        output = v1;
        logger.info(`OUTPUT: ${v1}`);
        return pos+2; },
      9 : (modes) => { 
        base += v1;
        logger.info(`set base = ${base}\n`);
        return pos+2; },
    }
  
    var v1, v2, v3;
  
    while( mem[pos] != 99 ){
      logger.trace(`top: mem[0] = ${mem[0]}, ${mem[1]}`);
      const opcode = mem[pos] % 100;
      const [m1,m2,m3] = extract(mem[pos]);
      v1 = this.value(pos+1,m1);
      v2 = this.value(pos+2,m2);
      v3 = this.value(pos+3,m3);
      logger.debug(`${pos}: mem=${mem[pos]} >> opcode=${opcode} op=${names[opcode]} vals=[${v1},${v2}] modes=[${m1},${m2},${m3}] base=${base}`);
      pos = commands[opcode]([m1,m2,m3]);
      // halt on processed "output" command
      if( opcode == 4 ) return [mem, pos, base]; 
    }
    // console.log("program halted with output=",output);
    return null;
  }
}


function extract(command){
  return [100,1000,10000].map(d=>(Math.trunc(command / d) % 10));
}

// x = extract(204)
// logger.trace(x)
// assert( JSON.stringify(x)==JSON.stringify([2,0]))

function xval(mem,pos,mode,base){
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

var inputs = [];
var input_ptr = 0;
var output = 999;

function run(mem, pos, base){

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
      logger.warn(`INPUT: ${inputs[input_ptr]}`);
      set(mem,pos+1,modes[0],base,inputs[input_ptr]);
      input_ptr++;
      return pos+2; },
    4 : (modes) => { 
      output = v1;
      logger.info(`OUTPUT: ${v1}`);
      return pos+2; },
    9 : (modes) => { 
      base += v1;
      logger.info(`set base = ${base}\n`);
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

const EMPTY  = 0; // is an empty tile. No game object appears in this tile.
const WALL   = 1; // is a wall tile. Walls are indestructible barriers.
const BLOCK  = 2; // is a block tile. Blocks can be broken by the ball.
const PADDLE = 3; // is a horizontal paddle tile. The paddle is indestructible.
const BALL   = 4; // is a ball tile. The ball moves diagonally and bounces off objects.


function tile(val){
  const lookup = {0:".", 1:"+", 2:"B", 3:"[", 4:"*" }
  return lookup[val];
}

function print(screen,max_x,max_y){
  for(var x=0; x<=max_x; x++ ){
    const row = screen[x].slice(0,max_y+1).join("");
    console.log(row);
  }
}

//==== MAINLINE ====//

filename = process.argv[2]; 
logger.level = process.argv[3]; 
// trace debug info warn error fatal

const contents = fs.readFileSync(filename, 'utf8');
const program = contents.split(",").map(x => parseInt(x));

output = 998;
var mem = program.slice(0);
var pos = 0;
var base = 0;
var ball = null;
var paddle = null;

const screen = new Array(100).fill(0).map(() => new Array(100).fill('-'));
var max_x = 0;
var max_y = 0;

mem[0] = 2; // to play???

input_ptr = 0;
inputs = [-1,0,1,0,0,0,0,0,0];

const computer = new Computer(program);

for( var loop=0; loop<1; loop++ ){

  const r1 = computer.execute();
  console.log("r1",r1);
  
  const r2 = computer.execute();
  console.log("r2",r2);

  const r3 = computer.execute();
  console.log("r3",r3);


  // const result1 = run(mem,pos,base);
  // if( result1 == null ){
  //   console.log("program ended at 1");
  //   break;
  // }  
  // [mem, pos, base] = result1;
  // const x = output;

  // const result2 = run(mem,pos,base);
  // if( result2 == null ){
  //   console.log("program ended at 2");
  //   break;
  // }
  // const y = output;
  // [mem, pos] = result2;

  // const result3 = run(mem,pos,base);
  // if( result3 == null ){
  //   console.log("program ended at 3");
  //   break;
  // }
  // const tile_id = output;
  // [mem, pos] = result3;

  // if( tile_id == BALL ){
  //   ball = [x,y];
  //   console.log(`${loop} B: ball: ${ball}  paddle:${paddle}`);
  // }
  // if( tile_id == PADDLE ){
  //   paddle = [x,y];
  //   console.log(`${loop} P: ball: ${ball}  paddle:${paddle}`);
  // }

  // if( ball && paddle ){
  //   if( ball[0] == paddle[0] ) { inputs=[0]; input_ptr=0; }
  //   else if( ball[0] > paddle[0] ) { inputs=[+1]; input_ptr=0; }
  //   else /* ball[0] < paddle[0] */ { inputs=[-1]; input_ptr=0; }
  // }

  // // When three output instructions specify X=-1, Y=0, 
  // // the third output instruction is not a tile; the value 
  // // instead specifies the new score to show in the segment display.

  // if( x==-1 && y==0 ){
  //   console.log(`**** SCORE: ${output}`)
  //   // print(screen,max_x,max_y);
  // } else {
  //   //console.log(`loop ${loop}: ${[x,y]} ${tile(tile_id)} ball=${ball} paddle=${paddle}`);
  //   screen[x][y] = tile(tile_id);
  //   if( x > max_x ) max_x = x;
  //   if( y > max_y ) max_y = y;
  // }
}

console.log([max_x,max_y]);



// Part One - Your puzzle answer was 291.
// const cnt = count(_.flatten(screen),tile(BLOCK));
// console.log(cnt)
