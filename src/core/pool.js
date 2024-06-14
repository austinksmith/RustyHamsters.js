/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

class Pool {
  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor(hamsters) {
    'use strict';

    this.hamsters = hamsters;
    this.threads = [];
    this.running = [];
    this.pending = [];
    this.fetchHamster = this.getAvailableThread.bind(this);
  }

  /**
  * @function addWorkToPending - Adds task to queue waiting for available thread
  * @param {number} index - Index of the task
  * @param {object} task - Provided library functionality options for this task
  * @param {function} resolve - onSuccess method
  * @param {function} reject - onError method
  */
  addWorkToPending(index, task, resolve, reject) {
    if (this.hamsters.habitat.debug) {
      task.scheduler.metrics.threads[task.scheduler.count].enqueued_at = Date.now();
    }
    this.pending.push({
      index,
      count: task.scheduler.count,  
      task,
      resolve,
      reject
    });
  }

  /**
  * @function processQueuedItem - Invokes processing of next item in queue
  * @param {object} hamster - The thread to run the task
  * @param {object} item - Task to process
  */
  processQueuedItem(hamster, threadId, item) {
    if (this.hamsters.habitat.debug) {
      item.task.scheduler.metrics.threads[item.count].dequeued_at = Date.now();
    }
    this.runTask(hamster, threadId, item.index, item.task, item.resolve, item.reject, true);
  }

  /**
  * @function getAvailableThread - Gets an available thread
  * @param {number} threadId - Id of the thread
  * @returns {object} - The available thread
  */
  getAvailableThread(threadId) {
    if (this.hamsters.habitat.persistence) {
      return this.threads[threadId];
    }
    return this.spawnHamster();
  }

  /**
  * @function keepTrackOfThread - Keeps track of threads running, scoped globally and to task
  * @param {object} task - Provided library functionality options for this task
  * @param {number} id - Id of thread to track
  */
  keepTrackOfThread(task, id) {
    if (this.hamsters.habitat.debug) {
      task.scheduler.metrics.threads[task.scheduler.count].started_at = Date.now();
    }
    task.scheduler.workers.push(id);
    this.running.push(id);
  }

  /**
  * @function spawnHamsters - Spawns multiple new threads for execution
  * @param {number} maxThreads - Max number of threads for this client
  */
  spawnHamsters(maxThreads) {
    while (maxThreads--) {
      this.threads.push(this.spawnHamster());
    }
  }

  /**
  * @function spawnHamster - Spawns a new thread for execution
  * @return {object} - New WebWorker thread using selected scaffold
  */
  spawnHamster() {
    const { selectHamsterWheel, SharedWorker, Worker, node, parentPort } = this.hamsters.habitat;
    const hamsterWheel = selectHamsterWheel();
    if (this.hamsters.habitat.webWorker) {
      return new SharedWorker(hamsterWheel, 'SharedHamsterWheel');
    }
    if (node && typeof parentPort !== 'undefined') {
      return new Worker(hamsterWheel);
    }
    return new Worker(hamsterWheel);
  }

  /**
   * @function prepareMeal - Prepares message to send to a thread and invoke execution
   * @param {number} index - Index of the subarray to process
   * @param {object} task - Provided library functionality options for this task
   * @return {object} - Prepared message to send to a thread
   */
  prepareMeal(index, task) {
    const hamsterFood = {
      array: task.input.array.length !== 0 ? this.hamsters.data.getSubArrayFromIndex(index, task) : [],
      index: index
    };
    
    if(typeof task.scheduler.sharedBuffer !== "undefined") {
      hamsterFood.sharedBuffer = task.scheduler.sharedBuffer;
    }

    const excludedKeys = new Set(['array', 'threads', 'sharedArray']);
    
    for (const key in task.input) {
      if (task.input.hasOwnProperty(key) && !excludedKeys.has(key)) {
        hamsterFood[key] = task.input[key];
      }
    }

    return hamsterFood;
  }


  /**
  * @function runTask - Runs function using thread
  * @param {object} hamster - The thread to run the task
  * @param {number} index - Index of the subarray to process
  * @param {object} task - Provided library functionality options for this task
  * @param {function} resolve - onSuccess method
  * @param {function} reject - onError method
  */
  runTask(hamster, threadId, index, task, resolve, reject) {
    const hamsterFood = this.prepareMeal(index, task);
    this.keepTrackOfThread(task, threadId);
    if (this.hamsters.habitat.legacy) {
      this.hamsters.wheel.legacy(hamsterFood, resolve, reject);
    } else {
      this.hamsters.pool.trainHamster(index, task, threadId, hamster, resolve, reject);
      this.hamsters.data.feedHamster(hamster, hamsterFood);
    }
    task.scheduler.count += 1;
  }

  /**
  * @function hamsterWheel - Runs or queues function using threads
  * @param {number} index - Index of the subarray to process
  * @param {object} task - Provided library functionality options for this task
  * @param {function} resolve - onSuccess method
  * @param {function} reject - onError method
  */
  hamsterWheel(index, task, resolve, reject) {
    if (this.hamsters.habitat.maxThreads <= this.running.length) {
      return this.addWorkToPending(index, task, resolve, reject);
    }
    return this.runTask(this.fetchHamster(this.running.length), this.running.length, index, task, resolve, reject);
  }

