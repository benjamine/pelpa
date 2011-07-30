
var fs = require('fs');
var path = require('path');
var Showdown = require('./showdown').Showdown;

pelpa = exports;

var converter = new Showdown.converter();

pelpa.markdownToHtml = function(md){
    return converter.makeHtml(md);
}

pelpa.textToId = function(text){
    return text.replace(/[^A-Z0-9]/gim, '_').toLowerCase();
};

pelpa.parseHtmlTree = function(htmlInput){

    var headerRegex = /<h([1-9])([^>]*)>(.*)<\/h([1-9])>/im;
    var map = {}, out = [], match, html = htmlInput;
    
    // build a tree based on h[1-9] tags
    
    var root = {
        hkey: '',
        level: 0,
        index: 0,
        children: []
    }, cur = root;
    
    while (match = headerRegex.exec(html)) {
        var hTag = null;
        if (match[1] === match[4]) {
        
            out.push(html.substr(0, match.index));
            
            var item = {
                level: parseInt(match[1], 10),
                text: match[3],
                htmlIndex: match.index,
                children: []
            };
            
            // close sections            
            var levelDiff = item.level - cur.level;
            while (levelDiff <= 0) {
                out.push('\n</section>\n');
                levelDiff++;
            }
            
            if (item.level > cur.level) {
                item.parent = cur;
                item.index = cur.children.length;
                cur.children.push(item);
            }
            else 
                if (item.level === cur.level) {
                    item.parent = cur.parent;
                    item.index = cur.parent.children.length;
                    cur.parent.children.push(item);
                }
                else {
                    while (item.level < cur.level) {
                        cur = cur.parent;
                        item.parent = cur.parent;
                        item.index = cur.parent.children.length;
                        cur.parent.children.push(item);
                    }
                }
            
            // hierarchical key (eg: 1, 1.3, 4.14.1)
            if (item.level > 1) {
                item.hkey = item.parent.hkey + (item.parent.hkey !== '' ? '.' : '') + (item.index + 1);
            }
            else {
                item.hkey = '';
            }
            
            item.id = pelpa.textToId(item.text);
            
            // prevent duplicate ids
            var idn = 1;
            while (map[item.id]) {
                idn++;
                item.id = pelpa.textToId(item.text) + '_' + idn;
            }
            
            // add an id to header tag
            hTag = '<h' + item.level + ' id="header_' + item.id + '"' + match[2] + '>' + item.text + '</h' + item.level + '>';
            map[item.id] = item;
            
            // open section
            out.push('\n<section id="' + item.id + '"');
            if (item.hkey) {
                out.push(' data-hkey="' + item.hkey + '"');
            }
            out.push('>\n');
            // begin section with h tag
            out.push(hTag);
            
            html = html.substr(match.index + match[0].length);
            
            cur = item;
        }
        else {
            out.push(html.substr(0, match.index + match[0].length));
            html = html.substr(match.index + match[0].length);
        }
    }
    
    // push remaining html 
    out.push(html);
    
    // close remaining sections
    var levelDiff = cur.level;
    while (levelDiff <= 0) {
        out.push('\n</section>\n');
        levelDiff++;
    }
    
    return {
        tree: root.children[0],
        html: out.join('')
    };
};

pelpa.treeToHtml = function(tree){

    var treemd = [];
    var indent = '                       ';
    var cur = tree;
    var ignoreLevel1 = false;
    while (cur) {
        if (cur.level === 1 && cur.parent.children.length === 1) {
            // unique h1 tag, ignore
            ignoreLevel1 = true;
        }
        else {
            treemd.push(indent.substr(0, cur.level + (ignoreLevel1 ? -1 : 0) + 2) + '- [' + cur.text + '](#' + cur.id + ')');
        }
        if (cur.children && cur.children.length > 0) {
            cur = cur.children[0];
        }
        else {
            while ((cur.parent) &&
            (cur.index >= cur.parent.children.length - 1)) {
                cur = cur.parent;
            }
            if (cur.parent) {
                cur = cur.parent.children[cur.index + 1];
            }
            else {
                cur = null;
            }
        }
    }
    
    return pelpa.markdownToHtml(treemd.join('\n'));
};

pelpa.setCssClasses = function(htmlInput){

    // finds expressions of type {.classname} or {.class1.class2.class3} and
    // replaces it adding css classes to the immediately previous html tag
    
    var regex = /(<[A-Za-z]+[^>]*)(>[^<]*){\.([ .A-Za-z0-9_-]+)}/im;
    var out = [], match, html = htmlInput;
    
    while (match = regex.exec(html)) {
        var tag = null;
        
        out.push(html.substr(0, match.index));
        
        var classes = match[3].split(/[ \.]+/);
        
        out.push(match[1] + ' class="' + classes.join(' ') + '"');
        out.push(match[2]);
        
        html = html.substr(match.index + match[0].length);
        
    }
    
    out.push(html);
    
    return out.join('');
};

