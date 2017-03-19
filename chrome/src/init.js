/*

	init.js is part of Ponify (Chrome Extension)

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


var replace;
var websites;
var wlist_type;
var pseudo_threading;
var ponify_enabled;
var highlight;

function initVars(){
	if(!localStorage["wlist_type"]){
		localStorage["wlist_type"] = JSON.stringify(wlist_type = 0);
	} else{
		wlist_type = JSON.parse(localStorage["wlist_type"]);
	}
	
	if(!localStorage["ponify_enabled"]){
		localStorage["ponify_enabled"] = JSON.stringify(ponify_enabled = 1);
	} else{
		ponify_enabled = JSON.parse(localStorage["ponify_enabled"]);
	}
	
	if(!localStorage["pseudo_threading"]){
		localStorage["pseudo_threading"] = JSON.stringify(pseudo_threading = 0);
	} else{
		pseudo_threading = JSON.parse(localStorage["pseudo_threading"]);
	}

	if(!localStorage["websiteList"]){
		localStorage["websiteList"] = JSON.stringify(websites = []);
	} else{
		websites = JSON.parse(localStorage["websiteList"]);
	}

	if(!localStorage["highlight"]){
		localStorage["highlight"] = JSON.stringify(highlight = [0, "#0700FF"]);
	} else{
		highlight = JSON.parse(localStorage["highlight"]);
	}
	
	if(!localStorage["replaceList"]){
		replace = [
			["confound those dover boys", "confound these ponies"],
			["philadelphia", "fillydelphia"],
			["sure as hell", "sure as hay"],
			["no one else", "no pony else"],
			["girlfriends", "fillyfriends"],
			["doctor who", "doctor whooves"],
			["stalingrad", "stalliongrad"],
			["girlfriend", "fillyfriend"],
			["nottingham", "trottingham"],
			["boyfriends", "coltfriends"],
			["old-timer", "old-trotter"],
			["everybody", "everypony"],
			["gentlemen", "gentlecolts"],
			["manhattan", "manehattan"],
			["trollable", "paraspritable"],
			["high-five", "hoof-five"],
			["boyfriend", "coltfriend"],
			["halloween", "nightmare night"],
			["gentleman", "gentlecolt"],
			["the heck", "the hay"],
			["the hell", "the hay"],
			["bro-fist", "bro-hoof"],
			["handedly", "hoofedly"],
			["naysayer", "neighsayer"],
			["butthurt", "flankhurt"],
			["everyone", "everypony"],
			["handmade", "hoofmade"],
			["trolling", "paraspriting"],
			["miracles", "mareacles"],
			["somebody", "somepony"],
			["bro fist", "bro hoof"],
			["marathon", "mareathon"],
			["children", "foals"],
			["butthurt", "saddle-sore"],
			["someone", "somepony"],
			["america", "amareica"],
			["brofist", "brohoof"],
			["cowgirl", "cowpony"],
			["miracle", "mareacle"],
			["foolish", "foalish"],
			["dr. who", "dr. whooves"],
			["trolled", "parasprited"],
			["anybody", "anypony"],
			["persons", "ponies"],
			["handers", "hoofers"],
			["ladies", "fillies"],
			["dr who", "dr whooves"],
			["trolls", "parasprites"],
			["people", "ponies"],
			["tattoo", "cutie mark"],
			["cowboy", "cowpony"],
			["humans", "ponies"],
			["person", "pony"],
			["nobody", "nopony"],
			["handed", "hoofed"],
			["anyone", "anypony"],
			["woman", "mare"],
			["boner", "wingboner"],
			["troll", "parasprite"],
			["human", "pony"],
			["hands", "hooves"],
			["folks", "foalks"],
			["child", "foal"],
			["money", "bits"],
			["women", "mares"],
			["girls", "fillies"],
			["girl", "filly"],
			["main", "mane"],
			["fool", "foal"],
			["feet", "hooves"],
			["hand", "hoof"],
			["foot", "hoof"],
			["boys", "colts"],
			["boy", "colt"],
			["fap", "clop"],
			["man", "stallion"],
			["men", "stallions"],
			["hey", "hay"]
		];
		localStorage["replaceList"] = JSON.stringify(replace);
	} else{
		replace = JSON.parse(localStorage["replaceList"]);
	}
}

initVars();
