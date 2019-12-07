var fs = require('fs');
var assert = require('assert');

function mdist(x1,y1,x2,y2){
    // calc manhattan distance
    const x = Math.abs(x1-x2);
    const y = Math.abs(y1-y2);
    // console.log(x,y,x+y);
    return x+y;
}

const origin = [100,100]; // does not really matter

assert( mdist(...[1,6],...[5,5]) == 4+1 );

// console.log(process.argv);
filename = process.argv[2];
fs.readFile(filename, 'utf8', function(err, contents) {
  const points = {}
  const lines = contents.split("\n");
  lines.forEach((line,line_number) =>{
    console.log("line", line_number, line);
    const moves = line.split(",");
    var pos = origin; // x, y
    var mcount = 0;
    moves.forEach((move) => {
      const dir = move[0];
      const dist = move.substring(1);
      console.log(dir, dist);
      for( var i=1; i<=dist; i++){
        mcount += 1;
        if( dir == 'U' ) pos = [pos[0],pos[1]+1];
        if( dir == 'D' ) pos = [pos[0],pos[1]-1];
        if( dir == 'R' ) pos = [pos[0]+1,pos[1]];
        if( dir == 'L' ) pos = [pos[0]-1,pos[1]];
        if( !points[pos] ) points[pos] = [0,0];
        if( points[pos][line_number] == 0 ){
          // so we only mark the first visit
          points[pos][line_number] = mcount;
        }
      }
    });
  });

  console.log("intersections...");
  var fewest = Number.MAX_SAFE_INTEGER;
  var nearest = Number.MAX_SAFE_INTEGER;
  for (const p in points) {
    const [m1, m2] = points[p];
    if( m1>0 && m2>0 ){
      // not sure why the p is a string...
      const pos = p.split(",").map(x=>parseInt(x))
      const dist = mdist(...origin,...pos);
      const total_moves = m1+m2;
      console.log(`${p}: ${points[p]} dist=${dist}  moves=${total_moves}`);
      fewest = Math.min(fewest,total_moves);
      nearest = Math.min(nearest,dist);
    }
  }
  console.log(nearest,fewest)

  // expected results for the test cases
  if( filename == "p3-1.data") assert( nearest == 6 )
  if( filename == "p3-2.data"){
    assert( fewest == 610 );
    assert( nearest == 159 );
  }
  if( filename == "p3-3.data"){
    assert( fewest == 410 );
    assert( nearest == 135 );
  }
});