/**
 * Combines option objects
 */
pelpa.combineOptions = function(){
    var options = {};
    for (var i = 0, l = arguments.length; i < l; i++) {
        var arg = arguments[i];
        for (var name in arg) {
            if (arg.hasOwnProperty(name)) {
                if (typeof options[name] == 'object' &&
                (!options[name] instanceof Array) &&
                typeof arg == 'object' &&
                (!arg instanceof Array)) {
                    options[name] = pelpa.combineOptions(options[name], arg[name]);
                }
                else {
                    options[name] = arg[name];
                }
            }
        }
    }
    return options;
}

pelpa.build = function(metadata){

    if (typeof metadata == 'undefined' || typeof metadata == 'string') {
        metadata = JSON.parse(fs.readFileSync(metadata || 'metadata.json').toString());
    }
    
    metadata = pelpa.combineOptions({
        files: {
            input: 'content/*.md',
            layout: 'layout.htm',
            output: 'index.htm'
        }
    }, metadata);
        
    var html = fs.readFileSync(metadata.files.layout).toString();
    
    // lookup placeholders
    var phRegex = /\${([-_A-Za-z0-9\*]+)}/gim, phMatch;
    var placeholders = [];
    while (phMatch = phRegex.exec(html)) {
        placeholders.push(phMatch[1].toLowerCase());
    }
    
    var mdfiles = [];
    var placeholdersMd = {};
    
    var addContentFile = function(filename, fullpath){
        for (var i = 0; i < placeholders.length; i++) {
            var phname = placeholders[i];
            var phregex = (phname.indexOf('*') >= 0) ? new RegExp(phname.replace(/\*/, '.*')) : null;
            var fname = path.basename(filename, '.md').toLowerCase();
            if ((phregex && phregex.test(fname)) ||
            (phname === fname)) {
                mdfiles.push(fullpath);
                placeholdersMd[phname] = (placeholdersMd[phname] || '') +
                fs.readFileSync(fullpath).toString();
                return;
            }
        }
    };
    
    // load content files
    var inputs = metadata.files.input.split(',');
    for (var ii = 0; ii < inputs.length; ii++) {
        var input = inputs[ii];
        if (input.indexOf('*') >= 0) {
            var dir = path.dirname(input);
            var files = fs.readdirSync(dir);
            var fileRegex = new RegExp(path.basename(input).replace(/\./, '\\.').replace(/\*/g, '.*'));
            for (var i = 0, l = files.length; i < l; i++) {
                var f = path.join(dir, files[i]);
                if (fileRegex.test(f)) {
                    addContentFile(files[i], f);
                }
            }
        }
        else {
            if (path.existsSync(input)) {
                addContentFile(path.basename(input), input);
            }
        }
    }
    
    if (mdfiles.length < 1) {
        throw 'no content files found';
    }
    
    var fillPlaceholder = function(name, phhtml){
        if (typeof phhtml == 'undefined' || phhtml == null) {
            var phmd = placeholdersMd[name] || '';
            if (phmd) {
                phhtml = pelpa.markdownToHtml(phmd);
            }
        }
        
        html = html.replace('${' + name + '}', phhtml);
    }
    
    // file content sections
    for (var i = 0; i < placeholders.length; i++) {
        if (placeholders[i] !== 'index' &&
        placeholders[i] !== 'title' &&
        placeholders[i] !== 'meta_author' &&
        placeholders[i] !== 'meta_keywords' &&
        placeholders[i] !== 'meta_description') {
            fillPlaceholder(placeholders[i]);
        }
    }
    
    // build document tree
    var doc = pelpa.parseHtmlTree(html);
    
    html = doc.html;
    
    // fill placeholders dependent on built tree
    if (placeholders.indexOf('title') >= 0) {
        fillPlaceholder('title', doc.tree.text);
    }
    if (placeholders.indexOf('index') >= 0) {
        fillPlaceholder('index', pelpa.treeToHtml(doc.tree));
    }
    if (placeholders.indexOf('meta_author') >= 0) {
        fillPlaceholder('meta_author', metadata.author || '');
    }
    if (placeholders.indexOf('meta_description') >= 0) {
        fillPlaceholder('meta_description', metadata.description || '');
    }
    if (placeholders.indexOf('meta_keywords') >= 0) {
        fillPlaceholder('meta_keywords', metadata.keywords || '');
    }
    
    // set css classes added on content as {.class1.class2}
    html = pelpa.setCssClasses(html);
    
    fs.writeFileSync(metadata.files.output, html);
    
    doc.metadata = metadata;
    
    doc.source = mdfiles;
    
    doc.output = metadata.files.output;
    
    return doc;
};
