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

function is_letter(char){
  return !( char===" " || char=='#' || char=='.' || char=='@' );
}

class Pos {
  constructor(r,c) {
    this.r = r;
    this.c = c;
  }
}

class Matrix {
  constructor(rows){
    this.rows = rows;
    this.tall = rows.length;
    this.wide = rows[0].length;
  }
  v(r,c){
    try {
      return rows[r][c];
    } catch {
      return null;
    }
  }
  is_valid(r,c){
    return this.v(r,c) != null;
  }
}

class Maze {
  constructor(contents) {
    this.lines = contents.split("\n").map(x=>x.split(''));
    this.tall = this.lines.length;
    this.wide = this.lines[0].length;
    this.find_inside();
    console.log("inside:",this.inside_start,this.inside_finish);
    this.portals = {}
    this.scan(); // alters portal
    console.log(Object.keys(this.portals).length,"portals",this.portals);
  }

  find_inside(){
    this.inside_start = 0;
    this.inside_finish = 0;
    for( var r=3; r<this.tall-2; r++){
      for( var c=3; c<this.wide-2; c++){
        // we are inside the margin area...
        if( this.inside_start==0 && this.lines[r][c] == ' ' ) this.inside_start=[r,c];
        if( this.lines[r][c] == ' ' ) this.inside_finish = [r,c];
      }
    }
  }

  as_str(){
    var text = "";
    text += `tall=${this.tall} wide=${this.wide}\n`;
    text += `inside=${this.inside_start} ${this.inside_finish}\n`;
    text += this.lines.map((x,i)=>`${i%10}: `+x.join("")).join("\n");
    return text;
  }

  add_from_row(a,b,r,c){
    this.add(this.lines[r][a]+this.lines[r][b],[r,c])
  }
  add_from_col(a,b,r,c){
    this.add(this.lines[a][c]+this.lines[b][c],[r,c])
  }
  add(name, pos){
    // console.log("add",name,pos);
    // console.log(this.portals)
    if( _.includes(_.keys(this.portals), name) ){
      // console.log("add p2", name, pos);
      // add the second position
      this.portals[name] = [this.portals[name],pos]
    } else {
      // console.log("add p1");
      // add the first position
      this.portals[name] = pos
    }
  }

  scan(){
    // 4 possible locations for . in the
    var i = 2;                       // AB.
    var s = this.inside_start[1]-1;  // .AB
    var f = this.inside_finish[1]+1; // AB.
    var e = this.wide-3;             // .AB
    for(var r=2; r<this.tall-2; r++ ){
      const row = this.lines[r];
      if( is_letter(row[i-1]) ) this.add_from_row(i-2,i-1,r,i); // AB.
      if( is_letter(row[s+1]) ) this.add_from_row(s+1,s+2,r,s); // .AB
      if( is_letter(row[f-1]) ) this.add_from_row(f-2,f-1,r,f); // AB.
      if( is_letter(row[e+1]) ) this.add_from_row(e+1,e+2,r,e); // .AB    
    }
    // 4 possible locations for . in the
    // .   A
    // A   B
    // B   .
    i = 2;         
    s = this.inside_start[0]-1;
    f = this.inside_finish[0]+1;
    e = this.tall-3;
    for(var c=2; c<this.wide-2; c++ ){
      if( is_letter(this.lines[i-1][c]) ) this.add_from_col(i-2,i-1,i,c); // AB.
      if( is_letter(this.lines[s+1][c]) ) this.add_from_col(s+1,s+2,s,c); // .AB
      if( is_letter(this.lines[f-1][c]) ) this.add_from_col(f-2,f-1,f,c); // AB.
      if( is_letter(this.lines[e+1][c]) ) this.add_from_col(e+1,e+2,e,c); // .AB    
    }
  }
}

function neigbors(data, pos){
  const [r,c] = pos;
  const results = [];
  const possible = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]];
  possible.forEach(x=>{
    const [xr,xc] = x;
    try {
      const v = data[xr][xc]; // may throw
      if( v=="." || is_letter(v) ){
        if( v!='A' && v!='Z' ) results.push(x);
      }
    } catch {
      // ignore out of bounds points
    }
  });
  return results;
}

var q = [];
var finish = [];
var smallest = 999999;
var mazes = []; // copies for each depth
var master_maze = null; 

function is_portal(pos){
  // return the other end... or false
  for( p in master_maze.portals ){
    const locs = master_maze.portals[p];
    if( same(pos,locs[0]) ) return locs[1];
    if( same(pos,locs[1]) ) return locs[0];
  }
  return false;
}

function is_outside(r,c){
  if( c==2 || c==master_maze.tall-3 ) return true;
  if( r==2 || c==master_maze.wide-3 ) return true;
  return false;
}

function visit(data,pos,depth,dist,ignore_portals){
  console.log(`visit: depth=${depth} pos=[${pos}] dist=${dist}`)
  const [r,c] = pos;
  // mark as visited
  data[r][c] = '@';
  // push each neigbor on q
  var ns = neigbors(data,pos);
  ns.forEach(n=>{ 
    const [_r,_c] = n;
    if( ignore_portals && is_letter(data[_r][_c]) ){
      // ignore
    } else {
      q.push([n,depth,dist+1] );
    }
  });
}


function worker(){
  const top = q.shift();
  const [pos,depth,dist] = top;
  console.log(`worker: depth=${depth} pos=[${pos}] dist=${dist}`);

  const [r,c] = pos;
  const maze = mazes[depth];
  const data = maze.lines;
  const value = data[r][c];
  // console.log(`worker: r=${r} r=${c} value=${value}`);
  if( depth==0 && same(pos,finish) ){ 
    console.log("found z on level zero");
    if( dist < smallest ) smallest=dist;
    return;
  }
  const other_end = is_portal(pos);
  if( other_end ){
    console.log("found portal ENTRANCE at",pos,"to",other_end);
    data[r][c] = '@'; // visited this end
    const d = is_outside(r,c) ? depth-1 : depth+1;
    if( !mazes[d] ) mazes.push(_.clone(master_maze,true));
    visit(mazes[d].lines,other_end,d,dist+1, true);
    return;
  }
  if( is_letter(value) ){
    // console.log("ignore portal at",pos,value);
    return; // abort for now
  }
  visit(data,pos,depth,dist, false);
}

function solver(){
  const depth = 0;
  const maze = mazes[depth];
  const start = maze.portals["AA"];
  finish = maze.portals["ZZ"]; // global
  console.log("start",start);
  console.log("finish",finish);

  q.push([start,0,0]); // q has [pos,depth,dist]
  while( q.length>0 ){
    worker();
  }
  return smallest;
}

filename = process.argv[2];
logger.level = process.argv[3];
fs.readFile(filename, 'utf8', function(err, contents) {
  master_maze = new Maze(contents);
  mazes.push(_.clone(master_maze, true));

  console.log(master_maze.as_str());

  const smallest = solver();
  console.log("smallest=",smallest);
  // console.log(maze.as_str());
});
