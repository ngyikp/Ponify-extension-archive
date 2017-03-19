/*

	prefs.js is part of Ponify (Firefox Add-on)

	Copyright 2011 Ben Ashton <ben_ashton@gmx.co.uk>

	Ponify is free software; you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation; either version 2 of the License, or
	(at your option) any later version.

	Ponify is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with Ponify; if not, write to the Free Software
	Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
	MA 02110-1301, USA.
	
*/

var rep_view = new treeView("replace");
rep_view.validate = function(value){
	return value.toLowerCase();
}

var web_view = new treeView("websites");
web_view.validate = function(value){
	value = value.match(/(([^\/]+:\/\/)?(www\.)?([^\/]*))(.*)/i);
	return value[1].toLowerCase() + value[5];
}

function treeView(prefString){
	this.rowCount = 0;
	this.array = null;
	this.sort = [0, 0];
	this.no_sort = false;
	this.tree = null;
	this.prefString = prefString;
	this.prefId = "pref_" + prefString;
}

treeView.prototype.setTreeView = function(tree){
	this.tree = tree;
	var self = this;
	tree.addEventListener("keypress", function(event){ self.onKeyPress(event); }, true);
	tree.addEventListener("change", function(event){ event.stopPropagation(); }, true);
	tree.addEventListener("input", function(event){ event.stopPropagation(); }, true);
	this.treebox.invalidate();
};
	
treeView.prototype.getCellText = function(row, col){
	return this.array[row][col.index];
};

treeView.prototype.newRow = function(){
	var arr = new Array(this.treebox.columns.count);
	this.array.unshift(arr);
	this.rowCount++;
	this.treebox.rowCountChanged(0, 1);
	this.treebox.scrollToRow(0);
	var col = this.treebox.columns.getFirstColumn();
	this.selection.select(0);
	this.tree.startEditing(0, col);
};

	
treeView.prototype.deleteSelected = function(){

	var start = new Object();
	var end = new Object();
	var rangeCount = this.selection.getRangeCount();

	for (var i = rangeCount - 1; i >= 0; i--){
		this.selection.getRangeAt(i, start, end);
		for (var v = end.value; v >= start.value; v--){
			this.array.splice(v, 1);
		}
	}
	
	this.selection.clearSelection();
	
	// Fire command event
	var evt = document.createEvent("HTMLEvents");
	evt.initEvent("command", true, true);
	this.no_sort = true;
	this.tree.dispatchEvent(evt);
};


treeView.prototype.onSort = function(elem, index){
	var dir = elem.getAttribute("sortDirection") != "ascending";
	dir = index == this.sort[1] ? !this.sort[0] : dir;
	
	this.array.sort(function(a, b){
		return (a[index] > b[index]) != dir ? 1 : -1;
	});
	
	this.sort[0] = dir;
	this.sort[1] = index;
	elem.setAttribute("sortDirection", dir ? "descending" : "ascending");
	
	this.treebox.invalidate();
};
	
treeView.prototype.onKeyPress = function(event){
	if(event.keyCode == KeyEvent.DOM_VK_TAB){
		var c = this.tree.editingColumn;
		var r = this.tree.editingRow;
		if(r == null || c == null){ return; }
		
		c = c.index;
		var nc = this.treebox.columns.count;
		var nr = this.rowCount;
		var s = event.shiftKey;
		
		// Use fancy mathematics to muddle the issue
		r += ((c==(!s*(nc-1)))&&(r!=((nr-1)*!s)))?1-2*s:0
		c = nc-1?((c==(!s*(nc-1)))?s*(nc-1):c+1-2*s):0
		
		c = this.treebox.columns.getColumnAt(c);
		this.selection.select(r);

		var self = this;
		setTimeout(function(){ self.tree.startEditing(r, c); }, 0);
	}
};
	
treeView.prototype.setCellText = function(row, col, value){
	value = this.validate(value);
	if(this.array[row][col.index] != value){
		this.array[row][col.index] = value;
		
		// Fire command event
		var evt = document.createEvent("HTMLEvents");
		evt.initEvent("command", true, true);
		this.no_sort = true;
		this.tree.dispatchEvent(evt);
	}
};
	
treeView.prototype.setTree = function(treebox){ this.treebox = treebox; };
treeView.prototype.isContainer = function(row){ return false; };
treeView.prototype.isSeparator = function(row){ return false; };
treeView.prototype.isEditable = function(row, col){ return true; };
treeView.prototype.isSorted = function(){ return false; };
treeView.prototype.getLevel = function(row){ return 0; };
treeView.prototype.getImageSrc = function(row, col){ return null; };
treeView.prototype.getRowProperties = function(row, props){};
treeView.prototype.getCellProperties = function(row, col, props){};
treeView.prototype.getColumnProperties = function(colid, col, props){};
treeView.prototype.cycleHeader = function(col){};

treeView.prototype.onSyncFromPreference = function(){
	var pref = document.getElementById(this.prefId);
	var value = pref.value == undefined ? pref.defaultValue : pref.value;

	var arr = JSON.parse(value);

	if(this.no_sort){
		this.no_sort = false;
		return;
	}

	var s = this.sort;
	arr.sort(function(a, b){
		return (a[s[1]] > b[s[1]]) != s[0] ? 1 : -1;		
	});
	
	this.array = arr;
	
	var count = this.array.length - this.rowCount;
	this.rowCount = this.array.length;
	
	if(this.tree != null){
		this.treebox.rowCountChanged(0, count);
		this.treebox.invalidate();
	}
}

treeView.prototype.cleanArray = function(){
	for(var i = this.array.length - 1; i >= 0; i--){
		if(this.array[i][0] == ""){
			this.array.splice(i, 1);
		}
	}
	
	// Fire command event
	var evt = document.createEvent("HTMLEvents");
	evt.initEvent("command", true, true);
	this.tree.dispatchEvent(evt);
}

treeView.prototype.onSyncToPreference = function(){
	var count = this.array.length - this.rowCount;
	this.rowCount = this.array.length;
	this.treebox.rowCountChanged(0, count);
	
	var arr = this.array.slice(0);
	arr.sort(function(a, b){
		return a[0].length < b[0].length ? 1 : -1;
	});
	
	return JSON.stringify(arr);
}

treeView.prototype.restoreDefaults = function(){
	let prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
		.getService(Components.interfaces.nsIPromptService);
	if(prompts.confirm(window, "Restore Defaults", "Are you sure?")){
		var pref = document.getElementById(this.prefId);
		pref.reset();
	}
}


function wlistPreferenceSync(type){
	switch(type){
		case 0:
			return document.getElementById("wlist").selectedIndex;
			break;
		default:
			var pref = document.getElementById("pref_wlist_type");
			var value = pref.value == undefined ? pref.defaultValue : pref.value;
			document.getElementById("wlist").selectedIndex = value;
			break;
	}
}


document.addEventListener('DOMContentLoaded', function(event){
	var r_tree = document.getElementById("replaceTree");
	r_tree.view = rep_view;
	rep_view.setTreeView(r_tree);
	
	var w_tree = document.getElementById("websiteTree");
	w_tree.view = web_view;
	web_view.setTreeView(w_tree);	
}, false);


window.addEventListener('beforeunload', function(event){
	rep_view.cleanArray();
	wep_view.cleanArray();
});
