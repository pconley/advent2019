var _ = require('lodash');
var fs = require('fs');
var assert = require('assert');

function get_path(name, data){
  const path = [];
  var x = name;
  while( x != "COM" ){
    path.push(x);
    x = data[x];
  }
  path.push("COM");
  return path;
}

function part1(data){
  var total = 0;
  _.each(data,(value,key) => {
    const count = get_path(key,data).length;
    // note that the path includes the key
    total += count-1;
  });
  return total;
}

function distance(a,b,path){
  console.log("dist: ",a,b,path);
  const pa = path.indexOf(a);
  const pb = path.indexOf(b);
  return pb-pa-1;
}

filename = process.argv[2];
fs.readFile(filename, 'utf8', function(err, contents) {
    const lines = contents.split("\n");
    // console.log(lines);
    data = {};
    lines.map(line=>{
      const parts = line.split(")");
      data[parts[1]] = parts[0];
    });
    // console.log(data);
    // PART ONE
    var total = part1(data);
    console.log("total = ", total);
    // PART TWO
    const san = get_path("SAN",data);
    const you = get_path("YOU",data);
    console.log(you);
    console.log(san);
    var common;
    for( var i=0; i<1000; i++ ){
      s = san.length - i - 1;
      y = you.length - i - 1;
      console.log(san[s],you[y]);
      if( san[s] == you[y] ){
        common=san[s];
      } else {
        break
      }
      if( s <= 0 ) break;
      if( y <= 0 ) break;
    }
    // the common point furthest out
    console.log("common",common);
    const ds = distance("SAN",common,san);
    const dy = distance("YOU",common,you);
    console.log(dy, "+", ds, "=", dy+ds);

});
