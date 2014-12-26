/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

module.exports = {
  foo: function () {
    // whatever
  },
  buildHierarchy: function (arry, type) {

    var roots = [], children = {}, list = [];

    // find the top level nodes and hash the children based on parent
    for (var i = 0, len = arry.length; i < len; ++i) {
        var item = arry[i];
        var p = item.parent;
        var target = (p == '#') ? roots : (children[p] || (children[p] = []));
        item.longname = item.text;
        target.push({ value: item });
    }

    // function to recursively build the tree
    var findChildren = function(parent,longname) {
        if (children[parent.value.id]) {
            parent.children = children[parent.value.id];
            for (var i = 0, len = parent.children.length; i < len; ++i) {
                parent.children[i].value.longname = parent.value.longname+'.'+parent.children[i].value.text;
                list.push({text:parent.children[i].value.text, longName:parent.children[i].value.longname,id:parent.children[i].value.id});
                findChildren(parent.children[i],parent.value.longname);
            }
        }
    };

    // enumerate through to handle the case where there are multiple roots
    for (var i = 0, len = roots.length; i < len; ++i) {
        list.push({text:roots[i].value.longname,id:roots[i].value.id});
        findChildren(roots[i]);
    }
    if (type='list') {return list};
    if (type='Treeview') {return roots};        
}

};

