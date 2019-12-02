var fs = require('fs');
var assert = require('assert');

function basicFuel(mass){
  // take its mass, divide by three, round down, and subtract 2
  return Math.floor(mass/3.0) - 2
}

assert(basicFuel(12) == 2)
assert(basicFuel(14) == 2)
assert(basicFuel(1969) == 654)
assert(basicFuel(100756) == 33583)

function totalFuel(mass){
  const fuel_for_mass = basicFuel(mass);
  if( fuel_for_mass <= 0 ) return 0;
  return fuel_for_mass + totalFuel(fuel_for_mass);
}

const accumulator = (acc,val,fun) => acc+fun(val);
const basic_func = (acc,val) => accumulator(acc,val,basicFuel)
const total_func = (acc,val) => accumulator(acc,val,totalFuel)

// So, the total_mass fuel required for a module of mass 1969 is 
// 654 + 216 + 70 + 21 + 5 = 966.
assert(totalFuel(1969) == 654 + 216 + 70 + 21 + 5)

// The fuel required by a module of mass 100756 and its fuel is: 
// 33583 + 11192 + 3728 + 1240 + 411 + 135 + 43 + 12 + 2 = 50346.
assert(totalFuel(100756) == 33583 + 11192 + 3728 + 1240 + 411 + 135 + 43 + 12 + 2)

// console.log(process.argv);
filename = process.argv[2];
fs.readFile(filename, 'utf8', function(err, contents) {
    const lines = contents.split("\n");
    const masses = lines.map(x => parseInt(x));

    // part one of the puzzle
    const result1 = masses.reduce(basic_func,0);
    console.log("basic result =",result1);
    assert( result1 == 3295424 );

    // part two of the puzzle
    const result2 = masses.reduce(total_func,0);
    console.log("total result =",result2);
    assert( result2 == 4940279 );
});
