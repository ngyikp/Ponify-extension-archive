/*

	options.js is part of Ponify (Chrome Extension)

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


var pdata;
var pages;

function setEnabled(conf, enable, button, array){
	var conf = document.getElementById(conf);
	var enable = document.getElementById(enable);
	
	if(array.length == 0){
		conf.style.display = "none";
		document.getElementById(button).onclick = function(){
			enable.style.display = "none";
			conf.style.display = "block";			
		}
	} else{
		enable.style.display = "none";
	}
}

function flipSwitch(a, b, d){
	document.getElementById(d ? b : a).setAttribute("class", "");
	document.getElementById(d ? a : b).setAttribute("class", "selected");	
}

function toggleCheckbox(checkbox, obj){
	if(obj){
		var checked = obj.checked = 1 - obj.checked;
		var cl = checked ? "clicked" : "";
		pdata.check_count += checked ? 1 : -1;
		
		checkbox.setAttribute("class", cl);
		if(pdata.check_count + pdata.checked == pdata.length){
			pdata.check.setAttribute("class", cl);
			pdata.checked = checked;
		}
	} else{
		var checked = pdata.checked = 1 - pdata.checked;
		var cl = checked ? "clicked" : "";
		pdata.check.setAttribute("class", cl);
		
		for(var i = 0; i < pdata.length; i++){
			pdata[i].check.setAttribute("class", cl);
			pdata[i].checked = checked;
		}
		pdata.check_count = checked ? pdata.length : 0;
	}
}

function createCheckboxTd(obj){
	var td = document.createElement("td");

	var check = document.createElement("div");

	if(obj){
		obj.checked = 0;
		obj.check = check;
	} else{
		pdata.checked = 0;
		pdata.check = check;
	}
	
	check.onclick = function(){ toggleCheckbox(this, obj); };

	td.appendChild(check);
	return td;
}

function sortTable(c, d){
	var order = pdata.sort_list[c];
	
	order.d += order.d == 1 ? -1 : 1;
	order.style.backgroundImage = order.d == 0 ? "url('img/asc.png')" : "url('img/desc.png')";
	for(var t = 0; t < pdata.sort_list.length; t++){
		if(pdata.sort_list[t] != order){
			pdata.sort_list[t].style.backgroundImage = "url('img/none.png')";
			pdata.sort_list[t].d = -1;
		}
	}
	pdata.sort(function(a, b){
		return a.data[c] > b.data[c] ? 1 : -1;
	});
	if(!d){ pdata.reverse(); }
	for(var i = 0; i < pdata.length; i++){
		pdata.table.removeChild(pdata[i].tr);
		pdata.table.appendChild(pdata[i].tr);
	}
}

function populateTable(table, array, table_data){
	pdata.check_count = 0;
	pdata.column_count = table_data.length;
	pdata.table = table;
	pdata.data = array;
	pdata.sort_list = new Array();

	var tr = document.createElement("tr");
	pdata.table_header = tr;
	tr.appendChild(createCheckboxTd(null));
	for(var i = 0; i < pdata.column_count; i++){
		var td = document.createElement("td");

		var container = document.createElement("div");
		
		container.appendChild(document.createTextNode(table_data[i]));
		
		var order = document.createElement("div");
		order.setAttribute("class", "order");
		order.ident = i;
		order.d = -1;
		order.onclick = function(){ sortTable(this.ident, this.d); };
		
		pdata.sort_list.push(order);
		container.appendChild(order);
		
		td.appendChild(container);
		tr.appendChild(td);
	}
	table.appendChild(tr);
	
	for(var i = 0; i < array.length; i++){
		table.appendChild(createRow(array[i]));
	}
	sortTable(0, 1);
}

function createRow(array){
	var obj = new Object();
	
	obj.data = array;
	obj.tr = document.createElement("tr");
	obj.tr.appendChild(createCheckboxTd(obj));
	
	for(var i = 0; i < array.length; i++){
		var td = document.createElement("td");

		var input = document.createElement("input");
		input.setAttribute("type", "text");
		input.value = array[i];
		input.ident = i;
		input.onfocus = function(){ this.parentNode.setAttribute("class", "selected"); };
		input.onblur = function(){
			var v;
			if(pdata.validate){
				v = pdata.validate(this.value);
			} else{
				v = this.value;
			}
			obj.data[this.ident] = v;
			this.value = v
			this.parentNode.setAttribute("class", "");
		};
		
		td.appendChild(input);
				
		obj.tr.appendChild(td);
	}
	
	pdata.push(obj);
	return obj.tr;
}

function deleteChecked(){
	for(var i = pdata.length - 1; i >= 0 ; i--){
		if(pdata[i].checked){
			pdata.table.removeChild(pdata[i].tr);
			pdata.splice(i, 1);
		}
	}
	pdata.data.splice(0, pdata.data.length);
	for(var i = 0; i < pdata.length; i++){
		pdata.data.push(pdata[i].data);
	}
	pdata.check.setAttribute("class", "");
	pdata.checked = 0;
	pdata.check_count = 0;
}


function addRow(){
	var array = new Array();
	for(var i = 0; i < pdata.column_count; i++){
		array.push("");
	}
	var row = createRow(array);
	pdata.data.unshift(array);
	pdata.table.insertBefore(row, pdata.table_header.nextSibling);
	row.childNodes[1].childNodes[0].focus();
}

function createPGeneral(){
	var page = document.getElementById("p0");
	page.data = null;

	flipSwitch("high00", "high01", highlight[0] == 1 || highlight[0] == 3 ? 1 : 0);	

	document.getElementById("high00").onclick = function(){ 
		flipSwitch("high00", "high01", 1);
		highlight[0] = highlight[0] == 2 ? 1 : 3;
	};
	document.getElementById("high01").onclick = function(){
		flipSwitch("high00", "high01", 0);
		highlight[0] = highlight[0] == 1 ? 2 : 0;
	};
	
	flipSwitch("high10", "high11", highlight[0] == 1 || highlight[0] == 2 ? 1 : 0);	

	document.getElementById("high10").onclick = function(){ 
		flipSwitch("high10", "high11", 1);
		highlight[0] = highlight[0] == 3 ? 1 : 2;
	};
	document.getElementById("high11").onclick = function(){
		flipSwitch("high10", "high11", 0);
		highlight[0] = highlight[0] == 1 ? 3 : 0;
	};
	
	flipSwitch("thr0", "thr1", pseudo_threading);	

	document.getElementById("thr0").onclick = function(){ 
		flipSwitch("thr0", "thr1", 1);
		pseudo_threading = 1;
	};
	document.getElementById("thr1").onclick = function(){
		flipSwitch("thr0", "thr1", 0);
		pseudo_threading = 0;
	};

	var colour_picker = document.getElementById("colour_picker_input");
	colour_picker.parentNode.style.backgroundColor = highlight[1];
	colour_picker.value = highlight[1];
	
	colour_picker.onkeyup = colour_picker.onchange = function(){
		var reg = /#([0-9]|[A-F]){3}|(0-9][A-F]){6}/
		if(reg.test(this.value)){
			this.parentNode.style.backgroundColor = this.value;
			highlight[1] = this.value;
		} else{
			this.parentNode.style.backgroundColor = "#FFFFFF";
			highlight[1] = "#2400FF";
		}
	}
	
	document.getElementById("rep_defaults").onclick = function(){
		if(confirm("Restore Default Replacement List?")){
			saveData();
			localStorage.removeItem("replaceList");
			initVars();
			location.reload();
		}
	}
	
	document.getElementById("web_defaults").onclick = function(){
		if(confirm("Restore Default Website List?")){
			saveData();
			localStorage.removeItem("websiteList");
			localStorage.removeItem("wlist_type");
			initVars();
			location.reload();
		}
	}

	return page;
}


function createPRep(){
	var page = document.getElementById("p1");
	page.data = pdata = new Array();

	// Make user input lower case
	pdata.validate = function(str){
		return str.toLowerCase();
	}
	
	var table = document.getElementById("rl");
	populateTable(table, replace, ["Find", "Replace"]);
	
	document.getElementById("delr").onclick = function(){ deleteChecked(); };
	document.getElementById("addr").onclick = function(){ addRow(); };

	setEnabled("rl_conf", "rl_enable", "rl_enable_button", replace);
	
	return page;
}

function createPWeb(){
	var page = document.getElementById("p2");
	page.data = pdata = new Array();

	// Change the domain to lower case; preserve it for the rest of the url
	pdata.validate = function(str){
		var s = str.match(/(([^\/]+:\/\/)?(www\.)?([^\/]*))(.*)/i);
		return s[1].toLowerCase() + s[5];
	}
	
	var table = document.getElementById("wl");
	populateTable(table, websites, ["Websites"]);
	
	flipSwitch("blackw", "whitew", wlist_type ? 0 : 1);
	
	document.getElementById("delw").onclick = function(){ deleteChecked(); };
	document.getElementById("addw").onclick = function(){ addRow(); };
	document.getElementById("blackw").onclick = function(){ 
		flipSwitch("blackw", "whitew", 1);
		wlist_type = 0;
	};
	document.getElementById("whitew").onclick = function(){
		flipSwitch("blackw", "whitew", 0);
		wlist_type = 1;
	};
		
	setEnabled("wl_conf", "wl_enable", "wl_enable_button", websites);
	
	return page;
}

function createPAbout(){
	var page = document.getElementById("p3");
	page.data = null;
	
	return page;
}


window.onload = function(){
	pages = [
		createPGeneral(),
		createPRep(),
		createPWeb(),
		createPAbout(),
	];
		
	for(var i = 0; i < pages.length; i++){
		pages[i].tab = document.getElementById("t" + i);
		pages[i].help = document.getElementById("h" + i);
		pages[i].tab.ident = i;
		pages[i].tab.onclick = function(){
			pages[pages.last_page].tab.setAttribute("class", "");
			pages[pages.last_page].style.display = "none";
			pages[pages.last_page].help.style.display = "none";
			
			pdata = pages[this.ident].data;
			this.setAttribute("class", "clicked");
			pages[this.ident].style.display = "inline";
			pages[this.ident].help.style.display = "inline-block";
			pages.last_page = this.ident;
		}
	}
	
	var pnum = 0;
	if(i = location.href.search(/#/)){
		pnum = parseInt(location.href.substr(i + 1));
		pnum = isNaN(pnum) ? 0 : pnum;
	}
	
	pdata = pages[pnum].data;
	pages[pnum].tab.setAttribute("class", "clicked");
	pages[pnum].style.display = "inline";
	pages[pnum].help.style.display = "inline-block";
	pages.last_page = pnum;

}

function saveData(){
	// Remove empty searches
	var rep = replace.slice(0);
	for(var i = rep.length - 1; i >= 0; i--){
		if(rep[i][0] == ""){
			rep.splice(i, 1);
		}
	}
	
	// Sort by length to give longer matches priority
	rep.sort(function(a, b){
		return a[0].length < b[0].length ? 1 : -1;
	});
	
	
	// Remove empty websites
	var web = websites.slice(0);
	for(var i = web.length - 1; i >= 0; i--){
		if(web[i][0] == ""){
			web.splice(i, 1);
		}
	}
	
	localStorage["websiteList"] = JSON.stringify(web);
	localStorage["wlist_type"] = JSON.stringify(wlist_type);
	localStorage["pseudo_threading"] = JSON.stringify(pseudo_threading);
	localStorage["replaceList"] = JSON.stringify(rep);
	localStorage["highlight"] = JSON.stringify(highlight);
}

window.onunload = window.onblur = function(){
	saveData();
}
