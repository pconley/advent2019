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

function print(lines){
  lines.forEach(line => { console.log(line) });
}

function range(a,b){
  const inc = b>a ? 1 : -1 ;
  return _.range(a,b+inc,inc);
}

function reverse(deck){
  const d = _.clone(deck);
  _.reverse(d);
  return d;
}

function cut(deck,n){
  // To cut N cards, take the top N cards off the top of the deck 
  // and move them as a single unit to the bottom of the deck
  if( n<0 ) n=deck.length+n;
  return _.drop(deck,n).concat(_.take(deck,n))
}

function increment(deck,n){
  const result = _.clone(deck);
  var j = 0;
  for( var i=0; i<deck.length; i++ ){
    result[j] = deck[i];
    j = (j+n) % deck.length;
    // console.log(j);
  }
  return result;
}

const deck10 = [0,1,2,3,4,5,6,7,8,9];

console.log("reverse",reverse(deck10));
assert( same(reverse(deck10),[9,8,7,6,5,4,3,2,1,0]));
console.log("cut",cut(deck10,3));
assert( same(cut(deck10,3),[3,4,5,6,7,8,9,0,1,2]));
console.log("cut",cut(deck10,-3));
assert( same(cut(deck10,-3),[7,8,9,0,1,2,3,4,5,6]));
console.log("incr",increment(deck10,3));
assert( same(increment(deck10,3),[0,7,4,1,8,5,2,9,6,3]));

filename = process.argv[2];
logger.level = process.argv[3];
fs.readFile(filename, 'utf8', function(err, contents) {
  const lines = contents.split("\n");
  const expect = lines[0].split(" ").map(x=>parseInt(x));
  console.log("expect:",expect);
  const instructions = lines.slice(1);
  const size = 10007; //expect.length;
  var deck = range(0,size-1);
  console.log("start deck",deck);
  for( i in instructions ){
    const text = instructions[i];
    console.log("instruction",text);
    if( text.startsWith("deal with increment") ){
      const amt = parseInt(text.slice(20));
      deck = increment(deck,amt);
    } else if( text.startsWith("deal into") ){
      deck = reverse(deck);
    } else if( text.startsWith("cut") ){
      const amt = parseInt(text.slice(4));
      deck = cut(deck,amt);
    }
    console.log("new deck",deck);
  }
  // assert( same(expect,deck) );
  for( var i=0; i<size; i++ ){
    if( deck[i] == 2019 ){
      console.log(i,deck[i]);
    }
  }
});
