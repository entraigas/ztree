/**
 * Class constructor
 */
function zTree(name, rootId, config) {
	//main configuration
	this.config = {
		name          : false,    //string
		rootId        : false,    //string
		cookie	      : '',       //string
		prefix        : 'ztree-', //string
		folderLinks	  : true,     //bool
		useSelection  : true,     //bool
		useLines      : true,     //bool
		useIcons      : true,     //bool
		nodeSelected  : ''        //string
	}
	
	//populate config data
	if(config){
		for(key in this.config){
			if(config[key]!==undefined) this.config[key] = config[key];
		}
	}
	this.config.name = name;
	this.config.rootId = rootId;

	//init nodes data
	this.nodes = {
		all : [],
		folder : [],
		openFolder: []
	};
	
	//read values from cookie
	if(this.config.cookie){
		var allCookies = document.cookie.split('; ');
		for (var i=0;i<allCookies.length;i++) {
			var cookiePair = allCookies[i].split('=');
			if( cookiePair[0] === this.config.cookie ){
				var tmp = cookiePair[1].split('|');
				if(tmp[0] && tmp[0].length) this.nodes.openFolder = tmp[0].split(',');
				if(tmp[1] && tmp[1].length) this.config.nodeSelected = tmp[1];
			}
		}
	}
	
	//populate the open folder nodes to the selected node
	if(this.config.nodeSelected){
		this.populateOpenFolderNodes(this.config.nodeSelected);
	}
}


/**
 * Internal recursive function.
 * @param id
 */
zTree.prototype.populateOpenFolderNodes = function(id){
	for (n=0; n<this.nodes.all.length; n++) {
		if( this.nodes.all[n].id == id){
			if(this.nodes.openFolder.indexOf(id) === -1){
				this.nodes.openFolder[this.nodes.openFolder.length] = id;
			}
			this.findOpenPathNodes(this.nodes.all[n].pid);
		}
	}
}

/**
 * Add node
 * @param id node id
 * @param pid node parent id
 * @param name node name/label
 * @param url node url
 * @param title anchor title attr
 * @param icon node ztree icon (check css for available icons)
 */
zTree.prototype.add = function(id, pid, name, url, title, target, icon) {
	this.nodes.all[this.nodes.all.length] = {"id":id+'', "pid":pid+'', "name":name, "url":url, "title":title, "target":target, "icon":icon};
};

/**
 * Print the menu
 */
zTree.prototype.toString = function(){
	//find the root and return the html tree
	for (n=0; n<this.nodes.all.length; n++) {
		if (this.nodes.all[n].id == this.config.rootId) {
			var tree = this.getTreeRecursive(this.nodes.all[n], this.nodes.all);
			return '<div class="ztree">'+ this.node2htm(tree) +'</div>';
		}
	}	
	return 'Not found';
};

/**
 * Internal recursive function.
 * Get sub-tree nodes.
 * @param json node
 * @return json
 */
zTree.prototype.getTreeRecursive = function(node) {
	var n=0, aChildren = [];
	for (n=0; n<this.nodes.all.length; n++) {
		if (this.nodes.all[n].pid == node.id) {
			aChildren.push(this.getTreeRecursive(this.nodes.all[n]));
		}
	}
	if(aChildren.length){
		this.nodes.folder.push(node.id);
		node.children = aChildren;
	}
	return node;
};

/**
 * Internal recursive function.
 * Get node html (and populate nodes.folder).
 * @param json node
 * @param bool last_sibling 
 * @param int indent_level
 * @param sring indent_class
 * @return html string
 */
