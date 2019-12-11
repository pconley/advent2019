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
  lines.forEach(line => { console.log(line.join("")) });
}

function range(a,b){
  const inc = b>a ? 1 : -1 ;
  return _.range(a,b+inc,inc);
}

assert(same(range(2,4),[2,3,4]))
assert(same(range(4,2),[4,3,2]))

function slope(p1,p2){
  const [x1,y1] = p1;
  const [x2,y2] = p2;
  return(x1-x2)/(y1-y2);
}

function blocked(data,p1,p2){
  const [x0,y0] = p1;
  const [xx,yy] = p2;
  logger.trace("can",[x0,y0],"see",[xx,yy],"?");
  
  const xs = range(x0,xx);
  const ys = range(y0,yy);

  const target_slope = slope(p2,p1);
  logger.trace("target slope",target_slope);

  var _blocked = false;
  xs.forEach(x=>{
    ys.forEach(y=>{
      if( (x==x0 && y==y0) || (x==xx && y==yy) ){
        logger.trace("endpoint",[x,y]);
      } else if( data[x][y] == '.' ){ 
        logger.trace("=empty==",[x,y]);
      } else {
        const point_slope = slope([x,y],p1);
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
  var visible = [];
  const rows = data.length;
  const cols = data[0].length;
  for( var r=0; r<rows; r++ ){
    for( var c=0; c<cols; c++ ){
      if( r== row && c== col ) continue;
      if( data[r][c] != "#" ) continue;
      const _blocked = blocked(data,[row,col],[r,c]);
      logger.trace([r,c],data[r][c],_blocked?"blocked":"")
      if( _blocked ){
        // ignore
      } else{ 
        // there were no blocker, so this is visible
        count++; 
        visible.push([r,c,direction(row,col,r,c)]);
      }
    }
  }
  logger.trace("discover: ", visible.length, visible);
  return [count,visible];
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
  const visible = [];
  for( var r=0; r<rows; r++ ){
    for( var c=0; c<cols; c++ ){
      if( data[r][c] != "#" ){
        counts[r][c] = 0;
      } else {
        const [count,vs] = discover(data,r,c);
        counts[r][c] = count;
        if( count > 0 ){
          visible.push([r,c]);
        }
        if( count > biggie ){
          biggie = count;
          position = [r,c]; 
        }
        console.log("scan",[r,c],count);
      }
    }
  }
  print(counts);
  console.log("biggie=",biggie,"at",position);
  return [biggie,position,visible]
}

function direction(x0, y0, x1, y1 ){
  deltaX = x1 - x0;
  deltaY = y1 - y0;
  var radians = Math.atan2(y1-y0, x1-x0);
  // console.log("direction:", x0, y0, x1, y1, [deltaX, deltaY], radians);
  return radians;
}

filename = process.argv[2];
fs.readFile(filename, 'utf8', function(err, contents) {
  const lines = contents.split("\n");
  const expects = lines[0].split(" ").map(x=>parseInt(x));
  console.log(lines[0], expects);

  var data = []; 
  for (var i=1; i<lines.length; i++) { 
    data.push(lines[i].split(""))
  }
  print(data)

  const tall = data.length;
  const wide = data[0].length;
  console.log(tall, wide, data[0]);

  logger.level = 'debug';

  // var [count,vs] = discover(data, 2, 1); // row, col
  // console.log("count=",count);

  // var b = blocked(data,[2,1],[2,3]);
  // console.log("blocked=",b);

  const [biggie, position,visible] = scan(data);
  console.log("BIGGIE:",biggie,position);

  var zaps = 0;
  var saved = [];

  for( var loop=0; loop<20; loop++){
    console.log(`\n*****LOOP ${loop} TOP`,position)
    print(data);

    const [cnt,vs] = discover(data,...position);
    // console.log("loop:", cnt, vs);

    if( cnt <= 0 ) break;

    vs.sort((a, b) => b[2]-a[2]);
    // console.log("visible sorted",vs);
    // remove from data in that order
    vs.forEach(element=>{
      // console.log(element);
      const [r,c,d] = element;
      data[r][c] = '.';
      zaps++;
      // report as C,R
      console.log(zaps,"zap",[c,r])
      if (zaps == 200) saved = [c,r];
    });
  }
  console.log("200th zap = ", saved);
});