  /**
  * @function returnOutputAndRemoveTask - Gathers thread outputs into final result
  * @param {object} task - Provided library functionality options for this task
  * @param {function} resolve - onSuccess method
  */
  returnOutputAndRemoveTask(task, resolve) {
    if(task.input.sharedArray) {
      task.output = hamsters.data.processDataType(task.input.dataType, task.scheduler.sharedBuffer);
    }
    if(task.input.aggregate) {
      task.output = this.hamsters.data.aggregateThreadOutputs(task.output, task.input.dataType);
    }
    if(task.input.sort) {
      task.output = this.hamsters.data.sortOutput(task.output, task.input.sort)
    }
    if (this.hamsters.habitat.debug) {
      task.scheduler.metrics.completed_at = Date.now();
      console.info("Hamsters.js Task Completed: ", task);
    }
    resolve(task.output);
  }

  /**
  * @function removeFromRunning - Removes a thread from the running pool
  * @param {object} task - Provided library functionality options for this task
  * @param {number} threadId - Id of the thread to remove
  */
  removeFromRunning(task, threadId) {
    this.running.splice(this.running.indexOf(threadId), 1);
    task.scheduler.workers.splice(task.scheduler.workers.indexOf(threadId), 1);
  }

  /**
   * @function processReturn - Processes the returned message from a thread
   * @param {number} index - Index of the subarray processed
   * @param {object} message - Message returned from the thread
   * @param {number} threadId - Id of thread returning response
   * @param {object} task - Provided library functionality options for this task
   */
  processReturn(index, message, threadId, task) {
    const isReactNative = this.hamsters.habitat.reactNative;
    const messageData = isReactNative ? JSON.parse(message).data : message.data.data !== undefined ? message.data.data : message.data;
    
    if (task.scheduler.threads !== 1) {
        if (isReactNative || task.input.mixedOutput) {
          task.output[threadId] = messageData;
        } else {
          this.hamsters.data.addThreadOutputWithIndex(task, index, messageData);
        }
    } else {
        task.output = messageData;
    }
  }


  /**
  * @function setOnMessage - Sets the message handlers for a thread
  * @param {object} hamster - The thread to set the handlers on
  * @param {function} onThreadResponse - Handler for thread response
  * @param {object} habitat - Habitat configuration
  * @param {function} reject - onError method
  */
  setOnMessage(hamster, onThreadResponse, reject) {
    if (this.hamsters.habitat.webWorker) {
      hamster.port.onmessage = onThreadResponse;
      hamster.port.onmessageerror = reject;
      hamster.port.onerror = reject;
    } else if (this.hamsters.habitat.node) {
      hamster.on('message', onThreadResponse);
      hamster.on('messageerror', reject);
      hamster.on('error', reject);
    } else {
      hamster.onmessage = onThreadResponse;
      hamster.onmessageerror = reject;
      hamster.onerror = reject;
    }
    return hamster;
  }  

  /**
  * @function trainHamster - Trains thread in how to behave
  * @param {number} index - Index of the subarray to process
  * @param {object} task - Provided library functionality options for this task
  * @param {number} threadId - Id of the thread to train
  * @param {object} hamster - The thread to train
  * @param {function} resolve - onSuccess method
  * @param {function} reject - onError method
  */
  trainHamster(index, task, threadId, hamster, resolve, reject) {
    let onThreadResponse = (message) => {
      this.hamsters.pool.processReturn(index, message, threadId, task);
      this.hamsters.pool.removeFromRunning(task, threadId);
      if (task.scheduler.workers.length === 0 && task.scheduler.count === task.scheduler.threads) {
        this.returnOutputAndRemoveTask(task, resolve);
      }
      if (this.hamsters.habitat.debug) {
        task.scheduler.metrics.threads[threadId].completed_at = Date.now();
      }
      if (this.hamsters.pool.pending.length !== 0) {
        this.hamsters.pool.processQueuedItem(hamster, threadId, this.hamsters.pool.pending.shift());
      }
      if (!this.hamsters.habitat.persistence) {
        hamster.terminate();
      }
    };
    return this.hamsters.pool.setOnMessage(hamster, onThreadResponse, reject);
  }

  /**
  * @function scheduleTask - Adds new task to the system for execution
  * @param {object} task - Provided library functionality options for this task
  */
  scheduleTask(task) {
    let i = 0;
    if(this.hamsters.habitat.debug) {
      let metrics = task.scheduler.metrics;
      metrics.started_at = Date.now();
      return new Promise((resolve, reject) => {
        while (i < task.scheduler.threads) {
          metrics.threads.push({
            created_at: Date.now(),
            started_at: null,
            enqueued_at: null,
            dequeued_at: null,
            completed_at: null
          });
          this.hamsterWheel(task.scheduler.indexes[i], task, resolve, reject);
          i += 1;
        }
      });
    }
    //Process with debug mode disabled, no need for time stamping
  	return new Promise((resolve, reject) => {
      while (i < task.scheduler.threads) {
        this.hamsterWheel(task.scheduler.indexes[i], task, resolve, reject);
        i += 1;
      }
    });
  }
}

export default Pool;