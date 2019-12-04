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
  // has a double that is not a part of a tripple
  for(var digit=0; digit<10; digit++){
    const patt2 = new RegExp(digit+"{2}" );
    const res2 = patt2.test(str);
    // const patt3 = new RegExp(digit+"{3}" );
    // const res3 = patt3.test(str);
    // console.log(str,digit,res2,res3);
    if( res2 ) return true;
  }
  return false
}

assert( has_double("129945") == true )
assert( has_double("129995") == true )

function is_valid(number){
  // It is a six-digit number.
  // The value is within the range given in your puzzle input.

  const s = ""+number;
  // const digits = s.split("");
  // const values = digits.map(x=>parseInt(x))

  // Two adjacent digits are the same (like 22 in 122345).
  if( !has_double(s) ) return 1;

  // Going from left to right, the digits never decrease; they only 
  // ever increase or stay the same (like 111123 or 135679).
  if( has_decrease(s) ) return 2;

  return 0;
}

const start = 347312;
const finish = 805915;

var count = 0;
for( var n=start; n<=finish; n++){
  if( is_valid(n) == 0 ){
    // console.log(n);
    count += 1;
  } else {
    // console.log(n);
  }
}

console.log(count);