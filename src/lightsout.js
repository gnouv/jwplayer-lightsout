/** @license
 * Lights Out Plugin for JW Player
 *
 * Author: Wesley Luyten
 * Modified by: Gnouv.com
 * Version: 1.1 - (2012/11/21)
 * Version: 2.0 - (2012/12/04)
 * Version: 3.0 - (2016/04/22)
 */

(function(jwplayer) {

	var scripts = document.getElementsByTagName("head")[0].getElementsByTagName('script');
	for (var i = 0; i < scripts.length; i++) {
		var match = scripts[i].src.match(/(.*?)lightsout-?\d?\.js/);
		if (match) {
			var mydir = match[1];
			break;
		}
	}
		
	function main(player, config, div) {
		
		var _this = this;
		var shade, lights;
			
		var defaultConfig = {
			backgroundcolor:		'000000',
			opacity:				0.9,
			time:					800,
			onidle:					'on',
			onplay:					'off',
			onpause:				'on',
			oncomplete:				'on',
			parentid:				null
		};
	
		function setup(e) {
			for (var prp in defaultConfig) {
				if (config[prp] === undefined) config[prp] = defaultConfig[prp];
			}
						
			shade = document.createElement('div');
			shade.className += " lightsout_shade";
			shade.style.display = "none";
			shade.style.backgroundColor = "#" + config.backgroundcolor;
			shade.style.zIndex = 300;
			shade.style.opacity = 0;
			shade.style.filter = "alpha(opacity=0)";
			shade.style.top = 0;
			shade.style.left = 0;
			shade.style.bottom = 0;
			shade.style.right = 0;
			if (config.parentid) {
				shade.style.position = "absolute";
				document.getElementById(config.parentid).style.position = "relative";
				document.getElementById(config.parentid).appendChild(shade);
			} else {
				shade.style.position = "fixed";
				document.body.appendChild(shade);
			}

			shade.onclick = turnOn;
			
			lights = new Lights(shade, config.time, config.opacity, sortPlayers);

			//setup plugin api
			_this.on = lights.on;
			_this.off = lights.off;
			_this.toggle = lights.toggle;
			
			var fragment = createDOM('<div title="Turn Light on" class="jw-icon jw-icon-inline jw-button-color jw-reset jw-icon-light"></div>');
			document.getElementsByClassName('jw-controlbar-right-group')[0].insertBefore(fragment, document.getElementsByClassName('jw-icon-more')[0]);
			
			light_toggle = document.getElementsByClassName('jw-icon-light')[0];
			
			light_toggle.addEventListener('click', function() {
				lights.toggle();
			}, false);
		
			player.onIdle(stateHandler);
			player.onPlay(stateHandler);
			player.onPause(stateHandler);
			player.onComplete(completeHandler);
		}

		function sortPlayers() {
			var i = 0;
			var p;
			while ((p = jwplayer(i++)) && p.hasOwnProperty('id') && i < 100) {
				zIndex(p, 'auto');
			}
			zIndex(player, 301);
		}

		function zIndex(p, value) {
			if (p.getRenderingMode() === "html5") {
				p.getContainer().style.zIndex = value;
			} else {
				p.getContainer().parentNode.style.zIndex = value;
			}
		}

		function turnOn() {
			player.pause(true);
			lights.on();
		}

		function completeHandler(data) {
			if (config.oncomplete == "off") lights.off();
			else lights.on();
		}
		
		function stateHandler(data) {
			switch (player.getState()) {
				case 'IDLE':
					if (config.onidle == "off") lights.off();
					else lights.on();
					break;
				case 'PLAYING':
					if (config.onplay == "off") lights.off();
					else lights.on();
					break;
				case 'PAUSED':
					if (config.onpause == "off") lights.off();
					else lights.on();
					break;
			}
		}

		player.onReady(setup);
		
		this.getDisplayElement = function() {
			return div;
		};
		
		this.resize = function(wid, hei) {
		};
	}
	
	function createDOM(htmlStr) {
		var frag = document.createDocumentFragment(),
			temp = document.createElement('div');
		temp.innerHTML = htmlStr;
		while (temp.firstChild) {
			frag.appendChild(temp.firstChild);
		}
		return frag;
	}
	
	function Lights(element, time, dark, callback) {
		
		this.element = element;
		this.time = time || 1000;
		this.dark = dark || 0.9;
		
		this.opacity = 0;
		
		var _this = this;
		var interval;
		
		var supportOpacity = 'opacity' in this.element.style;
        if (!supportOpacity) this.element.style.zoom = 1;
        
        function setOpacity(o) {
            _this.element.style.opacity = "" + o;
            _this.element.style.filter = "alpha(opacity=" + Math.round(o*100) + ")";
			_this.opacity = o;
        }
		
		this.off = function() {
			if (typeof callback === "function") callback();
			_this.element.style.display = "block";
			clearInterval(interval);
			var t0 = new Date().getTime();
			var o0 = _this.opacity;
			interval = setInterval(function() {
				var dt = (new Date().getTime() - t0) / _this.time;
				if (dt >=1) {
					dt = 1;
					clearInterval(interval);
				}
				setOpacity(_this.dark * dt + o0 * (1-dt));
			}, 1000 / 60);
			
			light_toggle.className += ' jw-toggle';
			light_toggle.setAttribute('title', 'Turn Light off');
		};
		
		this.on = function() {
			clearInterval(interval);
			var t0 = new Date().getTime();
			var o0 = _this.opacity;
			interval = setInterval(function() {
				var dt = (new Date().getTime() - t0) / _this.time;
				if (dt >=1) {
					dt = 1;
					clearInterval(interval);
					_this.element.style.display = "none";
				}
				setOpacity(0 * dt + o0 * (1-dt));
			}, 1000 / 60);
			
			light_toggle.className = light_toggle.className.replace(' jw-toggle', '');
			light_toggle.setAttribute('title', 'Turn Light on');
		};
		
		this.toggle = function() {
			if (_this.opacity < 0.5) {
				_this.off();
			} else {
				_this.on();
			}
		};
	}
	
	jwplayer().registerPlugin('lightsout', '7', main);
	
})(jwplayer);