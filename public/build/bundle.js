
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
	'use strict';

	function noop() {}

	function assign(tar, src) {
		for (const k in src) tar[k] = src[k];
		return tar;
	}

	function is_promise(value) {
		return value && typeof value.then === 'function';
	}

	function add_location(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file, line, column, char }
		};
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	function run_all(fns) {
		fns.forEach(run);
	}

	function is_function(thing) {
		return typeof thing === 'function';
	}

	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
	}

	function validate_store(store, name) {
		if (!store || typeof store.subscribe !== 'function') {
			throw new Error(`'${name}' is not a store with a 'subscribe' method`);
		}
	}

	function subscribe(component, store, callback) {
		const unsub = store.subscribe(callback);

		component.$$.on_destroy.push(unsub.unsubscribe
			? () => unsub.unsubscribe()
			: unsub);
	}

	function append(target, node) {
		target.appendChild(node);
	}

	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	function detach(node) {
		node.parentNode.removeChild(node);
	}

	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
	}

	function element(name) {
		return document.createElement(name);
	}

	function svg_element(name) {
		return document.createElementNS('http://www.w3.org/2000/svg', name);
	}

	function text(data) {
		return document.createTextNode(data);
	}

	function space() {
		return text(' ');
	}

	function empty() {
		return text('');
	}

	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else node.setAttribute(attribute, value);
	}

	function children(element) {
		return Array.from(element.childNodes);
	}

	function set_data(text, data) {
		data = '' + data;
		if (text.data !== data) text.data = data;
	}

	function set_style(node, key, value) {
		node.style.setProperty(key, value);
	}

	let current_component;

	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error(`Function called outside component initialization`);
		return current_component;
	}

	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}

	const dirty_components = [];

	const resolved_promise = Promise.resolve();
	let update_scheduled = false;
	const binding_callbacks = [];
	const render_callbacks = [];
	const flush_callbacks = [];

	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	function flush() {
		const seen_callbacks = new Set();

		do {
			// first, call beforeUpdate functions
			// and update components
			while (dirty_components.length) {
				const component = dirty_components.shift();
				set_current_component(component);
				update(component.$$);
			}

			while (binding_callbacks.length) binding_callbacks.shift()();

			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			while (render_callbacks.length) {
				const callback = render_callbacks.pop();
				if (!seen_callbacks.has(callback)) {
					callback();

					// ...so guard against infinite loops
					seen_callbacks.add(callback);
				}
			}
		} while (dirty_components.length);

		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}

		update_scheduled = false;
	}

	function update($$) {
		if ($$.fragment) {
			$$.update($$.dirty);
			run_all($$.before_render);
			$$.fragment.p($$.dirty, $$.ctx);
			$$.dirty = null;

			$$.after_render.forEach(add_render_callback);
		}
	}

	let outros;

	function group_outros() {
		outros = {
			remaining: 0,
			callbacks: []
		};
	}

	function check_outros() {
		if (!outros.remaining) {
			run_all(outros.callbacks);
		}
	}

	function on_outro(callback) {
		outros.callbacks.push(callback);
	}

	function handle_promise(promise, info) {
		const token = info.token = {};

		function update(type, index, key, value) {
			if (info.token !== token) return;

			info.resolved = key && { [key]: value };

			const child_ctx = assign(assign({}, info.ctx), info.resolved);
			const block = type && (info.current = type)(child_ctx);

			if (info.block) {
				if (info.blocks) {
					info.blocks.forEach((block, i) => {
						if (i !== index && block) {
							group_outros();
							on_outro(() => {
								block.d(1);
								info.blocks[i] = null;
							});
							block.o(1);
							check_outros();
						}
					});
				} else {
					info.block.d(1);
				}

				block.c();
				if (block.i) block.i(1);
				block.m(info.mount(), info.anchor);

				flush();
			}

			info.block = block;
			if (info.blocks) info.blocks[index] = block;
		}

		if (is_promise(promise)) {
			promise.then(value => {
				update(info.then, 1, info.value, value);
			}, error => {
				update(info.catch, 2, info.error, error);
			});

			// if we previously had a then/catch block, destroy it
			if (info.current !== info.pending) {
				update(info.pending, 0);
				return true;
			}
		} else {
			if (info.current !== info.then) {
				update(info.then, 1, info.value, promise);
				return true;
			}

			info.resolved = { [info.value]: promise };
		}
	}

	function mount_component(component, target, anchor) {
		const { fragment, on_mount, on_destroy, after_render } = component.$$;

		fragment.m(target, anchor);

		// onMount happens after the initial afterUpdate. Because
		// afterUpdate callbacks happen in reverse order (inner first)
		// we schedule onMount callbacks before afterUpdate callbacks
		add_render_callback(() => {
			const new_on_destroy = on_mount.map(run).filter(is_function);
			if (on_destroy) {
				on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});

		after_render.forEach(add_render_callback);
	}

	function destroy(component, detaching) {
		if (component.$$) {
			run_all(component.$$.on_destroy);
			component.$$.fragment.d(detaching);

			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			component.$$.on_destroy = component.$$.fragment = null;
			component.$$.ctx = {};
		}
	}

	function make_dirty(component, key) {
		if (!component.$$.dirty) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty = blank_object();
		}
		component.$$.dirty[key] = true;
	}

	function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
		const parent_component = current_component;
		set_current_component(component);

		const props = options.props || {};

		const $$ = component.$$ = {
			fragment: null,
			ctx: null,

			// state
			props: prop_names,
			update: noop,
			not_equal: not_equal$$1,
			bound: blank_object(),

			// lifecycle
			on_mount: [],
			on_destroy: [],
			before_render: [],
			after_render: [],
			context: new Map(parent_component ? parent_component.$$.context : []),

			// everything else
			callbacks: blank_object(),
			dirty: null
		};

		let ready = false;

		$$.ctx = instance
			? instance(component, props, (key, value) => {
				if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
					if ($$.bound[key]) $$.bound[key](value);
					if (ready) make_dirty(component, key);
				}
			})
			: props;

		$$.update();
		ready = true;
		run_all($$.before_render);
		$$.fragment = create_fragment($$.ctx);

		if (options.target) {
			if (options.hydrate) {
				$$.fragment.l(children(options.target));
			} else {
				$$.fragment.c();
			}

			if (options.intro && component.$$.fragment.i) component.$$.fragment.i();
			mount_component(component, options.target, options.anchor);
			flush();
		}

		set_current_component(parent_component);
	}

	class SvelteComponent {
		$destroy() {
			destroy(this, true);
			this.$destroy = noop;
		}

		$on(type, callback) {
			const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
			callbacks.push(callback);

			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		$set() {
			// overridden by instance, if it has props
		}
	}

	class SvelteComponentDev extends SvelteComponent {
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error(`'target' is a required option`);
			}

			super();
		}

		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn(`Component was already destroyed`); // eslint-disable-line no-console
			};
		}
	}

	function noop$1() {}

	function safe_not_equal$1(a, b) {
		return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
	}
	function writable(value, start = noop$1) {
	    let stop;
	    const subscribers = [];
	    function set(new_value) {
	        if (safe_not_equal$1(value, new_value)) {
	            value = new_value;
	            if (!stop) {
	                return; // not ready
	            }
	            subscribers.forEach((s) => s[1]());
	            subscribers.forEach((s) => s[0](value));
	        }
	    }
	    function update(fn) {
	        set(fn(value));
	    }
	    function subscribe$$1(run$$1, invalidate = noop$1) {
	        const subscriber = [run$$1, invalidate];
	        subscribers.push(subscriber);
	        if (subscribers.length === 1) {
	            stop = start(set) || noop$1;
	        }
	        run$$1(value);
	        return () => {
	            const index = subscribers.indexOf(subscriber);
	            if (index !== -1) {
	                subscribers.splice(index, 1);
	            }
	            if (subscribers.length === 0) {
	                stop();
	            }
	        };
	    }
	    return { set, update, subscribe: subscribe$$1 };
	}

	let isMobile = writable(false);

	/* src/common/SocialBox.svelte generated by Svelte v3.4.1 */

	const file = "src/common/SocialBox.svelte";

	// (42:0) {:else}
	function create_else_block(ctx) {
		var div, a0, svg0, path0, a0_href_value, t0, a1, svg1, path1, path2, path3, path4, path5, a1_href_value, t1, a2, svg2, path6, a2_href_value;

		return {
			c: function create() {
				div = element("div");
				a0 = element("a");
				svg0 = svg_element("svg");
				path0 = svg_element("path");
				t0 = space();
				a1 = element("a");
				svg1 = svg_element("svg");
				path1 = svg_element("path");
				path2 = svg_element("path");
				path3 = svg_element("path");
				path4 = svg_element("path");
				path5 = svg_element("path");
				t1 = space();
				a2 = element("a");
				svg2 = svg_element("svg");
				path6 = svg_element("path");
				attr(path0, "d", "M11.75,0a11.8,11.8,0,0,0-2,23.42V14.26H7V11H9.79V8.53c0-2.82,1.72-4.35,4.22-4.35a23.11,23.11,0,0,1,2.53.13V7.25H14.8c-1.36,0-1.62.65-1.62,1.61V11h3.25L16,14.26H13.18V23.5A11.8,11.8,0,0,0,11.75,0Z");
				set_style(path0, "fill", ctx.socialIconColor);
				add_location(path0, file, 44, 93, 1798);
				attr(svg0, "xmlns", "http://www.w3.org/2000/svg");
				attr(svg0, "width", "24");
				attr(svg0, "height", "24");
				attr(svg0, "viewBox", "0 0 23.5 23.5");
				add_location(svg0, file, 44, 6, 1711);
				a0.href = a0_href_value = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
				a0.target = "_blank";
				a0.className = "px-2 hover-opacity";
				add_location(a0, file, 43, 4, 1592);
				attr(path1, "d", "M18.8,0H5.2A5.2,5.2,0,0,0,0,5.2V18.8A5.2,5.2,0,0,0,5.2,24H18.8A5.2,5.2,0,0,0,24,18.8V5.2A5.2,5.2,0,0,0,18.8,0Zm0,15.31A28.29,28.29,0,0,1,12,20.38c-.93.39-.79-.25-.76-.47s.13-.75.13-.75a1.76,1.76,0,0,0,0-.79c-.1-.24-.48-.37-.77-.43-4.2-.55-7.31-3.49-7.31-7C3.22,7,7.14,3.85,12,3.85S20.7,7,20.7,10.94a6.34,6.34,0,0,1-1.87,4.37Z");
				set_style(path1, "fill", ctx.socialIconColor);
				add_location(path1, file, 50, 89, 2278);
				attr(path2, "d", "M10.19,9.06H9.57a.17.17,0,0,0-.17.17V13a.17.17,0,0,0,.17.17h.62a.17.17,0,0,0,.17-.17V9.23a.17.17,0,0,0-.17-.17");
				set_style(path2, "fill", ctx.socialIconColor);
				add_location(path2, file, 54, 8, 2684);
				attr(path3, "d", "M14.4,9.06h-.61a.17.17,0,0,0-.17.17v2.26L11.88,9.13l0,0h-.74a.17.17,0,0,0-.17.17V13a.17.17,0,0,0,.17.17h.61a.17.17,0,0,0,.18-.17V10.77l1.74,2.36a.1.1,0,0,0,0,0h.7a.16.16,0,0,0,.17-.17V9.23a.16.16,0,0,0-.17-.17");
				set_style(path3, "fill", ctx.socialIconColor);
				add_location(path3, file, 58, 8, 2875);
				attr(path4, "d", "M8.71,12.25H7v-3a.16.16,0,0,0-.17-.17H6.26a.17.17,0,0,0-.17.17V13a.17.17,0,0,0,0,.12h0a.21.21,0,0,0,.12,0H8.71A.17.17,0,0,0,8.88,13v-.61a.18.18,0,0,0-.17-.17");
				set_style(path4, "fill", ctx.socialIconColor);
				add_location(path4, file, 62, 8, 3165);
				attr(path5, "d", "M17.79,10A.18.18,0,0,0,18,9.84V9.23a.17.17,0,0,0-.17-.17H15.34a.16.16,0,0,0-.12,0h0a.17.17,0,0,0-.05.12V13a.17.17,0,0,0,.05.12h0a.17.17,0,0,0,.12,0h2.45A.17.17,0,0,0,18,13v-.61a.18.18,0,0,0-.17-.17H16.12v-.64h1.67a.18.18,0,0,0,.17-.17v-.62a.18.18,0,0,0-.17-.17H16.12V10Z");
				set_style(path5, "fill", ctx.socialIconColor);
				add_location(path5, file, 66, 8, 3403);
				attr(svg1, "xmlns", "http://www.w3.org/2000/svg");
				attr(svg1, "width", "24");
				attr(svg1, "height", "24");
				attr(svg1, "viewBox", "0 0 24 24");
				add_location(svg1, file, 50, 6, 2195);
				a1.href = a1_href_value = `https://lineit.line.me/share/ui?url=${shareUrl}`;
				a1.target = "_blank";
				a1.className = "px-2 hover-opacity";
				add_location(a1, file, 49, 4, 2085);
				attr(path6, "d", "M162.49,38.91A65.42,65.42,0,0,1,143.93,44a32.21,32.21,0,0,0,14.2-17.74A64.79,64.79,0,0,1,137.63,34a32.2,32.2,0,0,0-55,29.19A92,92,0,0,1,16.14,29.77a31.87,31.87,0,0,0,10,42.74,32.77,32.77,0,0,1-14.64-4v.38a32.09,32.09,0,0,0,25.88,31.38,32.35,32.35,0,0,1-8.48,1.15,34.5,34.5,0,0,1-6.08-.59A32.32,32.32,0,0,0,53,123.05a65.16,65.16,0,0,1-40.09,13.69,61.75,61.75,0,0,1-7.69-.45,92.23,92.23,0,0,0,49.48,14.36c59.36,0,91.84-48.75,91.84-91,0-1.38-.05-2.77-.11-4.13a63.63,63.63,0,0,0,16.11-16.57");
				attr(path6, "transform", "translate(-5.17 -23.92)");
				set_style(path6, "fill", ctx.socialIconColor);
				add_location(path6, file, 72, 97, 3960);
				attr(svg2, "xmlns", "http://www.w3.org/2000/svg");
				attr(svg2, "width", "24");
				attr(svg2, "height", "24");
				attr(svg2, "viewBox", "0 0 157.32 126.73");
				add_location(svg2, file, 72, 6, 3869);
				a2.href = a2_href_value = `https://twitter.com/share?url=${shareUrl}`;
				a2.target = "_blank";
				a2.className = "px-2 hover-opacity";
				add_location(a2, file, 71, 4, 3765);
				div.className = "flex mx-auto";
				add_location(div, file, 42, 2, 1561);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, a0);
				append(a0, svg0);
				append(svg0, path0);
				append(div, t0);
				append(div, a1);
				append(a1, svg1);
				append(svg1, path1);
				append(svg1, path2);
				append(svg1, path3);
				append(svg1, path4);
				append(svg1, path5);
				append(div, t1);
				append(div, a2);
				append(a2, svg2);
				append(svg2, path6);
			},

			p: function update(changed, ctx) {
				if (changed.socialIconColor) {
					set_style(path0, "fill", ctx.socialIconColor);
					set_style(path1, "fill", ctx.socialIconColor);
					set_style(path2, "fill", ctx.socialIconColor);
					set_style(path3, "fill", ctx.socialIconColor);
					set_style(path4, "fill", ctx.socialIconColor);
					set_style(path5, "fill", ctx.socialIconColor);
					set_style(path6, "fill", ctx.socialIconColor);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	// (34:0) {#if $isMobile && !isFacebookApp()}
	function create_if_block(ctx) {
		var div, svg, path;

		return {
			c: function create() {
				div = element("div");
				svg = svg_element("svg");
				path = svg_element("path");
				attr(path, "d", "M18.33,15a4.36,4.36,0,0,0-2.72.95L10.93,13a4.35,4.35,0,0,0,0-1.9l4.68-2.92A4.38,4.38,0,1,0,14,4.78a4.26,4.26,0,0,0,.11,1L9.38,8.65a4.38,4.38,0,1,0,0,6.86l4.68,2.92a4.33,4.33,0,0,0-.11.95A4.38,4.38,0,1,0,18.33,15Z");
				attr(path, "transform", "translate(-2.27 -0.4)");
				set_style(path, "fill", ctx.socialIconColor);
				add_location(path, file, 35, 93, 1215);
				attr(svg, "xmlns", "http://www.w3.org/2000/svg");
				attr(svg, "width", "24");
				attr(svg, "height", "24");
				attr(svg, "viewBox", "0 0 20.44 23.36");
				add_location(svg, file, 35, 4, 1126);
				div.className = "px-2";
				div.id = "mobile-share-icon";
				add_location(div, file, 34, 2, 1080);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, svg);
				append(svg, path);
			},

			p: function update(changed, ctx) {
				if (changed.socialIconColor) {
					set_style(path, "fill", ctx.socialIconColor);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	function create_fragment(ctx) {
		var if_block_anchor;

		function select_block_type(ctx) {
			if (ctx.$isMobile && !isFacebookApp()) return create_if_block;
			return create_else_block;
		}

		var current_block_type = select_block_type(ctx);
		var if_block = current_block_type(ctx);

		return {
			c: function create() {
				if_block.c();
				if_block_anchor = empty();
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				if_block.m(target, anchor);
				insert(target, if_block_anchor, anchor);
			},

			p: function update(changed, ctx) {
				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(changed, ctx);
				} else {
					if_block.d(1);
					if_block = current_block_type(ctx);
					if (if_block) {
						if_block.c();
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if_block.d(detaching);

				if (detaching) {
					detach(if_block_anchor);
				}
			}
		};
	}

	let shareUrl = 'https://www.thenewslens.com/interactive/144635';

	let tnlDomainPageId = 144635;

	function isFacebookApp() {
	  var ua = navigator.userAgent || navigator.vendor || window.opera;
	  return ua.indexOf('FBAN') > -1 || ua.indexOf('FBAV') > -1
	}

	function instance($$self, $$props, $$invalidate) {
		let $isMobile;

		validate_store(isMobile, 'isMobile');
		subscribe($$self, isMobile, $$value => { $isMobile = $$value; $$invalidate('$isMobile', $isMobile); });

		
	  let { socialIconColor = '#484748' } = $$props;

	  let webShareIcon;

	  onMount(() => {
	    // if user is on mobile device add event listener to 'mobile-share-icon' element
	    if ($isMobile && !isFacebookApp()) {
	      $$invalidate('webShareIcon', webShareIcon = document.getElementById('mobile-share-icon'));
	      webShareIcon.addEventListener('click', async () => {
	        if (navigator.share) {
	          navigator
	            .share({
	              url: tnlDomainPageId,
	            })
	            .then(() => console.log('successful share!'))
	            .catch((error) => console.log('error sharing!', error));
	        }
	      });
	    }
	  });

		$$self.$set = $$props => {
			if ('socialIconColor' in $$props) $$invalidate('socialIconColor', socialIconColor = $$props.socialIconColor);
		};

		return { socialIconColor, $isMobile };
	}

	class SocialBox extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, ["socialIconColor"]);
		}

		get socialIconColor() {
			throw new Error("<SocialBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set socialIconColor(value) {
			throw new Error("<SocialBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/common/Header.svelte generated by Svelte v3.4.1 */

	const file$1 = "src/common/Header.svelte";

	function create_fragment$1(ctx) {
		var header, div0, a, figure, img, t, div1, current;

		var socialbox = new SocialBox({
			props: { socialIconColor: ctx.socialIconColor },
			$$inline: true
		});

		return {
			c: function create() {
				header = element("header");
				div0 = element("div");
				a = element("a");
				figure = element("figure");
				img = element("img");
				t = space();
				div1 = element("div");
				socialbox.$$.fragment.c();
				img.src = "https://image3.thenewslens.com/assets/web/publisher-photo-1.png";
				img.alt = "Tne News Lens logo";
				img.className = "svelte-fpaa3l";
				add_location(img, file$1, 16, 8, 382);
				figure.className = "ml-2";
				add_location(figure, file$1, 15, 6, 352);
				a.href = ctx.homePageUrl;
				add_location(a, file$1, 14, 4, 323);
				div0.className = "inline-block";
				add_location(div0, file$1, 13, 2, 292);
				div1.className = "inline-block";
				add_location(div1, file$1, 20, 2, 521);
				header.className = "relative flex justify-between bg-white py-2 px-2 shadow z-10";
				add_location(header, file$1, 12, 0, 212);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, header, anchor);
				append(header, div0);
				append(div0, a);
				append(a, figure);
				append(figure, img);
				append(header, t);
				append(header, div1);
				mount_component(socialbox, div1, null);
				current = true;
			},

			p: function update(changed, ctx) {
				if (!current || changed.homePageUrl) {
					a.href = ctx.homePageUrl;
				}

				var socialbox_changes = {};
				if (changed.socialIconColor) socialbox_changes.socialIconColor = ctx.socialIconColor;
				socialbox.$set(socialbox_changes);
			},

			i: function intro(local) {
				if (current) return;
				socialbox.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				socialbox.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(header);
				}

				socialbox.$destroy();
			}
		};
	}

	function instance$1($$self, $$props, $$invalidate) {
		let { homePageUrl = 'https://www.thenewslens.com/', socialIconColor = '#807F80' } = $$props;

		$$self.$set = $$props => {
			if ('homePageUrl' in $$props) $$invalidate('homePageUrl', homePageUrl = $$props.homePageUrl);
			if ('socialIconColor' in $$props) $$invalidate('socialIconColor', socialIconColor = $$props.socialIconColor);
		};

		return { homePageUrl, socialIconColor };
	}

	class Header extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$1, safe_not_equal, ["homePageUrl", "socialIconColor"]);
		}

		get homePageUrl() {
			throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set homePageUrl(value) {
			throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get socialIconColor() {
			throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set socialIconColor(value) {
			throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/common/Footer.svelte generated by Svelte v3.4.1 */

	const file$2 = "src/common/Footer.svelte";

	function create_fragment$2(ctx) {
		var footer, div1, a, figure, img, img_src_value, t0, div0, t1;

		return {
			c: function create() {
				footer = element("footer");
				div1 = element("div");
				a = element("a");
				figure = element("figure");
				img = element("img");
				t0 = space();
				div0 = element("div");
				t1 = text("Copyright © 2020 The News Lens 關鍵評論");
				img.className = "mx-auto my-2";
				img.width = "250px";
				img.src = img_src_value = `${ctx.tnlLogoUrl}?utm_source=TNL-interactive&utm_medium=footer&utm_campaign=${ctx.projectName}`;
				img.alt = "tnl-white-logo";
				add_location(img, file$2, 12, 8, 485);
				figure.className = "mx-auto my-2";
				add_location(figure, file$2, 11, 6, 447);
				a.href = ctx.homePageUrl;
				add_location(a, file$2, 10, 4, 418);
				div0.className = "text-xs md:text-sm pt-2";
				set_style(div0, "color", ctx.copyRightColor);
				add_location(div0, file$2, 20, 4, 721);
				div1.className = "text-center p-8 text-white font-light tracking-wide";
				set_style(div1, "background-color", ctx.bgColor);
				add_location(div1, file$2, 9, 2, 311);
				add_location(footer, file$2, 8, 0, 300);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, footer, anchor);
				append(footer, div1);
				append(div1, a);
				append(a, figure);
				append(figure, img);
				append(div1, t0);
				append(div1, div0);
				append(div0, t1);
			},

			p: function update(changed, ctx) {
				if ((changed.tnlLogoUrl || changed.projectName) && img_src_value !== (img_src_value = `${ctx.tnlLogoUrl}?utm_source=TNL-interactive&utm_medium=footer&utm_campaign=${ctx.projectName}`)) {
					img.src = img_src_value;
				}

				if (changed.homePageUrl) {
					a.href = ctx.homePageUrl;
				}

				if (changed.copyRightColor) {
					set_style(div0, "color", ctx.copyRightColor);
				}

				if (changed.bgColor) {
					set_style(div1, "background-color", ctx.bgColor);
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(footer);
				}
			}
		};
	}

	function instance$2($$self, $$props, $$invalidate) {
		let { bgColor = 'black', projectName = '', copyRightColor = 'white', homePageUrl = 'https://www.thenewslens.com/', tnlLogoUrl = 'https://datastore.thenewslens.com/infographic/assets/tnl-logo/tnl-footer-dark-bg-logo.png' } = $$props;

		$$self.$set = $$props => {
			if ('bgColor' in $$props) $$invalidate('bgColor', bgColor = $$props.bgColor);
			if ('projectName' in $$props) $$invalidate('projectName', projectName = $$props.projectName);
			if ('copyRightColor' in $$props) $$invalidate('copyRightColor', copyRightColor = $$props.copyRightColor);
			if ('homePageUrl' in $$props) $$invalidate('homePageUrl', homePageUrl = $$props.homePageUrl);
			if ('tnlLogoUrl' in $$props) $$invalidate('tnlLogoUrl', tnlLogoUrl = $$props.tnlLogoUrl);
		};

		return {
			bgColor,
			projectName,
			copyRightColor,
			homePageUrl,
			tnlLogoUrl
		};
	}

	class Footer extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$2, create_fragment$2, safe_not_equal, ["bgColor", "projectName", "copyRightColor", "homePageUrl", "tnlLogoUrl"]);
		}

		get bgColor() {
			throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set bgColor(value) {
			throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get projectName() {
			throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set projectName(value) {
			throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get copyRightColor() {
			throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set copyRightColor(value) {
			throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get homePageUrl() {
			throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set homePageUrl(value) {
			throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get tnlLogoUrl() {
			throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set tnlLogoUrl(value) {
			throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	const contentDataUrl = `https://datastore.thenewslens.com/infographic/house-price-2020/house-price-2020.json?${Date.now()}`;

	const ContentDataStore = writable(undefined, async set => {
	  const res = await fetch(contentDataUrl);
	  const data = await res.json();
	  set(data);
	  return () => {}
	});

	/* src/common/BasicParagraphs.svelte generated by Svelte v3.4.1 */

	const file$3 = "src/common/BasicParagraphs.svelte";

	function get_each_context(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.type = list[i].type;
		child_ctx.value = list[i].value;
		return child_ctx;
	}

	// (43:2) {#if $ContentDataStore}
	function create_if_block$1(ctx) {
		var each_1_anchor;

		var each_value = ctx.basicPragraphsData;

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		return {
			c: function create() {
				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				each_1_anchor = empty();
			},

			m: function mount(target, anchor) {
				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(target, anchor);
				}

				insert(target, each_1_anchor, anchor);
			},

			p: function update(changed, ctx) {
				if (changed.basicPragraphsData) {
					each_value = ctx.basicPragraphsData;

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value.length;
				}
			},

			d: function destroy(detaching) {
				destroy_each(each_blocks, detaching);

				if (detaching) {
					detach(each_1_anchor);
				}
			}
		};
	}

	// (49:33) 
	function create_if_block_3(ctx) {
		var figure, img, img_src_value, img_alt_value, t0, t1;

		var if_block = (ctx.value.note) && create_if_block_4(ctx);

		return {
			c: function create() {
				figure = element("figure");
				img = element("img");
				t0 = space();
				if (if_block) if_block.c();
				t1 = space();
				img.src = img_src_value = ctx.value.url;
				img.alt = img_alt_value = ctx.value.discription;
				add_location(img, file$3, 50, 10, 1198);
				figure.className = "img-wrapper";
				add_location(figure, file$3, 49, 8, 1159);
			},

			m: function mount(target, anchor) {
				insert(target, figure, anchor);
				append(figure, img);
				append(figure, t0);
				if (if_block) if_block.m(figure, null);
				append(figure, t1);
			},

			p: function update(changed, ctx) {
				if ((changed.basicPragraphsData) && img_src_value !== (img_src_value = ctx.value.url)) {
					img.src = img_src_value;
				}

				if ((changed.basicPragraphsData) && img_alt_value !== (img_alt_value = ctx.value.discription)) {
					img.alt = img_alt_value;
				}

				if (ctx.value.note) {
					if (if_block) {
						if_block.p(changed, ctx);
					} else {
						if_block = create_if_block_4(ctx);
						if_block.c();
						if_block.m(figure, t1);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(figure);
				}

				if (if_block) if_block.d();
			}
		};
	}

	// (47:36) 
	function create_if_block_2(ctx) {
		var h3, t_value = ctx.value, t;

		return {
			c: function create() {
				h3 = element("h3");
				t = text(t_value);
				add_location(h3, file$3, 47, 8, 1100);
			},

			m: function mount(target, anchor) {
				insert(target, h3, anchor);
				append(h3, t);
			},

			p: function update(changed, ctx) {
				if ((changed.basicPragraphsData) && t_value !== (t_value = ctx.value)) {
					set_data(t, t_value);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(h3);
				}
			}
		};
	}

	// (45:6) {#if type === 'text'}
	function create_if_block_1(ctx) {
		var p, t_value = ctx.value, t;

		return {
			c: function create() {
				p = element("p");
				t = text(t_value);
				add_location(p, file$3, 45, 8, 1040);
			},

			m: function mount(target, anchor) {
				insert(target, p, anchor);
				append(p, t);
			},

			p: function update(changed, ctx) {
				if ((changed.basicPragraphsData) && t_value !== (t_value = ctx.value)) {
					set_data(t, t_value);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(p);
				}
			}
		};
	}

	// (52:10) {#if value.note}
	function create_if_block_4(ctx) {
		var figcaption, t_value = ctx.value.note, t;

		return {
			c: function create() {
				figcaption = element("figcaption");
				t = text(t_value);
				figcaption.className = "svelte-18blbr1";
				add_location(figcaption, file$3, 52, 12, 1285);
			},

			m: function mount(target, anchor) {
				insert(target, figcaption, anchor);
				append(figcaption, t);
			},

			p: function update(changed, ctx) {
				if ((changed.basicPragraphsData) && t_value !== (t_value = ctx.value.note)) {
					set_data(t, t_value);
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(figcaption);
				}
			}
		};
	}

	// (44:4) {#each basicPragraphsData as { type, value }}
	function create_each_block(ctx) {
		var if_block_anchor;

		function select_block_type(ctx) {
			if (ctx.type === 'text') return create_if_block_1;
			if (ctx.type === 'subtitle') return create_if_block_2;
			if (ctx.type === 'image') return create_if_block_3;
		}

		var current_block_type = select_block_type(ctx);
		var if_block = current_block_type && current_block_type(ctx);

		return {
			c: function create() {
				if (if_block) if_block.c();
				if_block_anchor = empty();
			},

			m: function mount(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert(target, if_block_anchor, anchor);
			},

			p: function update(changed, ctx) {
				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(changed, ctx);
				} else {
					if (if_block) if_block.d(1);
					if_block = current_block_type && current_block_type(ctx);
					if (if_block) {
						if_block.c();
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				}
			},

			d: function destroy(detaching) {
				if (if_block) if_block.d(detaching);

				if (detaching) {
					detach(if_block_anchor);
				}
			}
		};
	}

	function create_fragment$3(ctx) {
		var div;

		var if_block = (ctx.$ContentDataStore) && create_if_block$1(ctx);

		return {
			c: function create() {
				div = element("div");
				if (if_block) if_block.c();
				div.className = "basic-p-container";
				add_location(div, file$3, 40, 0, 838);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				if (if_block) if_block.m(div, null);
			},

			p: function update(changed, ctx) {
				if (ctx.$ContentDataStore) {
					if (if_block) {
						if_block.p(changed, ctx);
					} else {
						if_block = create_if_block$1(ctx);
						if_block.c();
						if_block.m(div, null);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}

				if (if_block) if_block.d();
			}
		};
	}

	function instance$3($$self, $$props, $$invalidate) {
		let $ContentDataStore;

		validate_store(ContentDataStore, 'ContentDataStore');
		subscribe($$self, ContentDataStore, $$value => { $ContentDataStore = $$value; $$invalidate('$ContentDataStore', $ContentDataStore); });

		// the object name this section need to query
	  let { sectionName = 'testing' } = $$props;

	  let basicPragraphsData;

		$$self.$set = $$props => {
			if ('sectionName' in $$props) $$invalidate('sectionName', sectionName = $$props.sectionName);
		};

		$$self.$$.update = ($$dirty = { $ContentDataStore: 1, sectionName: 1 }) => {
			if ($$dirty.$ContentDataStore || $$dirty.sectionName) { if ($ContentDataStore) {
	        $$invalidate('basicPragraphsData', basicPragraphsData = $ContentDataStore[sectionName]);
	      } }
		};

		return {
			sectionName,
			basicPragraphsData,
			$ContentDataStore
		};
	}

	class BasicParagraphs extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$3, create_fragment$3, safe_not_equal, ["sectionName"]);
		}

		get sectionName() {
			throw new Error("<BasicParagraphs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set sectionName(value) {
			throw new Error("<BasicParagraphs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/utils/MobileDetector.svelte generated by Svelte v3.4.1 */

	function create_fragment$4(ctx) {
		return {
			c: noop,

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: noop,
			p: noop,
			i: noop,
			o: noop,
			d: noop
		};
	}

	function WidthSizeChange(mq) {
	  if (mq.matches) {
	    isMobile.set(false);
	  } else {
	    isMobile.set(true);
	  }
	}

	function instance$4($$self, $$props, $$invalidate) {
		let { minWidth = 500 } = $$props;
	  // media query event handler
	  if (matchMedia) {
	    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
	    mq.addListener(WidthSizeChange);
	    WidthSizeChange(mq);
	  }

		$$self.$set = $$props => {
			if ('minWidth' in $$props) $$invalidate('minWidth', minWidth = $$props.minWidth);
		};

		return { minWidth };
	}

	class MobileDetector extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$4, create_fragment$4, safe_not_equal, ["minWidth"]);
		}

		get minWidth() {
			throw new Error("<MobileDetector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set minWidth(value) {
			throw new Error("<MobileDetector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/common/ArticleList.svelte generated by Svelte v3.4.1 */

	const file$4 = "src/common/ArticleList.svelte";

	function get_each_context$1(ctx, list, i) {
		const child_ctx = Object.create(ctx);
		child_ctx.article_title = list[i].article_title;
		child_ctx.article_img_url = list[i].article_img_url;
		child_ctx.article_url = list[i].article_url;
		return child_ctx;
	}

	// (33:2) {:catch error}
	function create_catch_block(ctx) {
		var p;

		return {
			c: function create() {
				p = element("p");
				p.textContent = "An error occurred!";
				p.className = "text-center";
				add_location(p, file$4, 33, 4, 1040);
			},

			m: function mount(target, anchor) {
				insert(target, p, anchor);
			},

			p: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(p);
				}
			}
		};
	}

	// (12:2) {:then articleData}
	function create_then_block(ctx) {
		var each_1_anchor;

		var each_value = ctx.articleData.slice(0, 6);

		var each_blocks = [];

		for (var i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
		}

		return {
			c: function create() {
				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				each_1_anchor = empty();
			},

			m: function mount(target, anchor) {
				for (var i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].m(target, anchor);
				}

				insert(target, each_1_anchor, anchor);
			},

			p: function update(changed, ctx) {
				if (changed.articleData || changed.projectName) {
					each_value = ctx.articleData.slice(0, 6);

					for (var i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$1(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(changed, child_ctx);
						} else {
							each_blocks[i] = create_each_block$1(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}
					each_blocks.length = each_value.length;
				}
			},

			d: function destroy(detaching) {
				destroy_each(each_blocks, detaching);

				if (detaching) {
					detach(each_1_anchor);
				}
			}
		};
	}

	// (13:4) {#each articleData.slice(0, 6) as { article_title, article_img_url, article_url }}
	function create_each_block$1(ctx) {
		var div1, div0, a0, img, img_src_value, a0_href_value, t0, a1, h3, t1_value = ctx.article_title, t1, a1_href_value, t2;

		return {
			c: function create() {
				div1 = element("div");
				div0 = element("div");
				a0 = element("a");
				img = element("img");
				t0 = space();
				a1 = element("a");
				h3 = element("h3");
				t1 = text(t1_value);
				t2 = space();
				img.className = "article-lists-img hover:scale-110";
				img.src = img_src_value = ctx.article_img_url;
				img.alt = "";
				add_location(img, file$4, 20, 12, 602);
				a0.href = a0_href_value = `${ctx.article_url}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${ctx.projectName}`;
				a0.target = "_blank";
				a0.rel = "noopener noreferrer";
				add_location(a0, file$4, 15, 10, 394);
				div0.className = "overflow-hidden";
				add_location(div0, file$4, 14, 8, 354);
				h3.className = "article-lists-h3 hover-opacity";
				add_location(h3, file$4, 28, 10, 917);
				a1.href = a1_href_value = `${ctx.article_url}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${ctx.projectName}`;
				a1.target = "_blank";
				a1.rel = "noopener noreferrer";
				add_location(a1, file$4, 23, 8, 719);
				div1.className = "my-4";
				add_location(div1, file$4, 13, 6, 327);
			},

			m: function mount(target, anchor) {
				insert(target, div1, anchor);
				append(div1, div0);
				append(div0, a0);
				append(a0, img);
				append(div1, t0);
				append(div1, a1);
				append(a1, h3);
				append(h3, t1);
				append(div1, t2);
			},

			p: function update(changed, ctx) {
				if ((changed.articleData) && img_src_value !== (img_src_value = ctx.article_img_url)) {
					img.src = img_src_value;
				}

				if ((changed.articleData || changed.projectName) && a0_href_value !== (a0_href_value = `${ctx.article_url}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${ctx.projectName}`)) {
					a0.href = a0_href_value;
				}

				if ((changed.articleData) && t1_value !== (t1_value = ctx.article_title)) {
					set_data(t1, t1_value);
				}

				if ((changed.articleData || changed.projectName) && a1_href_value !== (a1_href_value = `${ctx.article_url}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${ctx.projectName}`)) {
					a1.href = a1_href_value;
				}
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div1);
				}
			}
		};
	}

	// (10:22)      <div class="w-64 h-64">loading ...</div>   {:then articleData}
	function create_pending_block(ctx) {
		var div;

		return {
			c: function create() {
				div = element("div");
				div.textContent = "loading ...";
				div.className = "w-64 h-64";
				add_location(div, file$4, 10, 4, 171);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
			},

			p: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	function create_fragment$5(ctx) {
		var div, promise;

		let info = {
			ctx,
			current: null,
			pending: create_pending_block,
			then: create_then_block,
			catch: create_catch_block,
			value: 'articleData',
			error: 'error'
		};

		handle_promise(promise = ctx.articleData, info);

		return {
			c: function create() {
				div = element("div");

				info.block.c();
				div.className = "relative article-list-grid-template pb-10";
				add_location(div, file$4, 8, 0, 88);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);

				info.block.m(div, info.anchor = null);
				info.mount = () => div;
				info.anchor = null;
			},

			p: function update(changed, new_ctx) {
				ctx = new_ctx;
				info.ctx = ctx;

				if (('articleData' in changed) && promise !== (promise = ctx.articleData) && handle_promise(promise, info)) ; else {
					info.block.p(changed, assign(assign({}, ctx), info.resolved));
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}

				info.block.d();
				info = null;
			}
		};
	}

	function instance$5($$self, $$props, $$invalidate) {
		let { projectName, articleData } = $$props;

		$$self.$set = $$props => {
			if ('projectName' in $$props) $$invalidate('projectName', projectName = $$props.projectName);
			if ('articleData' in $$props) $$invalidate('articleData', articleData = $$props.articleData);
		};

		return { projectName, articleData };
	}

	class ArticleList extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$5, create_fragment$5, safe_not_equal, ["projectName", "articleData"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.projectName === undefined && !('projectName' in props)) {
				console.warn("<ArticleList> was created without expected prop 'projectName'");
			}
			if (ctx.articleData === undefined && !('articleData' in props)) {
				console.warn("<ArticleList> was created without expected prop 'articleData'");
			}
		}

		get projectName() {
			throw new Error("<ArticleList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set projectName(value) {
			throw new Error("<ArticleList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get articleData() {
			throw new Error("<ArticleList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set articleData(value) {
			throw new Error("<ArticleList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/common/SocialBoxArticle.svelte generated by Svelte v3.4.1 */

	const file$5 = "src/common/SocialBoxArticle.svelte";

	function create_fragment$6(ctx) {
		var div, a0, svg0, circle0, path0, a0_href_value, t0, a1, svg1, path1, path2, path3, path4, path5, path6, a1_href_value, t1, a2, svg2, circle1, path7, a2_href_value;

		return {
			c: function create() {
				div = element("div");
				a0 = element("a");
				svg0 = svg_element("svg");
				circle0 = svg_element("circle");
				path0 = svg_element("path");
				t0 = space();
				a1 = element("a");
				svg1 = svg_element("svg");
				path1 = svg_element("path");
				path2 = svg_element("path");
				path3 = svg_element("path");
				path4 = svg_element("path");
				path5 = svg_element("path");
				path6 = svg_element("path");
				t1 = space();
				a2 = element("a");
				svg2 = svg_element("svg");
				circle1 = svg_element("circle");
				path7 = svg_element("path");
				attr(circle0, "cx", "32");
				attr(circle0, "cy", "32");
				attr(circle0, "r", "26");
				attr(circle0, "fill", "#3B5998");
				add_location(circle0, file$5, 10, 6, 320);
				attr(path0, "fill-rule", "evenodd");
				attr(path0, "clip-rule", "evenodd");
				attr(path0, "d", "M38.7534 23.2771C37.9223 23.1108 36.7998 22.9867 36.0938 22.9867C34.1823 22.9867 34.0581 23.8178 34.0581 25.1476V27.5148H38.8365L38.42 32.4183H34.0581V47.3333H28.0751V32.4183H25V27.5148H28.0751V24.4817C28.0751 20.3271 30.0277 18 34.9303 18C36.6336 18 37.8802 18.2493 39.5004 18.5818L38.7534 23.2771Z");
				attr(path0, "fill", "white");
				add_location(path0, file$5, 11, 6, 375);
				attr(svg0, "width", "40");
				attr(svg0, "height", "40");
				attr(svg0, "viewBox", "0 0 64 64");
				attr(svg0, "fill", "none");
				attr(svg0, "xmlns", "http://www.w3.org/2000/svg");
				add_location(svg0, file$5, 9, 4, 218);
				a0.href = a0_href_value = `https://www.facebook.com/sharer/sharer.php?u=${ctx.shareUrl}`;
				a0.target = "_blank";
				a0.className = "px-4 hover-opacity";
				add_location(a0, file$5, 8, 2, 101);
				attr(path1, "d", "M32 58C46.3594 58 58 46.3594 58 32C58 17.6406 46.3594 6 32 6C17.6406 6 6 17.6406 6 32C6 46.3594 17.6406 58 32 58Z");
				attr(path1, "fill", "#00B900");
				add_location(path1, file$5, 21, 6, 1009);
				attr(path2, "d", "M49.2944 30.4401C49.2944 22.7008 41.5377 16.4044 32 16.4044C22.4667 16.4044 14.7057 22.7008 14.7057 30.4401C14.7057 37.3778 20.859 43.1888 29.1704 44.2851C29.7337 44.4064 30.5007 44.6578 30.6957 45.1388C30.869 45.5764 30.8084 46.2611 30.752 46.7031C30.752 46.7031 30.5484 47.9251 30.505 48.1851C30.4314 48.6228 30.1584 49.8968 32.0044 49.1168C33.8504 48.3411 41.9624 43.2538 45.5937 39.0764C48.094 36.3248 49.2944 33.5341 49.2944 30.4401Z");
				attr(path2, "fill", "white");
				add_location(path2, file$5, 25, 6, 1179);
				attr(path3, "d", "M28.4857 26.7007H27.2724C27.0861 26.7007 26.9344 26.8523 26.9344 27.0387V34.5743C26.9344 34.7607 27.0861 34.9123 27.2724 34.9123H28.4857C28.6721 34.9123 28.8237 34.7607 28.8237 34.5743V27.0344C28.8237 26.8524 28.6721 26.7007 28.4857 26.7007Z");
				attr(path3, "fill", "#00B900");
				add_location(path3, file$5, 29, 6, 1672);
				attr(path4, "d", "M36.836 26.7007H35.6227C35.4364 26.7007 35.2847 26.8523 35.2847 27.0387V31.515L31.831 26.8523C31.8224 26.8393 31.8137 26.8307 31.805 26.8177C31.805 26.8177 31.805 26.8177 31.8007 26.8133C31.792 26.8047 31.7877 26.8003 31.779 26.7917C31.7747 26.7917 31.7747 26.7874 31.7747 26.7874C31.7704 26.783 31.7617 26.7787 31.7574 26.7743C31.753 26.77 31.753 26.77 31.7487 26.7657C31.7444 26.7613 31.7357 26.757 31.7314 26.7527C31.727 26.7483 31.7227 26.7484 31.7227 26.7484C31.7184 26.744 31.7097 26.7397 31.7054 26.7397C31.701 26.7397 31.6967 26.7353 31.6967 26.7353C31.6924 26.731 31.6837 26.731 31.6794 26.7267C31.675 26.7267 31.6707 26.7223 31.6664 26.7223C31.6577 26.718 31.6534 26.718 31.6447 26.7137C31.6404 26.7137 31.636 26.7137 31.6317 26.7094C31.623 26.7094 31.6187 26.705 31.6144 26.705C31.61 26.705 31.6057 26.705 31.6014 26.705C31.597 26.705 31.5884 26.705 31.584 26.7007C31.5797 26.7007 31.571 26.7007 31.5667 26.7007C31.5624 26.7007 31.558 26.7007 31.5537 26.7007H30.3404C30.154 26.7007 30.0024 26.8523 30.0024 27.0387V34.5744C30.0024 34.7607 30.154 34.9124 30.3404 34.9124H31.5537C31.74 34.9124 31.8917 34.7607 31.8917 34.5744V30.098L35.3497 34.7694C35.3714 34.804 35.4017 34.83 35.4364 34.8517C35.4364 34.8517 35.4407 34.8517 35.4407 34.856C35.4494 34.8604 35.4537 34.8647 35.4624 34.869C35.4667 34.869 35.4667 34.8734 35.471 34.8734C35.4754 34.8777 35.4797 34.8777 35.4884 34.882C35.4927 34.8864 35.497 34.8864 35.5057 34.8907C35.51 34.8907 35.5144 34.895 35.5144 34.895C35.523 34.8994 35.5317 34.8994 35.536 34.9037H35.5404C35.5664 34.9124 35.5967 34.9167 35.627 34.9167H36.8404C37.0267 34.9167 37.1784 34.765 37.1784 34.5787V27.0344C37.174 26.8524 37.0224 26.7007 36.836 26.7007Z");
				attr(path4, "fill", "#00B900");
				add_location(path4, file$5, 33, 6, 1970);
				attr(path5, "d", "M25.5607 33.0186H22.2631V27.0343C22.2631 26.848 22.1114 26.6963 21.9251 26.6963H20.7117C20.5254 26.6963 20.3737 26.848 20.3737 27.0343V34.57C20.3737 34.661 20.4084 34.7433 20.4691 34.804L20.4734 34.8083L20.4777 34.8126C20.5384 34.869 20.6207 34.908 20.7117 34.908H25.5564C25.7427 34.908 25.8944 34.7563 25.8944 34.57V33.3566C25.8987 33.1703 25.7471 33.0186 25.5607 33.0186Z");
				attr(path5, "fill", "#00B900");
				add_location(path5, file$5, 37, 6, 3717);
				attr(path6, "d", "M43.5354 28.5857C43.7217 28.5857 43.8734 28.4341 43.8734 28.2477V27.0344C43.8734 26.8481 43.7217 26.6964 43.5354 26.6964H38.6907C38.5997 26.6964 38.5174 26.7311 38.4567 26.7917L38.4524 26.7961C38.4524 26.8004 38.4481 26.8004 38.4481 26.8004C38.3917 26.8611 38.3527 26.9434 38.3527 27.0344V34.5701C38.3527 34.6611 38.3874 34.7434 38.4481 34.8041L38.4524 34.8084L38.4567 34.8127C38.5174 34.8691 38.5997 34.9081 38.6907 34.9081H43.5354C43.7217 34.9081 43.8734 34.7564 43.8734 34.5701V33.3567C43.8734 33.1704 43.7217 33.0187 43.5354 33.0187H40.2377V31.7447H43.5354C43.7217 31.7447 43.8734 31.5931 43.8734 31.4067V30.1934C43.8734 30.0071 43.7217 29.8554 43.5354 29.8554H40.2377V28.5814H43.5354V28.5857Z");
				attr(path6, "fill", "#00B900");
				add_location(path6, file$5, 41, 6, 4147);
				attr(svg1, "width", "40");
				attr(svg1, "height", "40");
				attr(svg1, "viewBox", "0 0 64 64");
				attr(svg1, "fill", "none");
				attr(svg1, "xmlns", "http://www.w3.org/2000/svg");
				add_location(svg1, file$5, 20, 4, 907);
				a1.href = a1_href_value = `https://lineit.line.me/share/ui?url=${ctx.shareUrl}`;
				a1.target = "_blank";
				a1.className = "px-4 hover-opacity";
				add_location(a1, file$5, 19, 2, 799);
				attr(circle1, "cx", "32");
				attr(circle1, "cy", "32");
				attr(circle1, "r", "26");
				attr(circle1, "fill", "#1DA1F2");
				add_location(circle1, file$5, 49, 6, 5119);
				attr(path7, "fill-rule", "evenodd");
				attr(path7, "clip-rule", "evenodd");
				attr(path7, "d", "M48 22.0782C46.8235 22.6008 45.5575 22.9528 44.2296 23.1117C45.5852 22.299 46.6262 21.0127 47.1158 19.48C45.8487 20.233 44.4418 20.778 42.9475 21.0735C41.7498 19.7978 40.0421 19 38.1553 19C34.53 19 31.5904 21.9395 31.5904 25.5649C31.5904 26.079 31.6491 26.5803 31.7611 27.0613C26.3044 26.7883 21.4674 24.1741 18.2292 20.2021C17.6639 21.1716 17.3407 22.299 17.3407 23.5021C17.3407 25.7793 18.498 27.7888 20.261 28.9663C19.1838 28.9321 18.1727 28.6367 17.2863 28.145V28.2271C17.2863 31.4088 19.5507 34.0614 22.5521 34.6662C22.0017 34.8155 21.4215 34.8965 20.8231 34.8965C20.3997 34.8965 19.988 34.8549 19.587 34.7781C20.4221 37.386 22.8475 39.2845 25.7199 39.3379C23.4736 41.0977 20.6429 42.1483 17.5668 42.1483C17.0357 42.1483 16.513 42.1174 16 42.0555C18.9054 43.9178 22.3558 45.0057 26.0633 45.0057C38.1383 45.0057 44.7415 35.0021 44.7415 26.3275C44.7415 26.0427 44.7362 25.759 44.7224 25.4785C46.0065 24.5506 47.1201 23.3944 48 22.0782Z");
				attr(path7, "fill", "white");
				add_location(path7, file$5, 50, 6, 5174);
				attr(svg2, "width", "40");
				attr(svg2, "height", "40");
				attr(svg2, "viewBox", "0 0 64 64");
				attr(svg2, "fill", "none");
				attr(svg2, "xmlns", "http://www.w3.org/2000/svg");
				add_location(svg2, file$5, 48, 4, 5017);
				a2.href = a2_href_value = `https://twitter.com/share?url=${ctx.shareUrl}`;
				a2.target = "_blank";
				a2.className = "px-4 hover-opacity";
				add_location(a2, file$5, 47, 2, 4915);
				div.className = "flex justify-center my-3";
				add_location(div, file$5, 7, 0, 60);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				append(div, a0);
				append(a0, svg0);
				append(svg0, circle0);
				append(svg0, path0);
				append(div, t0);
				append(div, a1);
				append(a1, svg1);
				append(svg1, path1);
				append(svg1, path2);
				append(svg1, path3);
				append(svg1, path4);
				append(svg1, path5);
				append(svg1, path6);
				append(div, t1);
				append(div, a2);
				append(a2, svg2);
				append(svg2, circle1);
				append(svg2, path7);
			},

			p: function update(changed, ctx) {
				if ((changed.shareUrl) && a0_href_value !== (a0_href_value = `https://www.facebook.com/sharer/sharer.php?u=${ctx.shareUrl}`)) {
					a0.href = a0_href_value;
				}

				if ((changed.shareUrl) && a1_href_value !== (a1_href_value = `https://lineit.line.me/share/ui?url=${ctx.shareUrl}`)) {
					a1.href = a1_href_value;
				}

				if ((changed.shareUrl) && a2_href_value !== (a2_href_value = `https://twitter.com/share?url=${ctx.shareUrl}`)) {
					a2.href = a2_href_value;
				}
			},

			i: noop,
			o: noop,

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
				}
			}
		};
	}

	function instance$6($$self, $$props, $$invalidate) {
		let { shareUrl } = $$props;

		$$self.$set = $$props => {
			if ('shareUrl' in $$props) $$invalidate('shareUrl', shareUrl = $$props.shareUrl);
		};

		return { shareUrl };
	}

	class SocialBoxArticle extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$6, create_fragment$6, safe_not_equal, ["shareUrl"]);

			const { ctx } = this.$$;
			const props = options.props || {};
			if (ctx.shareUrl === undefined && !('shareUrl' in props)) {
				console.warn("<SocialBoxArticle> was created without expected prop 'shareUrl'");
			}
		}

		get shareUrl() {
			throw new Error("<SocialBoxArticle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set shareUrl(value) {
			throw new Error("<SocialBoxArticle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/App.svelte generated by Svelte v3.4.1 */

	const file$6 = "src/App.svelte";

	// (33:2) {#if $ContentDataStore}
	function create_if_block$2(ctx) {
		var div, t1, t2, h2, t4, current;

		var socialboxinarticle = new SocialBoxArticle({
			props: { shareUrl: ctx.$ContentDataStore.article_url },
			$$inline: true
		});

		var articlelist = new ArticleList({
			props: {
			projectName: ctx.$ContentDataStore.project_name,
			articleData: ctx.$ContentDataStore.read_more_articles
		},
			$$inline: true
		});

		return {
			c: function create() {
				div = element("div");
				div.textContent = "分享這篇文章";
				t1 = space();
				socialboxinarticle.$$.fragment.c();
				t2 = space();
				h2 = element("h2");
				h2.textContent = "推薦文章";
				t4 = space();
				articlelist.$$.fragment.c();
				div.className = "text-center text-lg mx-auto pt-10 px-8 sm:px-12 sm:p-0";
				set_style(div, "max-width", "530px");
				add_location(div, file$6, 34, 2, 928);
				h2.className = "text-center font-bold text-lg sm:text-2xl text-black pt-12";
				add_location(h2, file$6, 36, 2, 1102);
			},

			m: function mount(target, anchor) {
				insert(target, div, anchor);
				insert(target, t1, anchor);
				mount_component(socialboxinarticle, target, anchor);
				insert(target, t2, anchor);
				insert(target, h2, anchor);
				insert(target, t4, anchor);
				mount_component(articlelist, target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				var socialboxinarticle_changes = {};
				if (changed.$ContentDataStore) socialboxinarticle_changes.shareUrl = ctx.$ContentDataStore.article_url;
				socialboxinarticle.$set(socialboxinarticle_changes);

				var articlelist_changes = {};
				if (changed.$ContentDataStore) articlelist_changes.projectName = ctx.$ContentDataStore.project_name;
				if (changed.$ContentDataStore) articlelist_changes.articleData = ctx.$ContentDataStore.read_more_articles;
				articlelist.$set(articlelist_changes);
			},

			i: function intro(local) {
				if (current) return;
				socialboxinarticle.$$.fragment.i(local);

				articlelist.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				socialboxinarticle.$$.fragment.o(local);
				articlelist.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				if (detaching) {
					detach(div);
					detach(t1);
				}

				socialboxinarticle.$destroy(detaching);

				if (detaching) {
					detach(t2);
					detach(h2);
					detach(t4);
				}

				articlelist.$destroy(detaching);
			}
		};
	}

	function create_fragment$7(ctx) {
		var t0, t1, main, article, section, t2, t3, current;

		var mobiledetector = new MobileDetector({ $$inline: true });

		var header = new Header({ $$inline: true });

		var basicparagraphs = new BasicParagraphs({
			props: { sectionName: "intro" },
			$$inline: true
		});

		var if_block = (ctx.$ContentDataStore) && create_if_block$2(ctx);

		var footer = new Footer({ $$inline: true });

		return {
			c: function create() {
				mobiledetector.$$.fragment.c();
				t0 = space();
				header.$$.fragment.c();
				t1 = space();
				main = element("main");
				article = element("article");
				section = element("section");
				basicparagraphs.$$.fragment.c();
				t2 = space();
				if (if_block) if_block.c();
				t3 = space();
				footer.$$.fragment.c();
				section.className = "container-width mx-auto grid-full-cols svelte-gu3le";
				add_location(section, file$6, 28, 4, 748);
				article.className = "main-grid-template";
				add_location(article, file$6, 27, 2, 707);
				add_location(main, file$6, 26, 0, 698);
			},

			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},

			m: function mount(target, anchor) {
				mount_component(mobiledetector, target, anchor);
				insert(target, t0, anchor);
				mount_component(header, target, anchor);
				insert(target, t1, anchor);
				insert(target, main, anchor);
				append(main, article);
				append(article, section);
				mount_component(basicparagraphs, section, null);
				append(main, t2);
				if (if_block) if_block.m(main, null);
				insert(target, t3, anchor);
				mount_component(footer, target, anchor);
				current = true;
			},

			p: function update(changed, ctx) {
				if (ctx.$ContentDataStore) {
					if (if_block) {
						if_block.p(changed, ctx);
						if_block.i(1);
					} else {
						if_block = create_if_block$2(ctx);
						if_block.c();
						if_block.i(1);
						if_block.m(main, null);
					}
				} else if (if_block) {
					group_outros();
					on_outro(() => {
						if_block.d(1);
						if_block = null;
					});

					if_block.o(1);
					check_outros();
				}
			},

			i: function intro(local) {
				if (current) return;
				mobiledetector.$$.fragment.i(local);

				header.$$.fragment.i(local);

				basicparagraphs.$$.fragment.i(local);

				if (if_block) if_block.i();

				footer.$$.fragment.i(local);

				current = true;
			},

			o: function outro(local) {
				mobiledetector.$$.fragment.o(local);
				header.$$.fragment.o(local);
				basicparagraphs.$$.fragment.o(local);
				if (if_block) if_block.o();
				footer.$$.fragment.o(local);
				current = false;
			},

			d: function destroy(detaching) {
				mobiledetector.$destroy(detaching);

				if (detaching) {
					detach(t0);
				}

				header.$destroy(detaching);

				if (detaching) {
					detach(t1);
					detach(main);
				}

				basicparagraphs.$destroy();

				if (if_block) if_block.d();

				if (detaching) {
					detach(t3);
				}

				footer.$destroy(detaching);
			}
		};
	}

	function instance$7($$self, $$props, $$invalidate) {
		let $ContentDataStore;

		validate_store(ContentDataStore, 'ContentDataStore');
		subscribe($$self, ContentDataStore, $$value => { $ContentDataStore = $$value; $$invalidate('$ContentDataStore', $ContentDataStore); });

		

	  window.onbeforeunload = function () {
	    window.scrollTo(0, 0);
	  };

		return { $ContentDataStore };
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$7, create_fragment$7, safe_not_equal, []);
		}
	}

	const app = new App({
		target: document.getElementById("tnl-spa-app")
	});

	return app;

}());
//# sourceMappingURL=bundle.js.map
