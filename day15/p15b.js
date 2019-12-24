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

//==== MAINLINE ====//

function print(screen){
  const max_x = screen.length-1;
  const max_y = screen[0].length-1;
  for(var x=0; x<=max_x; x++ ){
    const row = screen[x].slice(0,max_y+1).join("");
    console.log(row);
  }
}




function find(data,val){
  for( var r=0; r<data.length; r++){
    for( var c=0; c<data[0].length; c++ ){
      if( data[r][c] == val ) return [r,c];
    }
  }
  return null;
}

const q = [];
function shortest(data, origin){
  const [or, oc] = origin;
  q.push([or,oc,0]);
  while( q.length > 0 ){
    const [r,c,dist] = q.shift(); // top of queue
    const ns = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]
    for( var n in ns ){
      const [_r,_c] = ns[n];
      try {
        const x = data[_r][_c];  // may throw
        if( x == '@' ) return dist+1;
        if( x == '#' ) {} // ignore
        if( x == '.' ) {} // ignore
        if( x == ' ' ){
          data[r][c] = '.'; // visited
          q.push([_r,_c,dist+1]);
        }
      } catch {
        // ignore out of bounds
      }
    }
  }
  return 0; // error!
}

filename = process.argv[2]; 
logger.level = process.argv[3]; // trace debug info warn error fatal

const contents = fs.readFileSync(filename, 'utf8');
const data = contents.split("\n").map(x=>x.split(""));

const origin = find(data,"o");
const target = find(data,"@");

print(data)
console.log("origin=",origin);
console.log("target=",target);

const result = shortest(data, origin )
print(data)
console.log("result = ", result);

