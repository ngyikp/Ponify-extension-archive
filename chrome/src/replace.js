/*

	replace.js is part of Ponify (Chrome Extension)

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


var websites, wlist_type, highlight, pseudo_threading, ponify_enabled;
var DOMLock = false;

chrome.extension.sendRequest({method: "getStoarge"}, function(response){

	ponify_enabled = response.ponify_enabled;
	
	if(!ponify_enabled){ return; }

	var url = response.url;	
	websites = response.websites;
	wlist_type = response.wlist_type;
	
	if(!websites.length && wlist_type){ return; }


	var r = /([^\/]+:\/\/)?(www\.)?(([^\/]*)[^\?#]*)/;
	var a = r.exec(url)[3];

	for(var i = 0; i < websites.length; i++){
		var b = r.exec(websites[i][0])[3];
		if((a.substr(0, b.length) == b) != wlist_type){ return; }
	}

	highlight = response.highlight;
	replace = response.replace;
	pseudo_threading = response.pseudo_threading;
	
	ponify(document);
	document.addEventListener("DOMNodeInserted", nodeInserted, true);
});



function adaptive_case_word(word, rep){
	var m = Math.min(rep.length, word.length);

	var r = '';
	var c = 0;
	
	var a = 0;

	var fix_me = [];

	for(var i = 0; i < word.length; i++){
		var t = (word[i] != word[i].toLowerCase());
		c += t;
		
		if(i < m){
			if(/\W|_|\d/.test(word[i])){
				r += rep[i];
				fix_me.push(i);
				a++;
			} else{
				r += t ? rep[i].toUpperCase() : rep[i];
			}
		}
	}
	
	if(a != word.length){
		var avg = Math.round(c / (word.length - a));
	} else{
		var avg = 0;
	}
				
	if(avg){
		for(var i = fix_me.length - 1; i >= 0; i--){
			r = r.substr(0, fix_me[i]) + rep[fix_me[i]].toUpperCase() + r.substr(fix_me[i]+1)
		}
	}
	
	if(rep.length > word.length){
		r += avg
			? rep.substring(word.length).toUpperCase()
			: rep.substring(word.length);
	}

	return r;
}


function adaptive_case_multiword(word, rep){
			
	var ca = [];

	for(var i in word){
		// Prevent small words from polluting the results
		if(word[i].length < 2){ continue; }
		for(var j in word[i]){
			if(/\W|_|\d/.test(word[i][j])){ continue; }
			var c = word[i][j] != word[i][j].toLowerCase();
			if(ca[j] == undefined){
				ca[j] = [];
				ca[j][0] = c;
				ca[j][1] = 1;
			} else{
				ca[j][0] += c;
				ca[j][1]++;
			}
		}
	}

	var c = 0;
	var l = 0;
	
	var fix_me = [];
	
	//Calculate the average case pattern
	for(var i = 0; i < ca.length; i++){
		if(ca[i] != undefined){
			l++;
			ca[i] = Math.round(ca[i][0] / ca[i][1]);
			c += ca[i]
		} else{
			fix_me.push(i);
		}
	}

	// Calculate the average case
	if(ca.length){
		ca.avg = Math.round(c / l);
	} else{
		ca.avg = 0;
	}
	
	// Fill any holes in the average pattern with the average case
	for(var i in fix_me){
		ca[fix_me[i]] = ca.avg;
	}

	var replaced = []

	for(var i = 0; i < rep.length; i++){
		replaced[i] = "";		
		
		switch(i < word.length){
			case true:
				var wl = word[i].replace(/\W|_|\d/g,"");
				var rl = rep[i].replace(/\W|_|\d/g,"");
				if((wl.length > 2 || wl.length >= rl.length) || !ca.length){
					replaced[i] = adaptive_case_word(word[i], rep[i]);
					break;
				}
			default:
				for(var j in rep[i]){
					replaced[i] += (j < ca.length ? ca[j] : ca.avg) ?
						rep[i][j].toUpperCase() : rep[i][j];
				}
				break;					
		}
	}

	return(replaced.join(" "));
}

// Take two words and attempt to make the case of the first word match that
// of the second with as much accuracy as possible.
function adaptive_case(word, rep){
	var aw = word.split(" ");
	var ar = rep.split(" ");
	
	if(Math.max(aw.length, ar.length) != 1){
		return adaptive_case_multiword(aw, ar);
	} else{
		return adaptive_case_word(word, rep);
	}
}


// Ponify a string and return either a text node or a <ponifytext> node depending
// on whether or not advanced highlighting/tooltips are enabled
function ponifyText(v, mode){
	
	// Skip text nodes with nothing but spaces/tabs/etc (there are a lot of these)
	if(!/\S/.test(v)){ return; }
	
	var track = [];
	var p;
	if(mode == undefined){ mode = highlight[0]; }

	for(var i = 0; i < replace.length; i++){
		var r = new RegExp(
			"(^|\\W|_)" +
			replace[i][0].replace(/[\W]/g, "\\$&") +
			"([\\W]|$|_)", "i"
		);
		p = 0;
		var c;
		
		while((c = v.substring(p).search(r)) != -1){
			// Test the first character to see if it's part of the word
			p += c + (/\W|_/.test(v[p + c]) && v[p + c] != replace[i][0][0]);
			var word = v.substring(p, p + replace[i][0].length);				
			var s = adaptive_case(word,replace[i][1]);

			if(!mode){
				v = v.substr(0, p) + s + v.substr(p + word.length);
			} else{
				track.unshift([p, word, s]);
			}
			
			p += word.length;
		}
	}

	if(!mode){ return v; }
	if(!track.length){ return 0; }
		
	track.sort(function(a, b){ return a[0] > b[0] ? -1 : 1; });
								
	var ponify_text = document.createElement("ponifytext");
	
	p = v.length;
	for(var i = 0; i < track.length; i++){

		// Prevent duplicate replacements with pairs like "ladies and gentlemen" "gentlemen"
		if(track[i][0] + track[i][1].length > p){ continue; }
		
		// TextNodes for non-ponified text
		if(track[i][0] + track[i][1].length < p){
			ponify_text.insertBefore(
				document.createTextNode(
					v.substring(track[i][0] + track[i][1].length, p)
				), ponify_text.childNodes[0]
			);
		}
		var ponify = document.createElement("ponify");

		if(mode == 1 || mode == 2){
			ponify.setAttribute("title", track[i][1]);
		}
		if(mode == 1 || mode == 3){
			ponify.style.color = highlight[1];
		}

		ponify.appendChild(document.createTextNode(track[i][2]));
		ponify_text.insertBefore(ponify, ponify_text.childNodes[0])
		p = track[i][0];
	}
	if(p != 0){
		ponify_text.insertBefore(
			document.createTextNode(v.substring(0, p)
		), ponify_text.childNodes[0]);
	}

	return ponify_text;
}

function ponifyReplace(node){
	var rep;
	
	var p = node.parentNode;
	
	if(!p){ return; }
	
	if(p.nodeName == "PRE" || p.nodeName == "TITLE" || p.nodeName == "OPTION"){
		rep = ponifyText(node.nodeValue, 0);
	} else{
		rep = ponifyText(node.nodeValue);		
	}
		
	switch(typeof(rep)){
		case "string":
			node.data = rep;
			break;
		case "object":
			DOMLock = true;
			node.parentNode.replaceChild(rep, node);
			DOMLock = false;
			delete node;
			break;
	}
}

function pseudoThread(text_nodes){
	var l = Math.min(text_nodes.snapshotLength, text_nodes.pos + 100);
	for(text_nodes.pos; text_nodes.pos < l; text_nodes.pos++){
		ponifyReplace(text_nodes.snapshotItem(text_nodes.pos));
	}
	if(text_nodes.snapshotLength - text_nodes.pos){
		setTimeout(function(){ pseudoThread(text_nodes); }, 20);
	}
}

// Ponify the contents of elem and all child nodes
function ponify(elem){
	if(elem.nodeType == 3){
		var p = elem.parentNode;
		
		if(!p){ return; }
		
		var p_name = p.nodeName;
		if(p_name != "STYLE" && p_name != "SCRIPT" && p_name != "TEXTAREA"){
			ponifyReplace(elem);
		}
	} else{
		var text_nodes = document.evaluate(
			".//text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::textarea)]",
			elem, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

		if(text_nodes.snapshotLength){
			if(pseudo_threading){
				text_nodes.pos = 0;
				pseudoThread(text_nodes);
			} else{
				for(var i = 0; i < text_nodes.snapshotLength; i++){
					var node = text_nodes.snapshotItem(i);
					ponifyReplace(node);
				}
			}
		}
	}
}

// Ponify nodes that are added to the document
function nodeInserted(event){
	if(!DOMLock){
		ponify(event.target);
	}
}
