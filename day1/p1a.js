var fs = require('fs');
var assert = require('assert');

// console.log(process.argv);

function calc(mass){
  // take its mass, divide by three, round down, and subtract 2
  return Math.floor(mass/3.0)-2
}

assert(calc(12),2)
assert(calc(14),2)
assert(calc(1969),654)
assert(calc(100756),33585)

filename = process.argv[2];

fs.readFile(filename, 'utf8', function(err, contents) {
    // console.log(">>",contents);
    var total = 0;
    var lines = contents.split("\n");
    lines.forEach(line =>{
      mass = parseInt(line);
      fuel = calc(mass);
      total += fuel;
      // console.log(mass, fuel, total);
    })

    console.log(total);
});
 

