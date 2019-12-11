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

function blocked(data,p1,p2){
  const [x0,y0] = p1;
  const [xx,yy] = p2;
  logger.trace("can",[x0,y0],"see",[xx,yy],"?");
  
  const xs = range(x0,xx);
  const ys = range(y0,yy);

  const target_slope = (xx-x0)/(yy-y0);
  logger.trace("target slope",target_slope);

  var _blocked = false;
  xs.forEach(x=>{
    ys.forEach(y=>{
      if( (x==x0 && y==y0) || (x==xx && y==yy) ){
        logger.trace("endpoint",[x,y]);
      } else if( data[x][y] == '.' ){ 
        logger.trace("=empty==",[x,y]);
      } else {
        const point_slope = (x-x0)/(y-y0);
        logger.trace("consider",[x,y],data[x][y],[(x-x0),(y-y0)],point_slope);
        if( point_slope == target_slope ){
          // this point on the line between p1,p2
          logger.trace("block found",[x,y],data[x][y]);
          _blocked = true; 
        }
      }
    })
  })
  return _blocked;
}

function discover(data, row, col){
  logger.trace("discover",row,col)
  var count = 0;
  const rows = data.length;
  const cols = data[0].length;
  for( var r=0; r<rows; r++ ){
    for( var c=0; c<cols; c++ ){
      if( r== row && c== col ) continue;
      if( data[r][c] != "#" ) continue;
      const b = blocked(data,[row,col],[r,c]);
      logger.trace([r,c],data[r][c],b?"blocked":"")
      if( !b ) count++;
    }
  }
  return count;
}

function scan(data){
  console.log("scan");

  var counts = new Array(data[0].length); 
  for (var i=0; i<data.length; i++) { 
    counts[i] = new Array(data[0].length); 
  }

  const rows = data.length;
  const cols = data[0].length;
  var biggie = 0;
  var position = [];
  for( var r=0; r<rows; r++ ){
    for( var c=0; c<cols; c++ ){
      if( data[r][c] != "#" ){
        counts[r][c] = 0;
      } else {
        const count = discover(data,r,c);
        counts[r][c] = count;
        if( count > biggie ){
          biggie = count;
          position = [c,r]; // NOTE THE REVERSAL
        }
        console.log("scan",[r,c],count);
      }
    }
  }
  print(counts);
  console.log("biggie=",biggie,"at",position);
  return [biggie,position]
}

filename = process.argv[2];
fs.readFile(filename, 'utf8', function(err, contents) {
  const lines = contents.split("\n");
  const expects = lines[0].split(" ").map(x=>parseInt(x));
  console.log(lines[0], expects);

  const data = _.slice(lines,1);
  const tall = data.length;
  const wide = data[0].length;
  console.log(tall, wide, data[0]);
  print(data);

  var count = discover(data, 2, 1); // row, col
  console.log("count=",count);

  var b = blocked(data,[2,1],[2,3]);
  console.log("blocked=",b);

  logger.level = 'debug';
  const [biggie, position] = scan(data);
  console.log(biggie,position);
  assert( biggie == expects[0] )
  assert( same(position,[expects[1],expects[2]]) )
});
