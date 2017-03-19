/*

	main.js is part of Ponify (Firefox Add-on)

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


let Ponify = {

	prefs: null,

	mode: null,
	replace: null,
	websites: null,
	wlist_type: null,
	pseudo_threading: null,
	ponify_enabled: null,
	highlight_colour: null,
	DOMlock: false,

	page: null,
	domain: null,

	openPrefs: function(){
		window.openDialog("chrome://ponify/content/prefs.xul", "", "chrome,titlebar,toolbar,centerscreen,dialog=yes");
	},

	openAbout: function(){
		window.open("chrome://ponify/content/about.xul", "", "chrome,titlebar,centerscreen");
	},

	urlCheck: function(url){
		if(!this.ponify_enabled){ return false; }

		if(!this.websites.length && this.wlist_type){ return false; }

		var r = /([^\/]+:\/\/)?(www\.)?(([^\/]*)[^\?#]*)/;
		var a = r.exec(url);

		if(a[1] != "http://" && a[1] != "https://"){ return false; }

		for(var i = 0; i < this.websites.length; i++){
			if(this.websites[i][0].length == 0){ continue; }
			var b = r.exec(this.websites[i][0])[3];

			if((a[3].substr(0, b.length) == b) != this.wlist_type){
				return false;
			}
		}

		return true;
	},

	updateIcon: function(url){
		var tbutton = document.getElementById("ponify-tbutton");
		
		var url = Ponify.urlCheck(url);
		
		if(!url || !this.ponify_enabled){
			tbutton.setAttribute("enabled", "false");
		} else{
			tbutton.setAttribute("enabled", "true");
		}
	},

	urlListener: {
		QueryInterface: function(aIID){
			if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
				aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
				aIID.equals(Components.interfaces.nsISupports)){
				return this;
			}
			throw Components.results.NS_NOINTERFACE;
		},

		onLocationChange: function(aProgress, aRequest, aURI){
			Ponify.updateIcon(aProgress.DOMWindow.location.href);
		},

		onStateChange: function(a, b, c, d){},
		onProgressChange: function(a, b, c, d, e, f){},
		onStatusChange: function(a, b, c, d){},
		onSecurityChange: function(a, b, c){}
	},

	menuModified: function(menuitem, id){
		var loc = gBrowser.contentDocument.location;

		switch(id){
			case 0:
				this.ponify_enabled = menuitem.hasAttribute("checked");
				this.prefs.setBoolPref("ponify_enabled", this.ponify_enabled);
				this.updateIcon(loc.href);
				break;
			case 1:
				loc.reload();
				this.checkChange(menuitem, this.page);
				break;

			case 2:
				var pcheckbox = document.getElementById("ponify_page");
				if(pcheckbox.hasAttribute("checked") != this.wlist_type){
					loc.reload();
				}
				this.checkChange(menuitem, this.domain);
				break;
			default:
				return;
		}
	},


	checkChange: function(cb, address){
		if(cb.hasAttribute("checked") != this.wlist_type){
			for(var i = 0; i < this.websites.length; i++){
				if(this.websites[i][0].length == 0){ continue; }
				if(address == this.websites[i]){
					this.websites.splice(i, 1);
				}
			}
		} else{
			this.websites.push([address]);
		}
		this.prefs.setCharPref("websites", JSON.stringify(this.websites));
	},

	menuShowing: function(){
		var pcheckbox = document.getElementById("ponify_page");
		var dcheckbox = document.getElementById("ponify_domain");
		var echeckbox = document.getElementById("ponify_enabled");

		if(this.ponify_enabled){
			echeckbox.setAttribute("checked", true);
		} else{
			echeckbox.removeAttribute("checked");
		}

		var r = /([^\/]+:\/\/)?(www\.)?(([^\/]*)[^\?#]*)/;
		var a = r.exec(gBrowser.contentDocument.location.href);

		if(a[1] == "http://" || a[1] == "https://"){

			dcheckbox.removeAttribute("disabled");
			pcheckbox.removeAttribute("disabled");

			this.page = undefined;
			this.domain = undefined;

			for(var i = 0; i < this.websites.length; i++){
				if(this.websites[i][0].length == 0){ continue; }

				var b = r.exec(this.websites[i][0]);

				if(b[3].substr(0, a[3].length) == a[3]){
					this.page = this.websites[i][0];
				}

				if(a[4] == b[3]){
					this.domain = this.websites[i][0];
				}
			}

			if((this.domain == undefined) != this.wlist_type){
				dcheckbox.setAttribute("checked", true);
			} else{
				dcheckbox.removeAttribute("checked");
			}

			if(this.domain == undefined){
				this.domain = a[4];
			}

			if(dcheckbox.hasAttribute("checked") == this.wlist_type){
				pcheckbox.setAttribute("disabled", true);
			} else{
				pcheckbox.removeAttribute("disabled");
			}

			if((this.page == undefined) != this.wlist_type){
				pcheckbox.setAttribute("checked", true);
			} else{
				pcheckbox.removeAttribute("checked");
			}


			if(this.page == undefined){
				this.page = a[3];
			}

		} else{
			dcheckbox.setAttribute("disabled", true);
			pcheckbox.setAttribute("disabled", true);
		}


	},

	shutdown: function(){
		this.prefs.removeObserver("", this);
	},

	startup: function(){
		this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
				.getService(Components.interfaces.nsIPrefService)
				.getBranch("ponify.");
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this.prefs.addObserver("", this, false);

		// First Run
		if(this.prefs.getBoolPref("first_run")){
			this.prefs.setBoolPref("first_run", false);
			var toolbar = document.getElementById("nav-bar");
			toolbar.setAttribute("currentset", toolbar.currentSet + ",ponify-tbutton");
			document.persist(toolbar.id, "currentset");
		}


		var highlight = this.prefs.getBoolPref("highlight");
		var tooltips = this.prefs.getBoolPref("tooltips");
		this.mode = (tooltips != highlight) ? 1 + tooltips + 2 * highlight : highlight;

		this.highlight_colour = this.prefs.getCharPref("highlight_colour");
		this.replace = JSON.parse(this.prefs.getCharPref("replace"));
		this.websites = JSON.parse(this.prefs.getCharPref("websites"));
		this.wlist_type = this.prefs.getIntPref("wlist_type");
		this.pseudo_threading = this.prefs.getBoolPref("pseudo_threading");
		this.ponify_enabled = this.prefs.getBoolPref("ponify_enabled");
	},


	observe: function(subject, topic, data){
		if (topic != "nsPref:changed"){
			return;
		}

		switch(data){
			case "highlight":
			case "tooltips":
				var highlight = this.prefs.getBoolPref("highlight");
				var tooltips = this.prefs.getBoolPref("tooltips");
				this.mode = (tooltips != highlight) ? 1 + tooltips + 2 * highlight : highlight;
				break;
			case "ponify_enabled":
				this.ponify_enabled = this.prefs.getBoolPref("ponify_enabled");
				break;
			case "wlist_type":
				this.wlist_type = this.prefs.getIntPref("wlist_type");
				break;
			case "highlight_colour":
				this.highlight_colour = this.prefs.getCharPref("highlight_colour");
				break;
			case "replace":
				this.replace = JSON.parse(this.prefs.getCharPref("replace"));
				break;
			case "websites":
				this.websites = JSON.parse(this.prefs.getCharPref("websites"));
				break;
		}
	},


	adaptive_case_word: function(word, rep){
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
	},


	adaptive_case_multiword: function(word, rep){

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

		// Calculate the average case pattern
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
		console.debug(ca);
		console.debug(JSON.stringify(ca));
		console.debug(JSON.stringify(fix_me));
		for(var i in fix_me){
			ca[fix_me[i]] = ca.avg;
		}
		console.debug(JSON.stringify(ca));
		console.debug(JSON.stringify(fix_me));
		console.debug(ca.avg);

		var replaced = []

		for(var i = 0; i < rep.length; i++){
			replaced[i] = "";

			switch(i < word.length){
				case true:
					var wl = word[i].replace(/\W|_|\d/g,"");
					var rl = rep[i].replace(/\W|_|\d/g,"");
					if((wl.length > 2 || wl.length >= rl.length) || !ca.length){
						replaced[i] = this.adaptive_case_word(word[i], rep[i]);
						break;
					}
				default:
					for(var j = 0; j < rep[i].length; j++){
						replaced[i] += (j < ca.length ? ca[j] : ca.avg) ?
							rep[i][j].toUpperCase() : rep[i][j];
					}
					break;
			}
		}

		return(replaced.join(" "));
	},

	// Take two words and attempt to make the case of the first word match that
	// of the second with as much accuracy as possible.
	adaptive_case: function(word, rep){
		var aw = word.split(" ");
		var ar = rep.split(" ");

		if(Math.max(aw.length, ar.length) != 1){
			return this.adaptive_case_multiword(aw, ar);
		} else{
			return this.adaptive_case_word(word, rep);
		}
	},


	// Ponify a string and return either a text node or a <ponifytext> node depending
	// on whether or not advanced highlighting/tooltips are enabled
	ponifyText: function(doc, v, mode){
		
		// Skip text nodes with nothing but spaces/tabs/etc (there are a lot of these)
		if(!/\S/.test(v)){ return; }
		
		var track = [];
		var p;
		if(mode == undefined){ mode = this.mode; }

		for(var i = 0; i < this.replace.length; i++){

			if(this.replace[i][0].length == 0){ continue; }

			var r = new RegExp(
				"(^|\\W|_)" +
				this.replace[i][0].replace(/[\W]/g, "\\$&") +
				"([\\W]|$|_)", "i"
			);
			p = 0;
			var c;
			
			while((c = v.substring(p).search(r)) != -1){
				// Test the first character to see if it's part of the word
				p += c + (/\W|_/.test(v[p + c]) && v[p + c] != this.replace[i][0][0]);
				var word = v.substring(p, p + this.replace[i][0].length);

				var s = this.adaptive_case(word, this.replace[i][1]);

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

		var ponify_text = doc.createElement("ponifytext");

		p = v.length;
		for(var i = 0; i < track.length; i++){

			// Prevent duplicate replacements with pairs like "ladies and gentlemen" "gentlemen"
			if(track[i][0] + track[i][1].length > p){ continue; }

			// TextNodes for non-ponified text
			if(track[i][0] + track[i][1].length < p){
				ponify_text.insertBefore(
					doc.createTextNode(
						v.substring(track[i][0] + track[i][1].length, p)
					), ponify_text.childNodes[0]
				);
			}
			var ponify = doc.createElement("ponify");

			if(mode == 1 || mode == 2){
				ponify.setAttribute("title", track[i][1]);
			}
			if(mode == 1 || mode == 3){
				ponify.style.color = this.highlight_colour;
			}

			ponify.appendChild(doc.createTextNode(track[i][2]));
			ponify_text.insertBefore(ponify, ponify_text.childNodes[0])
			p = track[i][0];
		}
		if(p != 0){
			ponify_text.insertBefore(
				doc.createTextNode(v.substring(0, p)
			), ponify_text.childNodes[0]);
		}

		return ponify_text;
	},

	ponifyReplace: function(doc, node){
		var rep;

		var p = node.parentNode;

		if(!p){ return; }

		if(p.nodeName == "PRE" || p.nodeName == "TITLE" || p.nodeName == "OPTION"){
			rep = this.ponifyText(doc, node.nodeValue, 0);
		} else{
			rep = this.ponifyText(doc, node.nodeValue);
		}

		switch(typeof(rep)){
			case "string":
				node.data = rep;
				break;
			case "object":
				this.DOMLock = true;
				node.parentNode.replaceChild(rep, node);
				this.DOMLock = false;
				delete node;
				break;
		}
	},

	pseudoThread: function(doc, text_nodes){
		var l = Math.min(text_nodes.snapshotLength, text_nodes.pos + 100);
		for(text_nodes.pos; text_nodes.pos < l; text_nodes.pos++){
			this.ponifyReplace(doc, text_nodes.snapshotItem(text_nodes.pos));
		}
		if(text_nodes.snapshotLength - text_nodes.pos){
			setTimeout(function(){ Ponify.pseudoThread(doc, text_nodes); }, 20);
		}
	},

	// Ponify the contents of elem and all child nodes
	ponify: function(doc, elem){
		if(elem.nodeType == 3){
			var p = elem.parentNode;

			if(!p){ return; }

			var p_name = p.nodeName;
			if(p_name != "STYLE" && p_name != "SCRIPT" && p_name != "TEXTAREA"){
				this.ponifyReplace(doc, elem);
			}
		} else{
			var text_nodes = doc.evaluate(
				".//text()[not(ancestor::script) and not(ancestor::style) and not(ancestor::textarea)]",
				elem, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

			if(text_nodes.snapshotLength){
				if(this.pseudo_threading){
					text_nodes.pos = 0;
					this.pseudoThread(doc, text_nodes);
				} else{
					for(var i = 0; i < text_nodes.snapshotLength; i++){
						var node = text_nodes.snapshotItem(i);
						this.ponifyReplace(doc, node);
					}
				}
			}
		}
	},

	nodeInserted: function(doc, event){
		if(!this.DOMLock){
			this.ponify(doc, event.target);
		}
	},
}

Ponify.startup();

window.addEventListener('load', function(){
	gBrowser.addEventListener('DOMContentLoaded', function(event){
		var doc = event.originalTarget;

		// Get parent URL for iframes
		if(doc.defaultView.frameElement){
			var url = doc.defaultView.top.location.href;
		} else{
			var url = doc.location.href;
		}

		if(Ponify.urlCheck(url)){
			Ponify.ponify(doc, event.target);
			event.target.addEventListener("DOMNodeInserted", function(ev){
				Ponify.nodeInserted(doc, ev);
			}, false);
		}
	}, false);
	gBrowser.addProgressListener(Ponify.urlListener);
}, false);


window.addEventListener("unload", function(){
	Ponify.shutdown();
	gBrowser.removeProgressListener(Ponify.urlListener);
}, false);
