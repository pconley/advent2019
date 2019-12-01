var fs = require('fs');
var assert = require('assert');

function get_fuel(mass){
  // take its mass, divide by three, round down, and subtract 2
  return Math.floor(mass/3.0) - 2
}

assert(get_fuel(12) == 2)
assert(get_fuel(14) == 2)
assert(get_fuel(1969) == 654)
assert(get_fuel(100756) == 33583)

function get_with_added(mass){
  // get the fuel for the mass... 
  // and the fuel for the fuel, and so on
  const fuel_for_mass = get_fuel(mass)
  var total_added_fuel = 0
  var incr_fuel = get_fuel(fuel_for_mass);
  while( incr_fuel > 0 ){
    total_added_fuel += incr_fuel;
    // console.log(incr_fuel, total_added_fuel);
    incr_fuel = get_fuel(incr_fuel);
  }
  return fuel_for_mass+total_added_fuel;
}

// So, the total_mass fuel required for a module of mass 1969 is 
// 654 + 216 + 70 + 21 + 5 = 966.

assert(get_with_added(1969) == 654 + 216 + 70 + 21 + 5)

// The fuel required by a module of mass 100756 and its fuel is: 
// 33583 + 11192 + 3728 + 1240 + 411 + 135 + 43 + 12 + 2 = 50346.

assert(get_with_added(100756) == 33583 + 11192 + 3728 + 1240 + 411 + 135 + 43 + 12 + 2)

function accumulate_fuel(acc, mass){
  // this form designed for use with reduce
  return acc+get_with_added(mass);
}
 
// console.log(process.argv);

filename = process.argv[2];

fs.readFile(filename, 'utf8', function(err, contents) {
    // console.log(">>",contents);
    const lines = contents.split("\n");
    const masses = lines.map(x => parseInt(x));
    const total = masses.reduce(accumulate_fuel,0);
    console.log(total);
    assert( total == 4940279 );
});
