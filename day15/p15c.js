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

function fill(data){
  var changed = false;
  const temp = _.cloneDeep(data); // change me
  for( var r=0; r<data.length; r++ ){
    for( var c=0; c<data[0].length; c++ ){
      if( data[r][c] == '@'){
        const ns = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]]
        for( n in ns ){
          const [nr, nc] = ns[n];
          try {
            const value = data[nr][nc];
            if( value == " " ){
              temp[nr][nc] = "@";
              changed = true;
            }
          } catch {
            // ignore out of bounds
          }
        }
      }
    }
  }
  return [temp,changed];
}

filename = process.argv[2]; 
logger.level = process.argv[3]; // trace debug info warn error fatal

const contents = fs.readFileSync(filename, 'utf8');
var data = contents.split("\n").map(x=>x.split(""));

const [or,oc] = find(data,"o");
data[or][oc] = ' '; // erase
const target = find(data,"@");

print(data)
console.log("target=",target);

// with each loop add ox to and space next ot ox

var changed = true;
for( var loop=0; loop<1000; loop++ ){
  [data,changed] = fill(data);
  print(data);
  if( !changed ) break;
}
console.log("loops = ",loop);