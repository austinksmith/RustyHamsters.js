# WebHamsters
**Author**: Austin K. Smith

**Website**: [Hamsters.io](http://www.hamsters.io)

**Description**: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers

**License**: Artistic License 2.0


# Guides
Detailed Documentation coming soon check [Guides](http://www.hamsters.io/guides) for details

# Workflow Diagram

![alt tag](http://www.hamsters.io/guides/workflow.png)

# Getting Started

First download a copy of the library by using the releases page on the repo, add the script to your html header like so.

```
<!-- HTML4 and (x)HTML -->
<script type="text/javascript" src="hamsters.js">

<!-- HTML5 -->
<script src="hamsters.js"></script>
```

Alternatively you can use bower to obtain a copy of the library by running.

```
bower install WebHamsters
```

Once you've downloaded and added the script tags to your project you should have a variable named hamsters available in your console, this variable is the core of the library. Do not create any globally scoped variables with the same name or you will risk causing compatibility issues. Now that you've succesfully added the library to your project, let's get started below.


# How it works

The basic structure of a WebHamster function is as follows

```
// Params you want accessed by your function, for automatic task splitting your data array must have the index of 'array'
 var params = {'array':[]};  
  hamsters.run(params, function() {
      //Operations you wish to perform inside each thread
  }, function(output) {
     //Resulting output callback, do as you wish with your output
  }, threads, aggregate, dataType, memoize, sort);

```

Inside of your function you have an rtn object available to pass your output into, your function must use this object to push your output into the rtn.data array so the library can manage the data dependencies between each thread efficiently. Failure to use the rtn.data array for your output may lead to unexpected behavior. You've been warned.

# Restructuring standard functions

Imagine we have a sequential function that loops through several items and performs operations on them, traditionally this would be written like below.

```
function() {
  var array = [0,1,2,3,4,5,6,7,8,9];
  var output = [];
  array.forEach(function(item) {
    output.push((item * 120)/10);
  });
  return output;
}

```

Now we can put this task onto its own thread like so

```
//1 thread and do not aggregate thread results (only one thread output)
function() {
  var params = {'array':[0,1,2,3,4,5,6,7,8,9]};
  hamsters.run(params, function() {
      var arr = params.array;
      arr.forEach(function(item) {
        rtn.data.push((item * 120)/10);
      });
  }, function(output) {
     return output;
  }, 1, false);
}

```

Alternatively we can split this task among 4 threads for paralell execution like so

```
//4 threads and let's aggregate our individual thread results into one final output
function() {
  var params = {'array':[0,1,2,3,4,5,6,7,8,9]};
  hamsters.run(params, function() {
      var arr = params.array;
      arr.forEach(function(item) {
        rtn.data.push((item * 120)/10);
      });
  }, function(output) {
     return output;
  }, 4, true);
}

```
We can even define a function to split across all available threads like so

```
//All threads and let's aggregate our individual thread results into one final output
function() {
  var params = {'array':[0,1,2,3,4,5,6,7,8,9]};
  hamsters.run(params, function() {
      var arr = params.array;
      arr.forEach(function(item) {
        rtn.data.push((item * 120)/10);
      });
  }, function(output) {
     return output;
  }, hamsters.maxThreads, true);
}

```

# Performance Tweaking

To obtain the best performance possible version 2.0 supports an optional dataType param, if your problem supports being transformed into any of javascripts typed arrays you can see up to 10x the performance boost over previous releases. 

If you do not know what typed arrays are please take a look at this guide [Typed Arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays)

You may write a function to make use of these like so

```
//4 threads and use dataType and let's aggregate our individual thread results into one final output
function() {
  var params = {'array':[0,1,2,3,4,5,6,7,8,9]};
  hamsters.run(params, function() {
      var arr = params.array;
      arr.forEach(function(item) {
        rtn.data.push((item * 120)/10);
      });
  }, function(output) {
     return output;
  }, 4, true, dataType);
}

```

Where dataType is one of the below options.

* 'Int8'
* 'Int16'
* 'Int32'
* 'Uint8' 
* 'Uint8Clamped' 
* 'Uint16' 
* 'Uint32'
* 'Float32' 
* 'Float64'


# Sorting
 
 Version 2.7 introduces optional automagical data sorting, you can write a function that automatically sorts like so

```
function() {
  var params = {'array':[0,1,2,3,4,5,6,7,8,9]};
  hamsters.run(params, function() {
      var arr = params.array;
      arr.forEach(function(item) {
        rtn.data.push((item * 120)/10);
      });
  }, function(output) {
     return output;
  }, threads, aggregate, dataType, cache, sortDirection);
}

```
Where sortDirection is one of the below options.

* Ascending Numerical: 'asc'
* Descending Numerical: 'desc'
* Ascending Alphabetical: 'ascAlpha'
* Descending Alphabetical: 'descAlpha'

# Persistence

Version 3.3 introduces a new persistence mode that will spawn the maximum number of threads a client can use at startup and reuse them instead of spawning/destroying them dynamically, this option can dramatically reduce runtime latency at the cost of somewhat higher heap allocation and is enabled by default. If you do not require realtime performance from the library or you are developing for memory constrained systems you can disable this by setting

```
hamsters.persistance = false;
```

# Result Caching (Memoization)

To obtain the best performance possible versions 2.2 and later support an optional result caching option, if you know you will be performing the same calculation numerous times enabling cache mode can result in a big performance boost as it will pull the result from cache instead of recalculating the output. This cache mode makes use of session storage and is limited to roughly 5MB of space depending on the browser used. The library will attempt to cache as many previous runs as possible and will only clear out past results in the event that session storage is full. Not all outputs can be cached as they may be too large so this is disabled by default. However version 2.3 introduces hashing of the input values instead of storing both the input and output, this change roughly doubles the space for memoization making this much more viable. 
 

You may enable cache mode by setting

```
hamsters.cache = true;
```

You can disable caching for individual functions like so 

```
function() {
  var params = {'array':[0,1,2,3,4,5,6,7,8,9]};
  hamsters.run(params, function() {
      var arr = params.array;
      arr.forEach(function(item) {
        rtn.data.push((item * 120)/10);
      });
  }, function(output) {
     return output;
  }, threads, aggregate, dataType, false);
}
```


# Debugging

The library supports two modes of debugging each provide useful information which may assist in fine tune performance & output tuning
You can invoke debug mode by setting hamsters.debug to true or 'verbose'. Verbose mode provides quite a large amount of console spam and should not be used unless you have a deep understanding of how the library runtime functions. Normal debug mode is useful for performance profling, verbose mode however will introduce it's own slight performance drawbacks. 

# Performance Considerations

Not every task can be easily paralellized and depending on the size of the task putting it onto its own thread may introduce its own performance drawbacks as any benefit may be outweighed by the overhead of the runtime itself. I highly recommend especially for a larger scale application that you spend some time learning about [Amdahls Law](http://en.wikipedia.org/wiki/Amdahl%27s_law)

Alternatively if your problem size scales with the amount of threads you use, you can see some serious performance gains. This is known as Gustafson's Law you can read more about this at [Gustafson's Law](http://en.wikipedia.org/wiki/Gustafson%27s_law). Also be sure to check out this performance example demonstrating the performance boost additional threads can have. 

[Perf Example](http://www.hamsters.io/performance)

The library attempts to detect the number of available cores on a client machine and formulates a maximum concurrent thread count based on that value, if the library is unable to detect a valid core count it will fallback to a maxThread count of 4. The library will automatically pool and manage execution across all available threads automatically scaling based on demand, and will destroy threads when they do not have pending work to complete, otherwise explicit threads are reused. 

Threads are not the same as cores, assuming your machine has 4 logical cores you can ask the library to split a given task across exactly 4 threads, however there is no guarantee that a single thread will have access to it's own core for execution. The operating system manages thread allocation to individual cores, WebHamsters simply manages splitting sequential task across individual threads the library cannot control how the OS manages those threads once they are handed off. 

# Limitations

Currently due to a bug in how javascript handles data aggregation if you wish to have your individual thread outputs aggregated into a final result the maximum number of threads any single function can invoke is 20, there is no limitation on thread count if you are not asking for the library to aggregate your individual thread outputs back together.

Coincidentally FireFox enforces a per origin thread limit of 20, therefore on systems with greater than 20 logical cores maxThreads will be limited to 20 when using FireFox. Functions invoking greater than 20 threads will have threads pooled until execution is complete.

# Browser Support

Currently as of v1.4 all browsers excluding IE versions below 9 are supported by the library, modern browsers such as Chrome, Safari, Opera, IE11, and Firefox have full web worker support and will give the best performance, Older browsers such as IE10 and below are supported by using a legacy processor fallback, these computations will be run on the main thread however they still follow the library process of breaking a given task into individual pieces and executing each piece at a time.

# Tested Devices

* Monochrome Kindle 3
* Iphone 4s
* LG G3
* Samsung Galaxy S4
* Samsung Galaxy S5
* Iphone 6
* Iphone 5s
* Samsung Galaxy Note 4
* Nokia Lumina Windows Phone 8

# Tested Browsers

* Chrome Desktop (41.0.2272, 39.0.2171, 42.0.2311, 43.0.2316, 43.0.2348, 43.0.2349, 44.0.2369)
* Chrome Mobile (33.0.0, 34.0.1847, 37.0.0, 41.0.2272, 42.0.2311)
* Firefox (35, 36, 37, 38)
* Opera (28.0.1750)
* Safari Desktop (8.0.6)
* Safari Mobile (7.0)
* IE9
* IE10
* IE10 Mobile
* IE11
* Stock Android Browser 4.4