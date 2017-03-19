/*

	popup.js is part of Ponify (Chrome Extension)

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


window.onload = function(){

	var etoggle = document.getElementById("etoggle");
	var eseparator = document.getElementById("eseparator");
	var ptoggle = document.getElementById("ptoggle");
	var dtoggle = document.getElementById("dtoggle");
	var error = document.getElementById("perror");
	
	if(chrome.extension.getViews({type:'tab'}).length > 0){
		etoggle.style.display = "none";
		eseparator.style.display = "none";
		ptoggle.style.display = "none";
		dtoggle.style.display = "none";
		error.style.display = "block";
	} else{
		error.style.display = "none";

		var echeckbox = document.getElementById("echeck");

		echeckbox.onchange = function(){
			ponify_enabled = this.checked;
			localStorage["ponify_enabled"] = JSON.stringify(ponify_enabled);
			
			chrome.extension.sendRequest({method: "update"}, function(response){});
			
			window.close();
		}

		if(ponify_enabled){
			echeckbox.checked = true;
		} else{
			ptoggle.style.display = "none";
			dtoggle.style.display = "none";
			eseparator.style.display = "none";
			return;
		}
		
		var dcheckbox = document.getElementById("dcheck");
		var pcheckbox = document.getElementById("pcheck");
		
		chrome.tabs.getSelected(null, function(tab) {

			var r = /([^\/]+:\/\/)?(www\.)?(([^\/]*)[^\?#]*)/;
			var a = r.exec(tab.url);
						
			if(a[1] == "http://" || a[1] == "https://"){

				var domain;
				var page;
							
				for(var i = 0; i < websites.length; i++){
					var b = r.exec(websites[i][0]);
					
					if(b[3].substr(0, a[3].length) == a[3]){
						page = websites[i][0];
					}
					
					if(a[4] == b[3]){
						domain = websites[i][0];
					}
				}
					
				dcheckbox.checked = (domain == undefined) != wlist_type;
				
				if(domain == undefined){
					domain = a[4];
				}
				
				if(dcheckbox.checked == wlist_type){
					pcheckbox.disabled = true;
					ptoggle.setAttribute("class", "disabled");
				}

				pcheckbox.checked = (page == undefined) != wlist_type;
				
				if(page == undefined){
					page = a[3];
				}
				
							
				pcheckbox.onchange = function(){
					chrome.tabs.update(tab.id, {url: tab.url});
					checkChange(this, page);
				};
				dcheckbox.onchange = function(){
					if(pcheckbox.checked != wlist_type){
						chrome.tabs.update(tab.id, {url: tab.url});
					}
					checkChange(this, domain);
				};
				
			} else{
				dcheckbox.disabled = true;
				pcheckbox.disabled = true;
				ptoggle.setAttribute("class", "disabled");
				dtoggle.setAttribute("class", "disabled");
			}
		});

	}

	document.getElementById("gen").onclick = function(){
		chrome.tabs.create({url:chrome.extension.getURL("options.htm#0")});
	}			
	document.getElementById("rep").onclick = function(){
		chrome.tabs.create({url:chrome.extension.getURL("options.htm#1")});
	}
	document.getElementById("web").onclick = function(){
		chrome.tabs.create({url:chrome.extension.getURL("options.htm#2")});
	}
	document.getElementById("abt").onclick = function(){
		chrome.tabs.create({url:chrome.extension.getURL("options.htm#3")});
	}
}

function checkChange(cb, address){
	if(cb.checked != wlist_type){
		for(var i = 0; i < websites.length; i++){
			if(address == websites[i]){
				websites.splice(i, 1);
			}
		}
	} else{
		websites.push([address]);
	}
	localStorage["websiteList"] = JSON.stringify(websites);

	window.close();
}
