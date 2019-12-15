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
    this.program = program.splice(0);
    logger.trace(`construct: pgm[0..1] = ${this.program[0]}, ${this.program[1]}`);
    this.pos = 0;
    this.base = 0;
    this.inputs = [];
    this.input_ptr = 0;
    this.output = 999;
  }

  extract(command){
    return [100,1000,10000].map(d=>(Math.trunc(command / d) % 10));
  } 

  val(pos,mode){
    const raw = this.program[pos];
    logger.trace(`val: pos=${pos} program[${pos}]=${raw} mode=${mode} base=${this.base}`);
    var v = 0;
    if( mode == 2 ){ // relative mode
      v = this.program[raw+this.base];
      logger.trace(`  pgm[pgm[${pos}]+${this.base}] = ${v}`)
      logger.trace(`  pgm[${this.program[pos]+this.base}] = ${v}`)
    }
    if( mode == 0 ){ // position mode
      v = this.program[raw];
    }
    if( mode == 1 ){ // value mode
      v = raw;
    }
    if( v == NaN ) v=0; // default
    if( v == undefined ) v=0; // default
    logger.trace(`-> val result = ${v}`);
    return v;
  }

  set(pos,mode,value){
    logger.info(`set: pos=${this.pos} mode=${mode} base=${this.base} to value ${value}`)
    const raw = this.program[pos];
    if( mode == 2 ){ // relative mode
      logger.trace(`    set: pgm[pgm[${pos}]+${this.base}] to ${value}`)
      logger.trace(`    set: pgm[${raw+this.base}] to ${value}`)
      this.program[raw+this.base] = value;
    }
    if( mode == 0 ){ // position mode
      this.program[raw] = value;
    }
    if( mode == 1 ){ // value mode
      throw new Error(); // not allowed
    }
    logger.info();
  }

  run(inputs=[], parent=this){

    var v1, v2, v3;

    var input_ptr = 0;

    function fun4(pos,mode,value){ 
      parent.set(parent.program,pos+3,mode,parent.base,value);
      return pos+4;
    }

    function comp(pos,bool,v2){ 
      logger.trace(`comp: bool=${bool} p+3=${pos+3} v2=${v2}`)
      const loc = bool ? pos+3 : v2;
      logger.info(`comp: jump to ${loc}\n`);
      return loc;
    };

    const names = {1: "add", 2: "mul", 3: "in", 4: "out", 5: "zero", 6: "non-zero", 7: "lt", 8: "eq", 9: "base"}

    const commands = {
      1 : (modes) => { return fun4(this.pos,modes[2],(v1 + v2)) },
      2 : (modes) => { return fun4(this.pos,modes[2],(v1 * v2)) },
      7 : (modes) => { return fun4(this.pos,modes[2],+(v1 < v2)) },
      8 : (modes) => { return fun4(this.pos,modes[2],+(v1 == v2)) },

      5 : (modes) => { return comp(this.pos,(v1 == 0),v2) },
      6 : (modes) => { return comp(this.pos,(v1 != 0),v2) },

      3 : (modes) => { 
        logger.warn(`INPUT: ${inputs[input_ptr]}`);
        set(pos+1,modes[0],inputs[input_ptr]);
        input_ptr++;
        return parent.pos+2; },
      4 : (modes) => { 
        parent.output = v1;
        logger.info(`OUTPUT: ${v1}`);
        return parent.pos+2; },
      9 : (modes) => { 
        parent.base += v1;
        logger.info(`set base = ${parent.base}\n`);
        return parent.pos+2; },
    }

    while( this.program[this.pos] != 99 ){
      logger.trace(`top: pos=${this.pos} pgm[0..1] = ${this.program[0]}, ${this.program[1]}`);
      const opcode = this.program[this.pos] % 100;
      const [m1,m2,m3] = this.extract(this.program[this.pos]);
      v1 = this.val(this.pos+1,m1);
      v2 = this.val(this.pos+2,m2);
      v3 = this.val(this.pos+3,m3);
      logger.debug(`${this.pos}: mem=${this.program[this.pos]} >> opcode=${opcode} op=${names[opcode]} vals=[${v1},${v2}] modes=[${m1},${m2},${m3}] base=${this.base}`);
      this.pos = commands[opcode]([m1,m2,m3]);
      // halt on processed "output" command
      if( opcode == 4 ) return this.output; 
    }
    // console.log("program halted with output=",output);
    return null;
  }
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
logger.level = process.argv[3]; // trace debug info warn error fatal

const contents = fs.readFileSync(filename, 'utf8');
const program = contents.split(",").map(x => parseInt(x));
logger.trace(`read: pgm[0..1] = ${program[0]}, ${program[1]}`);

var ball = null;
var paddle = null;

const screen = new Array(100).fill(0).map(() => new Array(100).fill('-'));
var max_x = 0;
var max_y = 0;

program[0] = 2; // to play???

computer = new Computer(program);

var loop=0;
while( true ){

  const x = computer.run();
  if( x == null ){
    console.log("program ended at 1");
    break;
  }
  console.log("step one");

  const y = computer.run();
  if( y == null ){
    console.log("program ended at 2");
    break;
  }

  const tile_id = computer.run();
  if( result3 == null ){
    console.log("program ended at 3");
    break;
  }

  if( tile_id == BALL ){
    ball = [x,y];
    console.log(`${loop} B: ball: ${ball}  paddle:${paddle}`);
  }
  if( tile_id == PADDLE ){
    paddle = [x,y];
    console.log(`${loop} P: ball: ${ball}  paddle:${paddle}`);
  }

  if( ball && paddle ){
    if( ball[0] == paddle[0] ) { inputs=[0]; input_ptr=0; }
    else if( ball[0] > paddle[0] ) { inputs=[+1]; input_ptr=0; }
    else /* ball[0] < paddle[0] */ { inputs=[-1]; input_ptr=0; }
  }

  // When three output instructions specify X=-1, Y=0, 
  // the third output instruction is not a tile; the value 
  // instead specifies the new score to show in the segment display.

  if( x==-1 && y==0 ){
    console.log(`**** SCORE: ${output}`)
    // print(screen,max_x,max_y);
  } else {
    //console.log(`loop ${loop}: ${[x,y]} ${tile(tile_id)} ball=${ball} paddle=${paddle}`);
    screen[x][y] = tile(tile_id);
    if( x > max_x ) max_x = x;
    if( y > max_y ) max_y = y;
  }
}

console.log([max_x,max_y]);

// Part One - Your puzzle answer was 291.
const cnt = count(_.flatten(screen),tile(BLOCK));
console.log(cnt)
