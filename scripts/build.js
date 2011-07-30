
var pelpa = require('./pelpa');

console.log('\nbuilding...');

var doc = pelpa.build();

console.log('source: ' + doc.source.join(', '));

console.log('\nTitle: ' + doc.tree.text);

console.log('\ndone');
