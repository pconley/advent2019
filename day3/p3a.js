var fs = require('fs');
var assert = require('assert');

function mdist(x1,y1,x2,y2){
    // calc manhattan distance
    const x = Math.abs(x1-x2);
    const y = Math.abs(y1-y2);
    console.log(x,y,x+y);
    return x+y;
}

const origin = [100,100]; // does not really matter

assert( mdist(...[1,6],...[5,5]) == 4+1 );

// console.log(process.argv);
filename = process.argv[2];
fs.readFile(filename, 'utf8', function(err, contents) {
  const points = {}
  const lines = contents.split("\n");
  lines.forEach(line =>{
    console.log(line);
    const moves =  line.split(",");
    var pos = origin; // x, y
    console.log(pos)
    moves.forEach(move => {
      console.log(move[0], parseInt(move.substring(1)));
      const dir = move[0];
      const dist = move.substring(1);
      for( var i=1; i<=dist; i++){
        if( dir == 'U' ) pos = [pos[0],pos[1]+1];
        if( dir == 'D' ) pos = [pos[0],pos[1]-1];
        if( dir == 'R' ) pos = [pos[0]+1,pos[1]];
        if( dir == 'L' ) pos = [pos[0]-1,pos[1]];
        if( !points[pos] ) points[pos] = 0;
        // next line is the mistake that counts any second visit
        // to the position... including a wire crossing itself
        points[pos] += 1;
      }
    });
  });

  console.log("intersections...");
  var nearest = Number.MAX_SAFE_INTEGER;
  for (const p in points) {
    if( points[p] > 1 ){
      // not sure why the p is a string...
      pos = p.split(",").map(x=>parseInt(x))
      console.log(pos)
      const dist = mdist(...origin,...pos)
      console.log(`${p}: ${points[p]} dist=${dist}`);
      nearest = Math.min(nearest,dist);
    }
  }
  console.log(nearest)
  // test cases
  if( filename == "p3-1.data") assert( nearest == 6 )
  if( filename == "p3-2.data") assert( nearest == 159 )
  if( filename == "p3-3.data") assert( nearest == 135 )
});
