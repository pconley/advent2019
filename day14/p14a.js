var _ = require('lodash');
var fs = require('fs');
var assert = require('assert');
var Combinatorics = require('js-combinatorics');
//const { lcm } = require('mathjs')

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

function range(a,b){
  // an inclusive range gen
  const inc = b>a ? 1 : -1 ;
  return _.range(a,b+inc,inc);
}

assert(same(range(2,4),[2,3,4]))
assert(same(range(4,2),[4,3,2]))

class Equation {
  constructor(line) {
    this.line = line;
    const [left,right] = this.extract(line);
    this.left = {};
    left.forEach(x=>this.left[x[1]]=x[0]);
    this.result = right[0][1];
    this.amount = right[0][0];
  }
  extract(line){
    const raw = line.split("=> ");
    // logger.trace("extract:", line, raw);
    const data = [raw[0].split(","),raw[1].split(",")];
    logger.trace("data:",data);
    return [this.splitup(data[0]),this.splitup(data[1])];
  }
  produces(element){
    // logger.trace(`  produces: ${element}`)
    return _.some(Object.keys(this.right),key=>key==element);
  }
  produces_any_of(elements){
    // logger.trace(`produces_any_of ${elements}`)
    return _.some(elements,element=>this.produces(element));
  }
  splitup(side){
    // logger.trace("splitup:", side);
    return side.map(x=>this.parse(x));
  }
  parse(portion){
    // logger.trace("parse:",portion);
    const parts = portion.trim().split(" ");
    return [parseInt(parts[0]),parts[1].trim()]
  }
}

function get_equation(equations,element){
  return _.find(equations, e=>e.result==element);
}

var depth = 0;
const needed = {};
const resources = {};
const total_ore = 0;

function analyze(equations, target, amount){
  const prefix = "    ".repeat(depth);
  if( !needed[target] ) needed[target] = 0;
  needed[target] += amount;
  depth++;
  const eqn = get_equation(equations,target);
  const times = Math.ceil(amount/eqn.amount);
  console.log(`${prefix}needs=${amount} of ${target} by running ${times}*${eqn.amount} = ${times * eqn.amount}`)
  logger.trace(`equation ${eqn.line} makes ${eqn.amount} of ${target}`);
  logger.trace(`need reaction ${times} times to make ${amount}`);
  logger.trace(eqn.left);
  Object.keys(eqn.left).forEach(ingredient=>{
    logger.trace(ingredient)
    if( ingredient == "ORE" ){
      // pass
    } else {
      logger.trace(`<<< ingredient ${ingredient}: ${eqn.left[ingredient]}`)
      const _amount = times * eqn.left[ingredient];
      analyze(equations,ingredient,_amount);
      logger.trace("pop?",eqn.line)
    }
  });
  depth--;
  return 0;
}

function hasResources(equations, need_element){
  // are there resources to build the need?
  const amount = needed[need_element];
  logger.trace(`hasResources? ${need_element} ${amount}`)
  const eqn = get_equation(equations,need_element);
  logger.trace(`   ${eqn.line}`);

  for (const key in eqn.left) {
    if( !resources[key] ) resources[key]=0;
    const available = resources[key];
    const required = eqn.left[key];
    logger.debug("left:",key,"R=",required,"A=",available);
    if( key == 'ORE'){
      logger.trace("ore");
      return eqn;
    } else {
      logger.trace(`   -- ${key}  ${available} >= ${eqn.left[key]} ?`)
      if( resources[key] >= eqn.left[key] ){
        logger.trace(`   -- yes!`)
      } else {
        logger.debug(`   -- no!!!!`)
        return null;
      }
    }
  }
  return eqn;
}

function execute(eqn,amount_needed){
  const runs = Math.ceil(amount_needed/eqn.amount);
  const produces = runs*eqn.amount;
  logger.error(`execute ${eqn.line} amount_needed=${amount_needed} runs=${runs} produces=${produces}`)
  // "run" the equation once (more?)
  // add result to the resources
  const result = eqn.result;
  if( !resources[result] ) resources[result]=0;
  resources[result] += produces;
  // remove from the resources
  for (const key in eqn.left) {
    const amt = eqn.left[key];
    resources[key] -= runs*amt;
  }
  // remove from the needed
  needed[result] -= produces;
  if( needed[result]<=0 ) delete needed[result];
  logger.error("    needed   :",as_str(needed));
  logger.error("    resources:",as_str(resources));
}

function as_str(dict){
  return Object.keys(dict).map(x=>`${x}:${dict[x]}`).join(" ")
}

function construct(){
  var loop = 0;
  resources["FUEL"] = 0;
  while( resources["FUEL"]<1 ){
    // if( loop > 200 ) break;
    logger.info();
    logger.info(`${loop}: top`);
    logger.info(`  resources`,as_str(resources));
    logger.info(`  needed`,as_str(needed));
    var found = false;
    for (const needed_element in needed) {
      // const e = get_equation(equations,needed_element);
      const eqn = hasResources(equations, needed_element);
      if( eqn ){
        execute(eqn, needed[needed_element]);
        logger.debug("after exec",as_str(resources));
        found = true;
        break;
      }
    }
    if( !found ){
      console.fatal("FATA: NO EQN FOUND");
      break;
    }
    // logger.info("bottom top resources",as_str(resources));
    loop++;
  }
  logger.info(as_str(resources));
  return -resources["ORE"];
}

//==== MAINLINE ====//

const filename = process.argv[2]; 
logger.level = process.argv[3]; // trace debug info warn error fatal

const contents = fs.readFileSync(filename, 'utf8');
const lines = contents.split("\n");
const answer = parseInt(lines[0]);
logger.fatal("\n\n\n\n\nexpected answer=",answer);
const equations = lines.slice(1).map(x=>new Equation(x))
logger.fatal(get_equation(equations,'FUEL').line);
logger.fatal("\n",equations.map(x=>x.line).join("\n"))

logger.fatal(equations.map(x=>x.result));

// first pass; determine all the needed resources

analyze(equations, "FUEL", 1);
logger.fatal("needed",as_str(needed));

// second pass; move back through resources
// and run the necessary equation to build.

ore_required = construct(equations);
console.log(`results=${ore_required} expected=${answer}`);
console.log( ore_required==answer?"SUCCESS":"FAILED" );
