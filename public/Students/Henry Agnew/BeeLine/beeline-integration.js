/**
 * js-cookie v2.2.0 to use with Beeline Reader (to keep reader enabled while browsing site)
 */
!function (e) {
	let n = !1;
	if ("function" == typeof define && define.amd && (define(e), n = !0), "object" == typeof exports && (module.exports = e(), n = !0), !n) {
		const o = window.Cookies, t = window.Cookies = e();
		t.noConflict = function () {
			return window.Cookies = o, t
		}
	}
}(function () {
	function e() {
		for (var e = 0, n = {}; e < arguments.length; e++) {
			const o = arguments[e];
			for (let t in o) n[t] = o[t]
		}
		return n
	}
	
	function n(o) {
		function t(n, r, i) {
			let c;
			if ("undefined" != typeof document) {
				if (arguments.length > 1) {
					if ("number" == typeof (i = e({path: "/"}, t.defaults, i)).expires) {
						const a = new Date;
						a.setMilliseconds(a.getMilliseconds() + 864e5 * i.expires), i.expires = a
					}
					i.expires = i.expires ? i.expires.toUTCString() : "";
					try {
						c = JSON.stringify(r), /^[\{\[]/.test(c) && (r = c)
					} catch (e) {
					}
					r = o.write ? o.write(r, n) : encodeURIComponent(String(r)).replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent), n = (n = (n = encodeURIComponent(String(n))).replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent)).replace(/[\(\)]/g, escape);
					let s = "";
					for (let f in i) i[f] && (s += "; " + f, !0 !== i[f] && (s += "=" + i[f]));
					return document.cookie = n + "=" + r + s
				}
				n || (c = {});
				const p = document.cookie ? document.cookie.split("; ") : [], d = /(%[0-9A-Z]{2})+/g;
				let u = 0;
				for (; u < p.length; u++) {
					const l = p[u].split("=");
					let C = l.slice(1).join("=");
					this.json || '"' !== C.charAt(0) || (C = C.slice(1, -1));
					try {
						const g = l[0].replace(d, decodeURIComponent);
						if (C = o.read ? o.read(C, g) : o(C, g) || C.replace(d, decodeURIComponent), this.json) try {
							C = JSON.parse(C)
						} catch (e) {
						}
						if (n === g) {
							c = C;
							break
						}
						n || (c[g] = C)
					} catch (e) {
					}
				}
				return c
			}
		}
		
		return t.set = t, t.get = function (e) {
			return t.call(t, e)
		}, t.getJSON = function () {
			return t.apply({json: !0}, [].slice.call(arguments))
		}, t.defaults = {}, t.remove = function (n, o) {
			t(n, "", e(o, {expires: -1}))
		}, t.withConverter = n, t
	}
	
	return n(function () {
	})
});

//# sourceMappingURL=/sm/f6937b1819ab68f00d8b787ead6c16bfb67977e0c408909621a3b2ff82dbad4a.map


/**
 * Custom integration code for Beeline Reader
 */
function activateBeeLine() {
	const beelineELements = document.querySelectorAll(".mt-content-container p:not(.boxtitle)");
	
	const doBeeline = function (theme, action) {
		for (let i = 0; i < beelineELements.length; i++) {
			const beeline = new BeeLineReader(beelineELements[i], {
				theme: theme,
				skipBackgroundColor: true,
				handleResize: true,
				skipTags: ['svg', 'h1', 'h3', 'h3', 'h4', 'h3', 'style', 'script', 'blockquote'],
			});
			
			if (theme === "off") {
				beeline.uncolor();
				Cookies.remove("beeline");
				if (typeof ga === 'function') {
					ga('send', 'event', 'Beeline', 'disabled');
				}
			}
			else {
				beeline.color();
				Cookies.set("beeline", theme, {expires: 7});
				if (typeof ga === 'function') {
					ga('send', 'event', 'Beeline', action, theme);
				}
			}
			
			
			const contentContainer = $('.elm-skin-container');
			if (theme === 'night_blues')
				contentContainer.addClass('darkMode');
			else
				contentContainer.removeClass('darkMode');
		}
	};
	
	setBeelineToggles();
	
	function setBeelineToggles() {
		const toggles = $('.beeline-toggles');
		
		if (toggles[0]) {
			const btns = toggles.find('button, a');
			
			btns.click(function (e) {
				if (!e.target.href)
					e.preventDefault();
				const theme = $(this).attr("data-color");
				if (!theme)
					return;
				btns.removeClass('active');
				btns.filter('a[data-color="' + theme + '"]').addClass('active');
				btns.filter('button[data-color="' + theme + '"]').addClass('active');
				
				doBeeline(theme, theme);
			});
		}
	}
	
	/*$(".beeline-header").on("click", function () {
		$(this).closest(".beeline").toggleClass("active");
	});
	
	$(".beeline-header").one("click", function () {
		let defaultTheme = "bright";
		if (typeof (Cookies.get("beeline")) != "undefined") {
			defaultTheme = Cookies.get("beeline");
		}
		$(this).closest(".beeline").find(".beeline-toggle.off").removeClass("active");
		$(this).closest(".beeline").find(".beeline-toggle." + defaultTheme).addClass("active");
		doBeeline(defaultTheme, "enabled");
	});*/
	
	$("#doBeeLine").on("click", function () {
		if (!activateBeeLine.theme && typeof (Cookies.get("beeline")) != "undefined")
			activateBeeLine.theme = Cookies.get("beeline");
		
		const theme = activateBeeLine.theme !== 'bright' ? 'bright' : 'off';
		activateBeeLine.theme = theme;
		event.preventDefault();
		doBeeline(theme, theme);
	});
	
	/*$(".beeline-toggle").on("click", function (event) {
		const theme = $(this).data("beeline-theme");
		
		event.preventDefault();
		
		$(".beeline-toggle").closest(".beeline-toggles").find(".active").removeClass("active");
		$(this).addClass("active");
		doBeeline(theme, "theme change");
	});*/
	
	let tags = document.getElementById('pageTagsHolder').innerText;
	if (navigator.webdriver && tags.includes('beeline:print')) {
		doBeeline('bright', "enabled via tag");
	}
	else if (typeof (Cookies.get("beeline")) != "undefined") {
		doBeeline(Cookies.get("beeline"), "enabled via cookie");
	}
}
