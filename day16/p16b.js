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
  // console.log(JSON.stringify(a),JSON.stringify(b))
  return JSON.stringify(a)==JSON.stringify(b)
}

function as_str(arr){
  return arr.map(x=>x.toString()).join("")
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
    if( index%100 == 0 ) console.log(index);
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

function get_digit(signal, n){
  // console.log("get_digit", n, as_str(signal), signal[0])
  // get the n-th new digit by applying the pattern to 
  // all the digits of the signal; the pattern depends
  // on the n... the nth pattern is: 0n-1,1n,0n,-1n,0n... 
  // repeated.  note the very first is different.
  // i is the position in the pattern/signal
  var total = 0;
  const limit = signal.length;
  // apply the very first zero pattern
  // by skipping forward to the 
  var i = n-1; // first 1
  main: while( i<limit ){
    // apply the 1 pattern
    for( var j=0; j<n; j++ ){
      total += signal[i]
      // console.log(i, "+i=", signal[i]);
      i++;
      if( i >= limit ) break main;
    }
    if( i>= limit ) break main;

    // apply the 0 pattern
    // by just skipping forward
    i += n;
    if( i>= limit ) break main;

    // apply the -1 pattern
    for( var j=0; j<n; j++ ){
      total -= signal[i]
      // console.log(i, "-i=", -signal[i]);
      if( ++i >= limit ) break main;
    }
    if( i>= limit ) break main;
    // apply the 0 pattern
    i += n;
    if( i>= limit ) break main;
  }
  // console.log("total", total, Math.abs(total%10));
  return Math.abs(total%10);
}

function new_apply_pattern(signal){
  const result = [];
  for( var d=0; d<signal.length; d++ ){
    if( d%10000 == 0 ) console.log(d);
    result[d] = get_digit(signal,d+1);
  }
  return result;
}

const test1a = apply_pattern(base_pattern,[1,2,3,4,5,6,7,8]);
assert( same(test1a, [4,8,2,2,6,1,5,8]) );
const test1b = new_apply_pattern([1,2,3,4,5,6,7,8]);
assert( same(test1b, [4,8,2,2,6,1,5,8]) );

const test2a = apply_pattern(base_pattern,test1a);
assert( same(test2a, [3,4,0,4,0,4,3,8]) );
const test2b = apply_pattern(base_pattern,test1b);
assert( same(test2b, [3,4,0,4,0,4,3,8]) );

filename = process.argv[2];
logger.level = process.argv[3];
fs.readFile(filename, 'utf8', function(err, contents) {
  const lines = contents.split("\n");
  const count = parseInt(lines[0]);
  const repeats = parseInt(lines[1]);
  const answer = lines[2]; // string
  const offset = parseInt(lines[3]);

  console.log(count, answer, repeats, offset);

  const text = lines[4].repeat(repeats);
  var signal = text.split("").map(x=>parseInt(x));
  
  var total_secs_so_far = 0;
  for( var phase=0; phase<count; phase++ ){
    console.log("phase",phase);
    const start_of_loop = Date.now();
    signal = new_apply_pattern(signal);
    const secs = (Date.now() - start_of_loop)/1000;
    total_secs_so_far += secs;
    const average = total_secs_so_far / (phase+1);
    console.log(average);
  }
  console.log("phase",count);
  const result = signal.slice(offset,8).map(x=>x.toString()).join("");
  console.log(result,answer);
});
