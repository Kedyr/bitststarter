#!/usr/bin/env node

/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var util = require('util');
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
  var instr = infile.toString();
  if (instr.search(/^http/) === -1) {
    if (!fs.existsSync(instr)) {
      console.log("%s does not exist. Exiting.", instr);
      process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
  }
  return instr;
};

var loadChecks = function(checksfile) {
  return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlAttributes = function($, checksfile) {
  var checks = loadChecks(checksfile).sort();
  var out = {};
  for (var ii in checks) {
    var present = $(checks[ii]).length > 0;
    out[checks[ii]] = present;
  }
  var jsonResponse = JSON.stringify(out, null, 4);
  console.log(jsonResponse);
};


var checkHtmlFile = function(htmlfile, checksfile) {
  if (htmlfile.search(/^http/) === -1) {
    var response = cheerio.load(fs.readFileSync(htmlfile));
    checkHtmlAttributes(response, checksfile);
  } else {
    rest.get(htmlfile).on('complete', function(response) {
      if (response instanceof Error) {
        console.error("%s does not exist. Exiting.", htmlfile);
        process.exit(1); 
      }
      var resultResp = cheerio.load(response);
      checkHtmlAttributes(resultResp, checksfile);
    });
  }
}

var clone = function(fn) {
  // Workaround for commander.js issue.
  // http://stackoverflow.com/a/6772648
  return fn.bind({});
};

if (require.main == module) {
  program
    .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
    .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
    .parse(process.argv);
  checkHtmlFile(program.file, program.checks);
} else {
  exports.checkHtmlFile = checkHtmlFile;
}