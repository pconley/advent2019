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

function is_dead_end(lines,r,c){
  if( lines[r][c] != '.' ) return false;
  // if 3 of 4 sides are # then dead end
  const sides = [ [],[],[],[] ]

}

filename = process.argv[2];
logger.level = process.argv[3];
fs.readFile(filename, 'utf8', function(err, contents) {
  const lines = contents.split("\n");
  const dots = count(contents.split(""),'.');
  console.log(lines.join("\n"));
  console.log("dots=",dots);

  console.log("dots=",count(contents.split(""),'.'));
  for( var r=1; r<lines.length-1; r++ ){
    for( var c=1; c<lines[0].length; c++ ){
      if( is_dead_end(lines,r,c) ) lines[r][c] = '#'
    }
  }
  console.log("dots=",count(contents.split(""),'.'));
});
