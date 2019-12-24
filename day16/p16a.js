var _ = require('lodash');
var fs = require('fs');
var assert = require('assert');
var Combinatorics = require('js-combinatorics');

var log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = 'debug'; // trace; debug; info, warn; error; fatal

function count(layer,val){
    return _.sum(layer.map(x=>x==val?1:0));
}

function same(a,b){
  console.log(JSON.stringify(a),JSON.stringify(b))
  return JSON.stringify(a)==JSON.stringify(b)
}

function print(lines){
  lines.forEach(line => { console.log(line) });
}

function range(a,b){
  const inc = b>a ? 1 : -1 ;
  return _.range(a,b+inc,inc);
}

assert(same(range(2,4),[2,3,4]))
assert(same(range(4,2),[4,3,2]))

const base_pattern = [0, 1, 0, -1];

function get_pattern(base,n,size){
  // console.log("size",size,n,base);
  pattern = [];
  var m = 0;
  while(m < size+1){
    for( var i=0; i<base.length; i++ ){
      for( var j=0; j<n; j++ ){
        pattern.push(base[i]);
        // console.log(i,j,m, base[i]);
        if( m++ >= size+1 ) break;
      }
      if( m >= size+1 ) break;
    }
  }
  // but drop the very first digit
  return pattern.slice(1,size+1);
}

assert( same(get_pattern(base_pattern,2,10), [0,1,1,0,0, -1,-1,0,0,1 ]));
assert( same(get_pattern(base_pattern,3,20), [0,0,1,1,1, 0,0,0,-1,-1, -1,0,0,0,1, 1,1,0,0,0]));

function apply_pattern(base_pattern, signal){
  // console.log("apply pattern",base_pattern,signal);
  const result = [];
  signal.forEach((digit,index)=>{
    const pattern = get_pattern(base_pattern,index+1,signal.length);
    // console.log(digit, pattern);
    // apply pattern to the signal
    var total = 0;
    for( var s=0; s<signal.length; s++ ){
      // console.log(`${s}: ${signal[s]} * ${pattern[s]}`);
      total += signal[s]*pattern[s];
    }
    result.push(Math.abs(total%10));
  });
  return result;
}

const test1 = apply_pattern(base_pattern,[1,2,3,4,5,6,7,8]);
assert( same(test1, [4,8,2,2,6,1,5,8]) );
const test2 = apply_pattern(base_pattern,test1);
assert( same(test2, [3,4,0,4,0,4,3,8]) );

filename = process.argv[2];
logger.level = process.argv[3];
fs.readFile(filename, 'utf8', function(err, contents) {
  const lines = contents.split("\n");
  const count = parseInt(lines[0]);
  const answer = lines[1];
  var signal = lines[2].split("").map(x=>parseInt(x));

  // console.log(lines[0], answer);
  // console.log(lines[1], signal);

  for( var phase=0; phase<count; phase++ ){
    console.log("phase",phase,signal.map(x=>x.toString()).join(""));
    signal = apply_pattern(base_pattern, signal);
  }
  console.log("phase",count,signal.map(x=>x.toString()).join(""));
  const result = signal.slice(0,8).map(x=>x.toString()).join("");
  console.log(result,answer);
  assert( result == answer );

});
