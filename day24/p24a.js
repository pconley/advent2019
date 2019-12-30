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

function same(a,b){
  return a[0]==b[0] && a[1]==b[1]
}

//==== MAINLINE ====//

var planes = [];
var altered = [];

function print(data){
  const screen = _.cloneDeep(data);
  screen[2][2] = "?";
  const max_x = screen.length-1;
  const max_y = screen[0].length-1;
  for(var x=0; x<=max_x; x++ ){
    const row = screen[x].slice(0,max_y+1).join("");
    console.log(row);
  }
}

function is_top(r,c){ return r==0; }
function is_bottom(r,c){ return r==4; }
function is_left(r,c){ return c==0; }
function is_right(r,c){ return c==4; }
function is_center(r,c){ return (r==2)&&(c==2); }

function is_empty(plane){
  for( var r=0; r<plane.length; r++ ){
    for( var c=0; c<plane.length; c++ ){
      if( plane[r][c]=="#" ) return false
    }
  }
  return true;
}

function is_valid(l,r,c){
  if( l<0 ) return false;
  if( l>=planes.length ) return false;
  if( r==2 && c== 2 ) return false;
  if( r<0 || r>4 ) return false;
  if( c<0 || c>4 ) return false;
  return true;
}

function get_neighbors(l,r,c){
  ns = [];
  const N8 =  [l-1,1,2]; // from diagram
  const N12 = [l-1,2,1]; // from diagram
  const N14 = [l-1,2,3]; // from diagram
  const N18 = [l-1,3,2]; // from diagram
  // return the array of triples l,r,c
  [[l,r-1,c],[l,r+1,c],[l,r,c-1],[l,r,c+1]].forEach(x=>{
    if( is_valid(...x) ) ns.push(x);
  });
  // console.log("ns1:",[l,r,c],ns);
  if( is_top(r,c)    && is_valid(...N8) ) ns = _.concat(ns,[N8])
  if( is_bottom(r,c) && is_valid(...N18) ) ns = _.concat(ns,[N18])
  if( is_left(r,c)   && is_valid(...N12) ) ns = _.concat(ns,[N12])
  if( is_right(r,c)  && is_valid(...N14)) ns = _.concat(ns,[N14])
  // console.log("ns2:",ns);

  // also from diagram
  const L = [1,2];
  const N = [2,1];
  const H = [2,3];
  const R = [3,2];

  const next=l+1;

  if( same([r,c],L) ) ns = _.concat(ns,[ [next,0,0],[next,1,0],[next,2,0],[next,3,0],[next,4,0] ])
  if( same([r,c],N) ) ns = _.concat(ns,[ [next,0,4],[next,1,4],[next,2,4],[next,3,4],[next,4,4] ])

  // console.log("xxx",[r,c],H)
  if( same([r,c],H) ) ns = _.concat(ns,[ [next,0,0],[next,0,1],[next,0,2],[next,0,3],[next,0,4] ])
  if( same([r,c],R) ) ns = _.concat(ns,[ [next,4,0],[next,4,1],[next,4,2],[next,4,3],[next,4,4] ])

  return ns;
}

var x;

// Tile 19 has four adjacent tiles: 14, 18, 20, and 24.
// x = get_neighbors(5,3,3);
// console.log(x);

// Tile G has four adjacent tiles: B, F, H, and L.
// Tile D has four adjacent tiles: 8, C, E, and I.
// Tile E has four adjacent tiles: 8, D, 14, and J.
// Tile 14 has eight adjacent tiles: 9, E, J, O, T, Y, 15, and 19.
// x = get_neighbors(5,2,3);
// console.log(x);
// assert(x.length==8)
// Tile N has eight adjacent tiles: I, O, S, and five tiles within the sub-grid marked ?.


function adjacent(level,r,c){
  var count = 0;
  const ns = get_neighbors(level,r,c);
  // console.log("adj",[level,r,c],ns)
  for( n in ns ){
    const [nl, nr, nc] = ns[n];
    try {
      const value = planes[nl][nr][nc];
      if( value == "#" ){
        count += 1;
      }
    } catch {
      // ignore out of bounds
    }
  }
  return count;
}

function evaluate(level){
  console.log("evalutate level",level)
  const data = _.cloneDeep(planes[level]);
  for( var r=0; r<size; r++ ){
    for( var c=0; c<size; c++ ){
      // count of adjacent bugs
      const a = adjacent(level,r,c);
      // console.log("count = ",[level,r,c],a);
      // A bug dies (becoming an empty space) unless 
      // there is exactly one bug adjacent to it.
      if( data[r][c] == "#" && a != 1 ) data[r][c] = ".";
      // An empty space becomes infested with a bug 
      // if exactly one or two bugs are adjacent to it.
      if( data[r][c] == "." && (a==1||a==2) ) data[r][c] = "#";
    }
  }
  return data;
}

filename = process.argv[2]; 
logger.level = process.argv[3]; // trace debug info warn error fatal

const contents = fs.readFileSync(filename, 'utf8');
var  starter = contents.split("\n").map(x=>x.split(""));
var size =  starter.length; // 5x5
var line = ".".repeat(size).split(""); // array
var blank = _.range(size).map(x=>_.clone(line))

console.log("starter:")
print(starter)
console.log()

planes[0] = _.cloneDeep( starter);

// evaluate for a fixed amount of time
for( var loop=0; loop<10; loop++ ){
  // add any new planes we need
  if( !is_empty(_.last(planes)) ) planes.push(blank);
  if( !is_empty(_.first(planes)) ) planes.unshift(blank);
  // evaluate each of the layers
  console.log(`there are now ${planes.length} planes`)
  for( var level=0; level<planes.length; level++){
    console.log("before",level);
    print(planes[level]);
    altered[level] = evaluate(level);
    console.log("altered",level);
    print(altered[level]);
    // assert(true==false);
  }
  // then copy the layers back
  planes = _.cloneDeep(altered);
  // print(data);
}

console.log("\n**** final")
for(var l=0; l<planes.length; l++){
  console.log("layer",l);
  print(planes[l]);
}