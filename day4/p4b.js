var _ = require('lodash');
var assert = require('assert');

function has_decrease(arr){
  for(var i=0; i<5; i++){
    if( arr[i] > arr[i+1] ) return true;
  }
  return false;
}

assert( has_decrease("129945") == true )
assert( has_decrease("129999") == false )

function has_double(str){
  for(var digit=0; digit<10; digit++){
    const patt2 = new RegExp(digit+"{2}" );
    const res2 = patt2.test(str);
    const patt3 = new RegExp(digit+"{3}" );
    const res3 = patt3.test(str);
    if( res2 && !res3 ){
      // found a double that is not a part of a triple
      return true;
    }
  }
  return false; // no such match was found
}

assert( has_double("129945") == true )
assert( has_double("129995") == false )

function is_valid(number){
  // Two adjacent digits are the same (like 22 in 122345).
  // But... that double is not part of a triple
  if( !has_double(number.toString()) ) return 0;

  // Going from left to right, the digits never decrease; they only 
  // ever increase or stay the same (like 111123 or 135679).
  if( has_decrease(number.toString()) ) return 0;

  return 1;
}

// 112233 meets these criteria because the digits never decrease and all repeated digits are exactly two digits long.
// 123444 no longer meets the criteria (the repeated 44 is part of a larger group of 444).
// 111122 meets the criteria (even though 1 is repeated more than twice, it still contains a double 22).

assert( is_valid(112233) == 1 )
assert( is_valid(123444) == 0 )
assert( is_valid(111122) == 1 )

const start = 347312;
const finish = 805915;
const range = _.range(start, finish+1);
const count = _.sum(range.map(x => is_valid(x)))

console.log(`${count} numbers are valid`);