zTree.prototype.node2htm = function(node, last_sibling, indent_level, indent_class){
	//default values for args...
	last_sibling = (last_sibling===true)? true : false;
	if(!indent_level) indent_level = 0;
	if(!this.config.useLines ) indent_class = ''
	else if( typeof indent_class === 'undefined' ) indent_class = 'ztreeicon-line1';
	
	function indent(indent_level, indent_class){
		var html = '';
		if(indent_level)
			for(n=0; n<indent_level; n++) html += '<span class="'+indent_class+'"></span>';
		return html;
	};
	
	function openCloseIcon(node, has_children, is_open, sibling_count, config){
		var folderIcon = is_open? 'close' : 'open';
		if(!has_children) {
			return (config.useLines)? '<span class="ztreeicon-line' + sibling_count + '"></span>' : '<span></span>';
		}
		if(!config.useLines) sibling_count = 1;
		return '<a href="javascript:' + config.name + '.toogle(' + node.id 
			+ ')"><span class="ztreeicon-' + folderIcon + sibling_count 
			+ '" id="' + config.prefix + 't' + node.id + '"></span></a>';
	};
	
	function folderIcon(node, has_children, is_root, is_open, config){
		if(has_children && !is_root){
			var icon = 'folder';
			if( is_open ){
				icon = node.icon? node.icon : 'folder-open';
			}
			return '<span class="ztreeicon-' + icon + '" id="' + config.prefix + 'i' + node.id + '"></span>';
		}
		if(!node.icon) node.icon = is_root? 'pc' : 'page';
		return '<span class="ztreeicon-' + node.icon + '"></span>';
	};
	
	function nodeLabel(node, is_root, config){
		var url = (node.url)? node.url : 'javascript:void(null)', 
			attr = '', onclick = '';
		if(config.folderLinks){
			onclick += config.name + '.toogle(' + node.id + ');';
		}
		if(config.useSelection && !is_root){
			onclick += config.name + '.select(' + node.id + ');';
			attr += ' id="' + config.prefix + 'l' + node.id + '"';
			if(node.id == config.nodeSelected) attr += ' class="nodeSelected"';
		}
		if(onclick){
			attr += ' onclick="' + onclick + '"';
		}
		if(node.title){
			attr += ' title="' + node.title + '"';
		}
		if(node.target){
			attr += ' target="' + node.target + '"';
		}
		return '<a href="' + url + '"'+ attr + '>' + node.name + '</a>';
	};
	
	//default vars...
	var htmIndent = '', htmOpen = '', htmIcon = ' ', htmLabel = '', htmChildren = '',
		is_root = (node.id==this.config.rootId)? true : false,
		has_children = (node.children && node.children.length)? true : false,
		is_open = (this.nodes.openFolder.indexOf(node.id) !== -1)? true : false,
		sibling_count = last_sibling? '2' : '3';
	
	//indent levels
	htmIndent = indent(indent_level, indent_class);
	
	//open-close icon
	if(!is_root){
		htmOpen = openCloseIcon(node, has_children, is_open, sibling_count, this.config);
	}
	
	//label icon
	if(this.config.useIcons){
		htmIcon = folderIcon(node, has_children, is_root, is_open, this.config);
	}
	
	//label text
	htmLabel = nodeLabel(node, is_root, this.config);
	
	//children nodes...
	if(node.children){
		if(!is_root) indent_level++;
		var length = node.children.length,
			last;
		for (var n=0; n<length; n++) {
			last = (length-1==n)? true : false;
			if(indent_level===0 && last) indent_class = ''; //last branch of the root
			htmChildren += this.node2htm(node.children[n], last, indent_level, indent_class);
		}
	}
	
	if(!is_root){
		var display = is_open? 'block' : 'none';
		htmChildren = '<div id="' + this.config.prefix + node.id + '" style="display:' + display + '">' + htmChildren + '</div>'
	}
	
	//done
	return '<div class="ztreeicon" branch="' + node.id + '">' + htmIndent + htmOpen + htmIcon + htmLabel + htmChildren + '</div>';
};

/**
 * Open/close tree branch.
 * @param int id
 * @param string force [open|close]
 */
