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

var inputs = [];
var input_ptr = 0;
var output = 999;

function run(input, mem, pos, base){

  input_ptr = 0;
  inputs = [input];
  output = 998;

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

//==== MAINLINE ====//

function print(screen,orig,curr){
  const temp = _.cloneDeep(screen);
  const [r,c] = curr;
  temp[r][c] = "@";
  const [r2,c2] = orig;
  temp[r2][c2] = "o";
  const max_x = screen.length-1;
  const max_y = screen[0].length-1;
  for(var x=0; x<=max_x; x++ ){
    const row = temp[x].slice(0,max_y+1).join("");
    console.log(row);
  }
}


//north (1), south (2), and east (4)
const NORTH = 1;
const SOUTH = 2;
const WEST = 3;
const EAST = 4;

const DIRECTIONS = [1,2,3,4]; 

const OFFSET = [
  [ 0,0], 
  [-1,0], // north
  [+1,0], // south
  [0,-1], // east
  [0,+1], // west
]

function opposite(dir){
  switch (dir) {
    case NORTH: return SOUTH;
    case SOUTH: return NORTH;
    case EAST: return WEST;
    case WEST: return EAST;
  }
}

function apply(inval,outval,state,screen,r,c){
  const offset = OFFSET[inval];
  if( outval == WALL ){
    screen[r+offset[0]][c+offset[1]] = '#'
    // note: robot position does not change
  } else if( output == MOVED ){
    // screen[r][c] = '.'; // leave marker
    // and the robot moves, but move back
    state = run(opposite(inval),...state);
  } else if( output == OXYGEN ){
    console.log("OXYGEN2");
    // and the robot moves, but move back
    screen[r+offset[0]][c+offset[1]] = '*'
    state = run(opposite(inval),...state);
  } else {
    console.error("ERROR2");
  }
  return state;
}

function explore(screen,r,c){

  const rand = _.sampleSize(DIRECTIONS, 4);
  // console.log("explore: ",rand);

  for( x in rand ){
    const i = rand[x];
    const _r = r+OFFSET[i][0];
    const _c = c+OFFSET[i][1];
    if( screen[_r][_c] != "#" ){
      // found an empty space
      return i;
    }
  }
  // hmmmm.... no empty space
  for( x in rand ){
    const i = rand[x];
    const _r = r+OFFSET[i][0];
    const _c = c+OFFSET[i][1];
    if( screen[_r][_c] == "-" ){
      // console.log("BACKTRACK");
      // backtrack to a visited space
      return i;
    }
  }
  // hmmmm.... no empty space
  for( x in rand ){
    const i = rand[x];
    const _r = r+OFFSET[i][0];
    const _c = c+OFFSET[i][1];
    if( screen[_r][_c] == "." ){
      // console.log("BACKTRACK");
      // backtrack to a visited space
      return i;
    }
  }
  return 0;  // ERROR
}

function is_full(screen){
// rows 4 and 44
//                       1         2         3         444444    
//             012345678901234567890123456789012345678901234567890
// sample row "     #.......#...................#...#...#...#"
  for(var r=5; r<44; r++){
    for( var c=5; c<44; c++ ){
      if( screen[r][c] == ' ' ) return false;
    }
  }
  return true;
}

const WALL = 0;
const MOVED = 1;
const OXYGEN = 2;

filename = process.argv[2]; 
logger.level = process.argv[3]; // trace debug info warn error fatal

const contents = fs.readFileSync(filename, 'utf8');
const program = contents.split(",").map(x => parseInt(x));
const screen = new Array(50).fill(0).map(() => new Array(80).fill(' '));

const origin = [25,25];
var final = 0;
var [r,c] = origin; 
var mem = program.splice(0);
var state = [mem,0,0];

for( var loop=0; loop<2000000; loop++ ){

  // if( is_full(screen)) break

  // save the direction we want to go
  const input = explore(screen,r,c);

  // then probe at each of the 4 directions
  // but end up back the same place
  // for( d in DIRECTIONS ){
  //   const dir = DIRECTIONS[d];
  //   state = run(dir,...state);
  //   state = apply(dir, output, state, screen, r, c);
  // }

  // next take the previously saved step (input)
  state = run(input,...state);
  // console.log("result",result);
  if( state == null ){
    console.log(loop,"program ended");
    break;
  }
  // console.log("output=",output);
  if( output == WALL ){
    const offset = OFFSET[input];
    screen[r+offset[0]][c+offset[1]] = '#'
    // robot position does not change
  } else if( output == MOVED ){
    const current = screen[r][c];
    // console.log(loop,"MOVED",current,input,[r,c]);
    const offset = OFFSET[input];
    // leave a trail
    screen[r][c] = '.';
    // screen[r][c] = (current=='-')?'.':'-';
    // move the robot
    r += offset[0];
    c += offset[1];
  } else if( output == OXYGEN ){
    const offset = OFFSET[input];
    r += offset[0];
    c += offset[1];
    final = [r,c];
    screen[r][c] = "!";
    console.log(loop,"OXYGEN1",final);
  } else {
    console.error("ERROR");
    break; 
  }
}
print(screen,origin,final);
console.log("pos=",[r,c],"At pos=",screen[r][c]);
console.log("loop=",loop);
console.log("oxygen=",final);
