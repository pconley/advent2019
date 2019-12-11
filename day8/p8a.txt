var _ = require('lodash');
var fs = require('fs');
var assert = require('assert');
var Combinatorics = require('js-combinatorics');

var log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = 'trace'; // trace; debug; info, warn; error; fatal

// The image you received is 25 pixels wide and 6 pixels tall.

const TALL = 6;
const WIDE = 25;
const AREA = WIDE*TALL;

function count(layer,val){
    return _.sum(layer.map(x=>x==val?1:0));
}

function print(title,layer){
    const counts = [0,1,2].map(n=>count(layer,n))
    logger.info(`${title}: ${counts}`);
    for( var t=0; t<TALL; t++){
        var line = _.join(_.slice(layer, t*WIDE, (t+1)*WIDE),"|");
        logger.info(line);
    }
}



filename = process.argv[2];
fs.readFile(filename, 'utf8', function(err, contents) {
  const data = contents.split("");
  const layer_count = (data.length-1) / (WIDE*TALL);
  logger.trace(data.length, layer_count);
  const range = _.range(0,layer_count);
  const layers = range.map(n=>_.slice(data,n*AREA,(n+1)*AREA));

  // PART ONE (redux)
  var saved;
  var smallest = AREA+1;
  layers.forEach((layer, index)=>{
    const zeros = count(layer,0);
    if( zeros < smallest ){
        saved = layer;
        smallest = zeros;
    }
  });
  print("saved",saved);
  product = count(saved,1)*count(saved,2)
  logger.info(`product = ${product}`)
  assert( product == 1088)

  // PART TWO 

  const image = layers[layer_count-1];
  _.reverse(layers).forEach(layer=>{
      // for each pixel in the layer
      for( i=0; i<AREA; i++){
          if( layer[i] == 2 ){
              // ignore a transparent pixel
          } else {
              // overlay the latest pixel
              image[i] = layer[i];
          }
        //   logger.trace(image[i],layer[i]);
      }
  });
  print("image",image);
  const visual = image.map(p=>(p==0)?" ":"X")
  print("visual",visual);

});