zTree.prototype.toogle = function(id, force){
	id = id + '';  //casting to string!
	if(this.nodes.folder.indexOf(id) === -1) return;
	//internal functions
	function fn_open(branch, toogle, icon, iconClass){
		branch.style.display = 'block';
		if(toogle){
			if(toogle.className === 'ztreeicon-open1') toogle.className = 'ztreeicon-close1';
			if(toogle.className === 'ztreeicon-open2') toogle.className = 'ztreeicon-close2';
			if(toogle.className === 'ztreeicon-open3') toogle.className = 'ztreeicon-close3';
		}
		if(icon){
			icon.className = iconClass? 'ztreeicon-' + iconClass : 'ztreeicon-folder-open';
		}
	};
	function fn_close(branch, toogle, icon){
		branch.style.display = 'none';
		if(toogle){
			if(toogle.className === 'ztreeicon-close1') toogle.className = 'ztreeicon-open1';
			if(toogle.className === 'ztreeicon-close2') toogle.className = 'ztreeicon-open2';
			if(toogle.className === 'ztreeicon-close3') toogle.className = 'ztreeicon-open3';
		}
		if(icon){
			icon.className = 'ztreeicon-folder';
		}
	};
	
	//vars
	var block = document.getElementById(this.config.prefix + id);
	if(!block) return;
	var toogle = document.getElementById(this.config.prefix + 't' + id);
	var icon = document.getElementById(this.config.prefix + 'i' + id);
	var iconClass;
	for (var n=0; n<this.nodes.all.length; n++) {
		if( this.nodes.all[n].id == id && this.nodes.all[n].icon ){
			iconClass = this.nodes.all[n].icon;
			n = this.nodes.all.length;
		}
	}
	
	//force open/close
	if(force){
		force = (force=='open')? 'open' : 'close';
	} else {
		force = (block.style.display === 'none')? 'open' : 'close';
	}
	if(force === 'open') {
		this.nodes.openFolder[this.nodes.openFolder.length] = id;
		fn_open(block, toogle, icon, iconClass);
	} else {
		this.nodes.openFolder.removeByVal(id);
		fn_close(block, toogle, icon);
	}
	this.setCookie();
};

/**
 * Open all tree branch
 */
zTree.prototype.openAll = function(){
	for (var n=0; n<this.nodes.folder.length; n++) {
		this.toogle( this.nodes.folder[n], 'open');
	}
}

/**
 * Close all tree branch.
 */
zTree.prototype.closeAll = function(){
	for (var n=0; n<this.nodes.folder.length; n++) {
		if( this.nodes.folder[n] !== this.config.rootId ){
			this.toogle( this.nodes.folder[n], 'close');
		}
	}
}

/**
 * Select a tree node.
 */
zTree.prototype.select = function(id){
	var label = document.getElementById(this.config.prefix + 'l' + id);
	if(!label) return;
	for (var n=0; n<this.nodes.all.length; n++) {
		var element = document.getElementById(this.config.prefix + 'l' + this.nodes.all[n].id);
		if( element && element.className ) element.className = '';
	}
	label.className = "nodeSelected";
	this.config.nodeSelected = id;
	this.setCookie();
}

/**
 * Internal function.
 * Save tree state into a single cookie. (open nodes | selected node)
 */
zTree.prototype.setCookie = function(){
	var expires = "", 
		days = 30,
		value = '';
	if(this.nodes.openFolder.length) value += this.nodes.openFolder.join(',');
	value += '|';
	if(this.config.nodeSelected && this.config.useSelection)
		value += this.config.nodeSelected;
	if(value==='|') days = -1000; //remove the cookie!
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		expires = "; expires="+date.toGMTString();
	}
	document.cookie = this.config.cookie+"="+value+expires+"; path=/";
};

/*
 * Die IE, just die...
 */
if(!Array.prototype.indexOf){
	Array.prototype.indexOf = function(obj, start) {
		 for (var i = (start || 0), j = this.length; i < j; i++) {
			 if (this[i] === obj) { return i; }
		 }
		 return -1;
	}
};
if (!console) {var console = {log:function(){}} };
Array.prototype.removeByVal = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};
