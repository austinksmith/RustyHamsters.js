/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import hamstersHabitat from './habitat';

'use strict';

class data {

  constructor() {
    this.randomArray = this.randomArray;
    this.aggregateArrays = this.aggregateThreadOutputs;
    this.splitArrays = this.splitArrayIntoSubArrays;
    this.createBlob = this.createDataBlob;
    this.generateBlob = this.generateWorkerBlob;
    this.processDataType = this.processDataType;
    this.sortOutput = this.sortArray;
    this.getOutput = this.prepareOutput;
    this.prepareJob = this.prepareFunction;
    this.feedHamster = this.messageWorker;
    this.prepareMeal = this.prepareHamsterFood;
    this.workerURI = null;
  }

  prepareHamsterFood(task, threadId) {
    let hamsterFood = task.input;
    for (var key in task.input) {
      if (task.input.hasOwnProperty(key) && key !== 'array') {
        hamsterFood[key] = task.input[key];
      }
    }
    hamsterFood.array = task.input.array;
    if (task.hamstersJob && !hamsterFood.hamstersJob) {
      hamsterFood.hamstersJob = hamstersJob;
    }
    return hamsterFood;
  }

  messageWorker(hamster, hamsterFood) {
    if (hamstersHabitat.webWorker) {
      return hamster.port.postMessage(hamsterFood);
    }
    if (hamstersHabitat.ie10) {
      return hamster.postMessage(hamsterFood);
    }
    return hamster.postMessage(hamsterFood, this.prepareTransferBuffers(hamsterFood));
  }

  prepareTransferBuffers(hamsterFood) {
    let buffers = [];
    let key = null;
    if(hamstersHabitat.transferrable) {
      for (key in hamsterFood) {
        if (hamsterFood.hasOwnProperty(key) && hamsterFood[key]) {
          if(hamsterFood[key].buffer) {
            buffers.push(hamsterFood[key].buffer);
          } else if(Array.isArray(hamsterFood[key]) && typeof ArrayBuffer !== 'undefined') {
            buffers.push(new ArrayBuffer(hamsterFood[key]));
          }
        }
      }
    }
    return buffers;
  }

  prepareFunction(functionBody, habitat) {
    if (!habitat.legacy) {
      functionBody = String(functionBody);
      if (!habitat.webWorker) {
        let startingIndex = (functionBody.indexOf("{") + 1);
        let endingIndex = (functionBody.length - 1);
        return functionBody.substring(startingIndex, endingIndex);
      }
    }
    return functionBody;
  }

  generateWorkerBlob(workerLogic) {
    let functionString = '(' + String(workerLogic) + ')();';
    let hamsterBlob = this.createBlob(functionString);
    return URL.createObjectURL(hamsterBlob);
  }

  processDataType(dataType, buffer) {
    if(hamstersHabitat.transferrable) {
      return this.typedArrayFromBuffer(dataType, buffer);
    }
    return buffer;
  }

  prepareOutput(task) {
    if(task.aggregate && task.threads !== 1) {
      return this.aggregateThreadOutputs(task.output, task.dataType);
    }
    return task.output;
  }

  sortArray(arr, order) {
    switch(order) {
      case 'desc':
      case 'asc':
        return Array.prototype.sort.call(arr, function(a, b) {
          return (order === 'asc' ? (a - b) : (b - a)); 
        });
      case 'ascAlpha':
        return arr.sort();
      case 'descAlpha':
        return arr.reverse();
      default:
        return arr;
    }
  }

  typedArrayFromBuffer(dataType, buffer) {
    const types = {
      'uint32': Uint32Array,
      'uint16': Uint16Array,
      'uint8': Uint8Array,
      'uint8clamped': Uint8ClampedArray,
      'int32': Int32Array,
      'int16': Int16Array,
      'int8': Int8Array,
      'float32': Float32Array,
      'float64': Float64Array
    };
    if(!types[dataType]) {
      return dataType;
    }
    return new types[dataType](buffer);
  }

  createDataBlob(textContent) {
    if(typeof Blob === 'undefined') {
      let BlobMaker = (BlobBuilder || WebKitBlobBuilder || MozBlobBuilder || MSBlobBuilder);
      let blob = new BlobMaker();
      blob.append([textContent], {
        type: 'application/javascript'
      });
      return blob.getBlob();
    } 
    return new Blob([textContent], {
      type: 'application/javascript'
    });
  }

  randomArray(count, onSuccess) {
    var randomArray = [];
    while(count > 0) {
      randomArray.push(Math.round(Math.random() * (100 - 1) + 1));
      count -= 1;
    }
    onSuccess(randomArray);
  }

  aggregateThreadOutputs(input, dataType) {
    if(!dataType || !hamstersHabitat.transferrable) {
      return input.reduce(function(a, b) {
        return a.concat(b);
      });
    }
    let i = 0;
    let len = input.length;
    let bufferLength = 0;
    for (i; i < len; i += 1) {
      bufferLength += input[i].length;
    }
    let output = this.processDataType(dataType, bufferLength);
    let offset = 0;
    for (i = 0; i < len; i += 1) {
      output.set(input[i], offset);
      offset += input[i].length;
    }
    return output;
  }

  splitArrayIntoSubArrays(array, n) {
    let i = 0;
    let threadArrays = [];
    let size = Math.ceil(array.length/n);
    if(array.slice) {
      while(i < array.length) {
        threadArrays.push(array.slice(i, i += size));
      }
    } else {
      while (i < array.length) {
        threadArrays.push(array.subarray(i, i += size));
      }
    }
    return threadArrays;
  }
}

var hamstersData = new data();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamstersData;
}
