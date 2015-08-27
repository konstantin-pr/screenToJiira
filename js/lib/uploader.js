(function(){
	function addEvent(el, type, fn){
		if(el.addEventListener){
			el.addEventListener(type, fn, false);
		}else if(el.attachEvent){
			el.attachEvent('on' + type, function(){
				fn.call(el);
			});
		}else{
			throw new Error('not supported or DOM not loaded');
		};
	};   
	function addResizeEvent(fn){
		var timeout;
		addEvent(window, 'resize', function(){
			if(timeout){
				clearTimeout(timeout);
			};
			timeout = setTimeout(fn, 100);						
		});
	};   
   	if(false && /*FIX*/ document.documentElement.getBoundingClientRect){
		var getOffset = function(el){
			var box = el.getBoundingClientRect();
			var doc = el.ownerDocument;
			var body = doc.body;
			var docElem = doc.documentElement; // for ie 
			var clientTop = docElem.clientTop || body.clientTop || 0;
			var clientLeft = docElem.clientLeft || body.clientLeft || 0;
			var zoom = 1;			
			if(body.getBoundingClientRect){
				var bound = body.getBoundingClientRect();
				zoom =(bound.right - bound.left) / body.clientWidth;
			};
			if(zoom > 1){
				clientTop = 0;
				clientLeft = 0;
			};
			var top = box.top / zoom + (window.pageYOffset || docElem && docElem.scrollTop / zoom || body.scrollTop / zoom) - clientTop, left = box.left / zoom +(window.pageXOffset || docElem && docElem.scrollLeft / zoom || body.scrollLeft / zoom) - clientLeft;
			return {top: top, left: left};
		};		
	}else{
		var getOffset = function(el){
			var top = 0, left = 0;
			do{
				top += el.offsetTop || 0;
				left += el.offsetLeft || 0;
				el = el.offsetParent;
			}while(el);
			return{
				left: left,
				top: top
			};
		};
	};
	function getBox(el){
		var left, right, top, bottom;
		var offset = getOffset(el);
		left = offset.left;
		top = offset.top;
		right = left + el.offsetWidth;
		bottom = top + el.offsetHeight;
		return{
			left: left,
			right: right,
			top: top,
			bottom: bottom
		};
	};
	function addStyles(el, styles){
		for(var name in styles){
			if(styles.hasOwnProperty(name)){
				el.style[name] = styles[name];
			};
		};
	};
	function copyLayout(from, to, leftTop){
		var box = leftTop ? {left: 0, top: 0, right: from.offsetWidth, bottom: from.offsetHeight} : getBox(from);
		addStyles(to,{
			position: 'absolute',					
			left: box.left + 'px',
			top: box.top + 'px',
			width: from.offsetWidth + 'px',
			height: from.offsetHeight + 'px'
		});		
	};
	var toElement =(function(){
		var div = document.createElement('div');
		return function(html){
			div.innerHTML = html;
			var el = div.firstChild;
			return div.removeChild(el);
		};
	})();
	var getUID =(function(){
		var id = 0;
		return function(){
			return 'AjaxUploader' + id++;
		};
	})();		
	function fileFromPath(file){
		return file.replace(/.*(\/|\\)/, '');
	};
	function getExt(file){
		return(-1 !== file.indexOf('.')) ? file.replace(/.*[.]/, '') : '';
	};
	function hasClass(el, name){		
		var re = new RegExp('\\b' + name + '\\b');		
		return re.test(el.className);
	};   
	function addClass(el, name){
		if(!hasClass(el, name)){   
			el.className = el.className.replace(/^\s+|\s+$/g, '') + ' ' + name;
		};
	};  
	function removeClass(el, name){
		var re = new RegExp('\\b' + name + '\\b');				
		el.className = el.className.replace(re, '');		
	};
	function removeNode(el){
		el.parentNode.removeChild(el);
	};
	window.AjaxUploader = function(button, options){
		if(!button){return null;};
		this._settings = {
			// Location of the server-side upload script
			action: 'upload.php',
			// File upload name
			name: 'userfile',
			// Additional data to send
			data:{},
			// Submit file as soon as it's selected
			autoSubmit: true,
			// The type of data that you're expecting back from the server.
			// Set to "json" in that case. 
			responseType: false,
			// Class applied to button when mouse is hovered
			hoverClass: 'hover',
			progressClass: 'progress',
			// Class applied to button when AU is disabled
			disabledClass: 'disabled',			
			// When user selects a file, useful with autoSubmit disabled
			// You can return false to cancel upload			
			onChange: function(file, extension){
			},
			// Callback to fire before file is uploaded
			// You can return false to cancel upload
			onSubmit: function(file, extension){
			},
			// Fired when file upload is completed
			// WARNING! DO NOT USE "FALSE" STRING AS A RESPONSE!
			onComplete: function(file, response){
			},
			// Add uploader inside button
			encapsulate: false,
			// Put all data to one var 
			prepareRequest: false
		};
		for(var i in options){
			if(options.hasOwnProperty(i)){
				this._settings[i] = options[i];
			};
		};
		button.jquery && (button = button[0]);
		if(typeof button == 'string'){
			if(/^#.*/.test(button)){
				button = button.slice(1);				
			};
			button = document.getElementById(button);
		}if(!button || button.nodeType !== 1){
			throw new Error('Please make sure that you\'re passing a valid element'); 
		}if(button.nodeName.toUpperCase() == 'A'){
			addEvent(button, 'click', function(e){
				if(e && e.preventDefault){
					e.preventDefault();
				}else if(window.event){
					window.event.returnValue = false;
				};
			});
		}
		this.isMobile = navigator.userAgent.match(/iphone|ipad|ipod|android|blackberry|opera mini|iemobile|mobile/i);
		this._button = button;
		this._input = null;
		this._disabled = false;
		this.enable();
		this.isMobile ? this._rerouteClicksEx() : this._rerouteClicks();
	};
	AjaxUploader.prototype = {
		getButton: function(){
			return this._button;
		},
		getData: function(){
			return this._settings.data;
		},
		setData: function(data){
			this._settings.data = data;
		},
		disable: function(){			
			addClass(this._button, this._settings.disabledClass);
			this._disabled = true;
			var nodeName = this._button.nodeName.toUpperCase();			
			if(nodeName == 'INPUT' || nodeName == 'BUTTON'){
				this._button.setAttribute('disabled', 'disabled');
			};
			if(this._input && this._input.parentNode){
				this._input.parentNode.style.visibility = 'hidden';
			};
		},
		enable: function(){
			removeClass(this._button, this._settings.disabledClass);
			this._button.removeAttribute('disabled');
			this._disabled = false;
		},
		_createInput: function(){
			var self = this;
			var input = document.createElement('input');
			input.setAttribute('type', 'file');
			addStyles(input,{
				'position' : 'absolute',
				'right' : 0,
				'margin' : 0,
				'padding' : 0,
				'fontSize' : '480px',
				'height' : '480px',				
				'cursor' : 'pointer'
			});			
			var div = document.createElement("div");						
			addStyles(div,{
				'display' : 'block',
				'position' : 'absolute',
				'overflow' : 'hidden',
				'margin' : 0,
				'padding' : 0,				
				'opacity' : 0,
				'direction' : 'ltr',
				'zIndex': self.isMobile ? '' : 2147483583
			});
			if(div.style.opacity !== '0'){
				if(typeof(div.filters) == 'undefined'){
                    throw new Error('Opacity not supported by the browser');
				};
				div.style.filter = 'alpha(opacity=0)';
			};		  
			addEvent(input, 'change', function(){
				if(!input || input.value === ''){				
					return;				
				};
				var file = fileFromPath(input.value);
				if(false === self._settings.onChange.call(self, file, getExt(file))){
					self._clearInput();				
					return;
				};
				if(self._settings.autoSubmit){
					self.submit();
				};
			});			
			addEvent(input, 'mouseover', function(){
				addClass(self._button, self._settings.hoverClass);
			});
			addEvent(input, 'mouseout', function(){
				removeClass(self._button, self._settings.hoverClass);
				if(!self.isMobile && input.parentNode){
					input.parentNode.style.visibility = 'hidden';
				};
			});   
			div.appendChild(input);
			this._input = input;
			if(this._settings.encapsulate){
				this._button.appendChild(div);
				this._button.style.position = 'relative';
				this._button.style.overflow = 'hidden';
			}else{
				document.body.appendChild(div);
			};
		},
		_clearInput : function(){
			if(!this._input){
				return;
			};	   
			removeNode(this._input.parentNode);
			this._input = null;																   
			this._createInput();
			removeClass(this._button, this._settings.hoverClass);
		},
		_rerouteClicksEx: function(){
			var self = this;
			if(self._disabled){
				return;
			};
			if(!self._input){
				self._createInput();
			};
			var div = self._input.parentNode;							
			copyLayout(self._button, div, self._settings.encapsulate);
			div.style.visibility = 'visible';
		},
		_rerouteClicks: function(){
			var self = this;
			addEvent(self._button, 'mouseover', function(){
				if(self._disabled){
					return;
				};
				if(!self._input){
					self._createInput();
				};
				var div = self._input.parentNode;							
				copyLayout(self._button, div, self._settings.encapsulate);
				div.style.visibility = 'visible';
			});
		},
		_createIframe: function(){
			var id = getUID();			
			var iframe = toElement('<iframe src="javascript:false;" name="' + id + '" />');
			iframe.setAttribute('id', id);
			iframe.style.display = 'none';
			document.body.appendChild(iframe);
			return iframe;
		},
		_createForm: function(iframe){
			var settings = this._settings;
			var form = toElement('<form method="post" enctype="multipart/form-data"></form>');
			form.setAttribute('action', settings.action);
			form.setAttribute('target', iframe.name);								   
			form.style.display = 'none';
			document.body.appendChild(form);
			// Create hidden input element for each data key
			if(settings.prepareRequest){
				for(var prop in settings.data){
					if(settings.data.hasOwnProperty(prop)){
						var el = document.createElement('input');
						el.setAttribute('type', 'hidden');
						el.setAttribute('name', 'request[' + prop + ']');
						el.setAttribute('value', settings.data[prop]);
						form.appendChild(el);
					};
				};
			}else{
				for(var prop in settings.data){
					if(settings.data.hasOwnProperty(prop)){
						var el = document.createElement('input');
						el.setAttribute('type', 'hidden');
						el.setAttribute('name', prop);
						el.setAttribute('value', settings.data[prop]);
						form.appendChild(el);
					};
				};
			};
			return form;
		},
		_getResponse : function(iframe, file){
			var toDeleteFlag = false, self = this, settings = this._settings;
			addEvent(iframe, 'load', function(){				
				if(// For Safari 
					iframe.src == "javascript:'%3Chtml%3E%3C/html%3E';" ||
					// For FF, IE
					iframe.src == "javascript:'<html></html>';"){																		
						// First time around, do not delete.
						// We reload to blank page, so that reloading main page
						// does not re-submit the post.
						if(toDeleteFlag){
							// Fix busy state in FF3
							setTimeout(function(){
								removeNode(iframe);
							}, 0);
						};
						return;
				};
				self._settings.progressClass && removeClass(self._button, self._settings.progressClass);
				var doc = iframe.contentDocument ? iframe.contentDocument : window.frames[iframe.id].document;
				if(doc.readyState && doc.readyState != 'complete'){
				   return;
				};
				if(doc.body && doc.body.innerHTML == "false"){
					return;
				};
				var response;
				if(doc.XMLDocument){
					response = doc.XMLDocument;
				}else if(doc.body){
					response = doc.body.innerHTML;
					if(settings.responseType && settings.responseType.toLowerCase() == 'json'){
						if(doc.body.firstChild && doc.body.firstChild.nodeName.toUpperCase() == 'PRE'){
							response = doc.body.firstChild.firstChild.nodeValue;
						};
						if(response){
							try{
								response = eval('(' + response + ')');
							}catch(e){};
						}else{
							response = {};
						};
					}
				}else{
					response = doc;
				};
				settings.onComplete.call(self, file, response);
				toDeleteFlag = true;
				// Fix IE mixed content issue
				iframe.src = "javascript:'<html></html>';";
			});			
		},		
		submit: function(){	
			var self = this, settings = this._settings;
			if(!this._input || this._input.value === ''){				
				return;				
			};
			this._input.setAttribute('name', this._settings.name);
			var file = fileFromPath(this._input.value);
			if(false === settings.onSubmit.call(this, file, getExt(file))){
				this._clearInput();
                this.isMobile && this._rerouteClicksEx();
				return;
			};
			var iframe = this._createIframe();
			var form = this._createForm(iframe);
			removeNode(this._input.parentNode);
			removeClass(self._button, self._settings.hoverClass);
			form.appendChild(this._input);
			self._settings.progressClass && addClass(self._button, self._settings.progressClass);
			form.submit();
			removeNode(form); form = null;						  
			removeNode(this._input); this._input = null;
			this._getResponse(iframe, file);			
			this.isMobile ? this._rerouteClicksEx() : this._rerouteClicks();
		}
	};
})();