var _ = require('lodash');
var fs = require('fs');
var assert = require('assert');
var Combinatorics = require('js-combinatorics');

// var mathjs = require('mathjs');
const { lcm } = require('mathjs')

// import { lcm } from 'mathjs'

var log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = 'debug'; // trace; debug; info, warn; error; fatal

function count(layer,val){
    return _.sum(layer.map(x=>x==val?1:0));
}

function sumprod(arr1,arr2){
  var result = 0;
  for (var i=0; i < arr1.length; i++) {
    result += (arr1[i] * arr2[i]);
  }
  return result;
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

function  apply_grav(d,pairs,velocities,moons){
  // IMPORTANT: only applying the changes in a sigle dimension
  pairs.forEach(pair=>{
    const [n,m] = pair;
    const [m1,m2] = [moons[n],moons[m]];
    // logger.trace("compare",m1,m2);
    if(m1[d] == m2[d]){
      // no velo change
    } else if( m1[d]>m2[d] ){
      // logger.trace(`${pair}: m1>m2 i=${i} `)
      velocities[n][d]--; velocities[m][d]++;
    } else /* m2>m1 */ {
      // logger.trace(`${pair}: m2>m1 i=${i} `)
      velocities[m][d]--; velocities[n][d]++;
    }
  });
}

function  apply_velos(d,velos,moons){
  // IMPORTANT: only applying the changes in a sigle dimension
  // adjust the positions of the moons
  // based on their current velocities
  for( var i=0; i<moons.length; i++ ){
    moons[i][d] += velos[i][d];
  }
}

function potential_energy(moons){
  // console.log(moons);
  // a moon's potential energy is the sum of the absolute 
  // values of its x, y, and z position coordinates
  return moons.map(m=>_.sum(m.map(x=>Math.abs(x))))
}

function kinetic_energy(velos){
  // console.log(velos);
  // A moon's kinetic energy is the sum of the absolute 
  // values of its velocity coordinates.
  return velos.map(m=>_.sum(m.map(x=>Math.abs(x))))
}

function calc_energy(moons,velos){
  const pe = potential_energy(moons);
  // logger.debug(`potential energy ${pe} = ${_.sum(pe)}`)
  const ke = kinetic_energy(velos);
  // logger.debug(`kinetic energy ${ke} = ${_.sum(ke)}`)
  return sumprod(pe,ke);
}

function search(states,state){
  // logger.trace("search for",state);
  for( var i=0; i<states.length; i++ ){
    // logger.trace(">>>",states[i]);
    if( state == states[i] ) return true;
  }
  return false;
}

function scan(dim, moons, velocities ){

  // TODO: we could do this in a single pass; not 3 times

  pairs = []; // of indexes
  for( var i=0; i<moons.length; i++ ){
    for( var j=i+1; j<moons.length; j++ ){
      pairs.push([i,j])
    }
  }
  const start_state = JSON.stringify([moons,velocities]);
  console.log(dim,"start_state = ",start_state);
  var loop = 0;
  while( true ){
    loop++;
    apply_grav(dim,pairs,velocities,moons);
    apply_velos(dim,velocities,moons);
    const current_state = JSON.stringify([moons,velocities]);

    if( loop%10000 == 0 ) 
      console.log(`${loop} :: ${current_state}`);

    if( current_state == start_state ){
      console.log(`${dim} target found at loop ${loop}`);
      return loop;
    }
  }
}

// assert(lcm(100,90,80,7) == 25200); 
// assert(lcm(5,10,15,25) == 150);

filename = process.argv[2];
logger.level = process.argv[3];
fs.readFile(filename, 'utf8', function(err, contents) {
  const lines = contents.split("\n");
  const moons = lines.map(line=>line.split(" ").map(x=>parseInt(x)));
  const velocities = moons.map(x=>[0,0,0]);
  console.log("start moons",moons);
  console.log("start velos",velocities);

  const x = scan(0, moons, velocities );
  const y = scan(1, moons, velocities );
  const z = scan(2, moons, velocities );

  console.log("periods",x,y,z);

  console.log("LCM via math = ",lcm(x,y,z));
});

// data9 part1 energy= 6227
