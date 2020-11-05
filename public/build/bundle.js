
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
            if (iterations[i])
                iterations[i].d(detaching);
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
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.4' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    let isMobile = writable(false);

    /* src/shared/SocialBox.svelte generated by Svelte v3.29.4 */

    const { console: console_1 } = globals;
    const file = "src/shared/SocialBox.svelte";

    // (44:0) {:else}
    function create_else_block(ctx) {
    	let div;
    	let a0;
    	let svg0;
    	let path0;
    	let a0_href_value;
    	let t0;
    	let a1;
    	let svg1;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let path5;
    	let a1_href_value;
    	let t1;
    	let a2;
    	let svg2;
    	let path6;
    	let a2_href_value;

    	const block = {
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
    			attr_dev(path0, "d", "M11.75,0a11.8,11.8,0,0,0-2,23.42V14.26H7V11H9.79V8.53c0-2.82,1.72-4.35,4.22-4.35a23.11,23.11,0,0,1,2.53.13V7.25H14.8c-1.36,0-1.62.65-1.62,1.61V11h3.25L16,14.26H13.18V23.5A11.8,11.8,0,0,0,11.75,0Z");
    			set_style(path0, "fill", /*iconColor*/ ctx[1]);
    			add_location(path0, file, 50, 93, 1807);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "width", "24");
    			attr_dev(svg0, "height", "24");
    			attr_dev(svg0, "viewBox", "0 0 23.5 23.5");
    			add_location(svg0, file, 50, 6, 1720);
    			attr_dev(a0, "href", a0_href_value = `https://www.facebook.com/sharer/sharer.php?u=${/*shareUrl*/ ctx[0]}`);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "class", "px-2 hover-change-opacity");
    			add_location(a0, file, 45, 4, 1569);
    			attr_dev(path1, "d", "M18.8,0H5.2A5.2,5.2,0,0,0,0,5.2V18.8A5.2,5.2,0,0,0,5.2,24H18.8A5.2,5.2,0,0,0,24,18.8V5.2A5.2,5.2,0,0,0,18.8,0Zm0,15.31A28.29,28.29,0,0,1,12,20.38c-.93.39-.79-.25-.76-.47s.13-.75.13-.75a1.76,1.76,0,0,0,0-.79c-.1-.24-.48-.37-.77-.43-4.2-.55-7.31-3.49-7.31-7C3.22,7,7.14,3.85,12,3.85S20.7,7,20.7,10.94a6.34,6.34,0,0,1-1.87,4.37Z");
    			set_style(path1, "fill", /*iconColor*/ ctx[1]);
    			add_location(path1, file, 56, 89, 2296);
    			attr_dev(path2, "d", "M10.19,9.06H9.57a.17.17,0,0,0-.17.17V13a.17.17,0,0,0,.17.17h.62a.17.17,0,0,0,.17-.17V9.23a.17.17,0,0,0-.17-.17");
    			set_style(path2, "fill", /*iconColor*/ ctx[1]);
    			add_location(path2, file, 60, 8, 2702);
    			attr_dev(path3, "d", "M14.4,9.06h-.61a.17.17,0,0,0-.17.17v2.26L11.88,9.13l0,0h-.74a.17.17,0,0,0-.17.17V13a.17.17,0,0,0,.17.17h.61a.17.17,0,0,0,.18-.17V10.77l1.74,2.36a.1.1,0,0,0,0,0h.7a.16.16,0,0,0,.17-.17V9.23a.16.16,0,0,0-.17-.17");
    			set_style(path3, "fill", /*iconColor*/ ctx[1]);
    			add_location(path3, file, 64, 8, 2893);
    			attr_dev(path4, "d", "M8.71,12.25H7v-3a.16.16,0,0,0-.17-.17H6.26a.17.17,0,0,0-.17.17V13a.17.17,0,0,0,0,.12h0a.21.21,0,0,0,.12,0H8.71A.17.17,0,0,0,8.88,13v-.61a.18.18,0,0,0-.17-.17");
    			set_style(path4, "fill", /*iconColor*/ ctx[1]);
    			add_location(path4, file, 68, 8, 3183);
    			attr_dev(path5, "d", "M17.79,10A.18.18,0,0,0,18,9.84V9.23a.17.17,0,0,0-.17-.17H15.34a.16.16,0,0,0-.12,0h0a.17.17,0,0,0-.05.12V13a.17.17,0,0,0,.05.12h0a.17.17,0,0,0,.12,0h2.45A.17.17,0,0,0,18,13v-.61a.18.18,0,0,0-.17-.17H16.12v-.64h1.67a.18.18,0,0,0,.17-.17v-.62a.18.18,0,0,0-.17-.17H16.12V10Z");
    			set_style(path5, "fill", /*iconColor*/ ctx[1]);
    			add_location(path5, file, 72, 8, 3421);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "width", "24");
    			attr_dev(svg1, "height", "24");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			add_location(svg1, file, 56, 6, 2213);
    			attr_dev(a1, "href", a1_href_value = `https://lineit.line.me/share/ui?url=${/*shareUrl*/ ctx[0]}`);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "class", "px-2 hover-change-opacity");
    			add_location(a1, file, 55, 4, 2094);
    			attr_dev(path6, "d", "M162.49,38.91A65.42,65.42,0,0,1,143.93,44a32.21,32.21,0,0,0,14.2-17.74A64.79,64.79,0,0,1,137.63,34a32.2,32.2,0,0,0-55,29.19A92,92,0,0,1,16.14,29.77a31.87,31.87,0,0,0,10,42.74,32.77,32.77,0,0,1-14.64-4v.38a32.09,32.09,0,0,0,25.88,31.38,32.35,32.35,0,0,1-8.48,1.15,34.5,34.5,0,0,1-6.08-.59A32.32,32.32,0,0,0,53,123.05a65.16,65.16,0,0,1-40.09,13.69,61.75,61.75,0,0,1-7.69-.45,92.23,92.23,0,0,0,49.48,14.36c59.36,0,91.84-48.75,91.84-91,0-1.38-.05-2.77-.11-4.13a63.63,63.63,0,0,0,16.11-16.57");
    			attr_dev(path6, "transform", "translate(-5.17 -23.92)");
    			set_style(path6, "fill", /*iconColor*/ ctx[1]);
    			add_location(path6, file, 78, 97, 3987);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "width", "24");
    			attr_dev(svg2, "height", "24");
    			attr_dev(svg2, "viewBox", "0 0 157.32 126.73");
    			add_location(svg2, file, 78, 6, 3896);
    			attr_dev(a2, "href", a2_href_value = `https://twitter.com/share?url=${/*shareUrl*/ ctx[0]}`);
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "class", "px-2 hover-change-opacity");
    			add_location(a2, file, 77, 4, 3783);
    			attr_dev(div, "class", "flex mx-auto");
    			add_location(div, file, 44, 2, 1538);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a0);
    			append_dev(a0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div, t0);
    			append_dev(div, a1);
    			append_dev(a1, svg1);
    			append_dev(svg1, path1);
    			append_dev(svg1, path2);
    			append_dev(svg1, path3);
    			append_dev(svg1, path4);
    			append_dev(svg1, path5);
    			append_dev(div, t1);
    			append_dev(div, a2);
    			append_dev(a2, svg2);
    			append_dev(svg2, path6);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*iconColor*/ 2) {
    				set_style(path0, "fill", /*iconColor*/ ctx[1]);
    			}

    			if (dirty & /*shareUrl*/ 1 && a0_href_value !== (a0_href_value = `https://www.facebook.com/sharer/sharer.php?u=${/*shareUrl*/ ctx[0]}`)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*iconColor*/ 2) {
    				set_style(path1, "fill", /*iconColor*/ ctx[1]);
    			}

    			if (dirty & /*iconColor*/ 2) {
    				set_style(path2, "fill", /*iconColor*/ ctx[1]);
    			}

    			if (dirty & /*iconColor*/ 2) {
    				set_style(path3, "fill", /*iconColor*/ ctx[1]);
    			}

    			if (dirty & /*iconColor*/ 2) {
    				set_style(path4, "fill", /*iconColor*/ ctx[1]);
    			}

    			if (dirty & /*iconColor*/ 2) {
    				set_style(path5, "fill", /*iconColor*/ ctx[1]);
    			}

    			if (dirty & /*shareUrl*/ 1 && a1_href_value !== (a1_href_value = `https://lineit.line.me/share/ui?url=${/*shareUrl*/ ctx[0]}`)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*iconColor*/ 2) {
    				set_style(path6, "fill", /*iconColor*/ ctx[1]);
    			}

    			if (dirty & /*shareUrl*/ 1 && a2_href_value !== (a2_href_value = `https://twitter.com/share?url=${/*shareUrl*/ ctx[0]}`)) {
    				attr_dev(a2, "href", a2_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(44:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (36:0) {#if $isMobile && !isFacebookApp()}
    function create_if_block(ctx) {
    	let div;
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M18.33,15a4.36,4.36,0,0,0-2.72.95L10.93,13a4.35,4.35,0,0,0,0-1.9l4.68-2.92A4.38,4.38,0,1,0,14,4.78a4.26,4.26,0,0,0,.11,1L9.38,8.65a4.38,4.38,0,1,0,0,6.86l4.68,2.92a4.33,4.33,0,0,0-.11.95A4.38,4.38,0,1,0,18.33,15Z");
    			attr_dev(path, "transform", "translate(-2.27 -0.4)");
    			set_style(path, "fill", /*iconColor*/ ctx[1]);
    			add_location(path, file, 37, 93, 1192);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 20.44 23.36");
    			add_location(svg, file, 37, 4, 1103);
    			attr_dev(div, "class", "px-2");
    			attr_dev(div, "id", "mobile-share-icon");
    			add_location(div, file, 36, 2, 1057);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*iconColor*/ 2) {
    				set_style(path, "fill", /*iconColor*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(36:0) {#if $isMobile && !isFacebookApp()}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let show_if;
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (show_if == null || dirty & /*$isMobile*/ 4) show_if = !!(/*$isMobile*/ ctx[2] && !isFacebookApp());
    		if (show_if) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
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
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function isFacebookApp() {
    	var ua = navigator.userAgent || navigator.vendor || window.opera;
    	return ua.indexOf("FBAN") > -1 || ua.indexOf("FBAV") > -1;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $isMobile;
    	validate_store(isMobile, "isMobile");
    	component_subscribe($$self, isMobile, $$value => $$invalidate(2, $isMobile = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SocialBox", slots, []);
    	let { shareUrl } = $$props;
    	let { tnlPageId } = $$props;
    	let { iconColor = "#484748" } = $$props;
    	let webShareIcon;

    	onMount(() => {
    		// if user is on mobile device add event listene to 'mobile-share-icon' element
    		if ($isMobile && !isFacebookApp()) {
    			webShareIcon = document.getElementById("mobile-share-icon");

    			webShareIcon.addEventListener("click", async () => {
    				if (navigator.share) {
    					navigator.share({ url: tnlPageId }).then(() => console.log("successful share!")).catch(error => console.log("error sharing!", error));
    				}
    			});
    		}
    	});

    	const writable_props = ["shareUrl", "tnlPageId", "iconColor"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<SocialBox> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("shareUrl" in $$props) $$invalidate(0, shareUrl = $$props.shareUrl);
    		if ("tnlPageId" in $$props) $$invalidate(3, tnlPageId = $$props.tnlPageId);
    		if ("iconColor" in $$props) $$invalidate(1, iconColor = $$props.iconColor);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		isMobile,
    		shareUrl,
    		tnlPageId,
    		iconColor,
    		webShareIcon,
    		isFacebookApp,
    		$isMobile
    	});

    	$$self.$inject_state = $$props => {
    		if ("shareUrl" in $$props) $$invalidate(0, shareUrl = $$props.shareUrl);
    		if ("tnlPageId" in $$props) $$invalidate(3, tnlPageId = $$props.tnlPageId);
    		if ("iconColor" in $$props) $$invalidate(1, iconColor = $$props.iconColor);
    		if ("webShareIcon" in $$props) webShareIcon = $$props.webShareIcon;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$isMobile*/ 4) {
    			 console.log($isMobile);
    		}
    	};

    	return [shareUrl, iconColor, $isMobile, tnlPageId];
    }

    class SocialBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { shareUrl: 0, tnlPageId: 3, iconColor: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SocialBox",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*shareUrl*/ ctx[0] === undefined && !("shareUrl" in props)) {
    			console_1.warn("<SocialBox> was created without expected prop 'shareUrl'");
    		}

    		if (/*tnlPageId*/ ctx[3] === undefined && !("tnlPageId" in props)) {
    			console_1.warn("<SocialBox> was created without expected prop 'tnlPageId'");
    		}
    	}

    	get shareUrl() {
    		throw new Error("<SocialBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shareUrl(value) {
    		throw new Error("<SocialBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tnlPageId() {
    		throw new Error("<SocialBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tnlPageId(value) {
    		throw new Error("<SocialBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconColor() {
    		throw new Error("<SocialBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconColor(value) {
    		throw new Error("<SocialBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/shared/NavBar.svelte generated by Svelte v3.29.4 */
    const file$1 = "src/shared/NavBar.svelte";

    function create_fragment$1(ctx) {
    	let nav;
    	let div0;
    	let a;
    	let figure;
    	let img;
    	let img_src_value;
    	let t;
    	let div1;
    	let socialbox;
    	let current;

    	socialbox = new SocialBox({
    			props: {
    				shareUrl: "https://www.thenewslens.com/interactive/142038",
    				tnlPageId: "142038",
    				iconColor: "#807F80"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div0 = element("div");
    			a = element("a");
    			figure = element("figure");
    			img = element("img");
    			t = space();
    			div1 = element("div");
    			create_component(socialbox.$$.fragment);
    			if (img.src !== (img_src_value = "https://image3.thenewslens.com/assets/web/publisher-photo-1.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Tne News Lens logo");
    			attr_dev(img, "class", "svelte-fpaa3l");
    			add_location(img, file$1, 14, 8, 247);
    			attr_dev(figure, "class", "ml-2");
    			add_location(figure, file$1, 13, 6, 217);
    			attr_dev(a, "href", "https://www.thenewslens.com/");
    			add_location(a, file$1, 12, 4, 171);
    			attr_dev(div0, "class", "inline-block");
    			add_location(div0, file$1, 11, 2, 140);
    			attr_dev(div1, "class", "inline-block");
    			add_location(div1, file$1, 18, 2, 386);
    			attr_dev(nav, "class", "nav-white");
    			add_location(nav, file$1, 10, 0, 114);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div0);
    			append_dev(div0, a);
    			append_dev(a, figure);
    			append_dev(figure, img);
    			append_dev(nav, t);
    			append_dev(nav, div1);
    			mount_component(socialbox, div1, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(socialbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(socialbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_component(socialbox);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NavBar", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NavBar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ SocialBox });
    	return [];
    }

    class NavBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavBar",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/shared/Footer.svelte generated by Svelte v3.29.4 */

    const file$2 = "src/shared/Footer.svelte";

    function create_fragment$2(ctx) {
    	let footer;
    	let div;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div = element("div");
    			img = element("img");
    			attr_dev(img, "class", "mx-auto my-2");
    			attr_dev(img, "width", "250px");
    			if (img.src !== (img_src_value = "https://datastore.thenewslens.com/infographic/assets/tnl-logo/tnl-footer-dark-bg-logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "tnl-white-logo");
    			add_location(img, file$2, 6, 4, 105);
    			attr_dev(div, "class", /*footerClass*/ ctx[0]);
    			add_location(div, file$2, 5, 2, 73);
    			add_location(footer, file$2, 4, 0, 62);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div);
    			append_dev(div, img);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*footerClass*/ 1) {
    				attr_dev(div, "class", /*footerClass*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	let { footerClass = "footer-dark" } = $$props;
    	const writable_props = ["footerClass"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("footerClass" in $$props) $$invalidate(0, footerClass = $$props.footerClass);
    	};

    	$$self.$capture_state = () => ({ footerClass });

    	$$self.$inject_state = $$props => {
    		if ("footerClass" in $$props) $$invalidate(0, footerClass = $$props.footerClass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [footerClass];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { footerClass: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get footerClass() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set footerClass(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/shared/CreatorList.svelte generated by Svelte v3.29.4 */

    const file$3 = "src/shared/CreatorList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i].work;
    	child_ctx[2] = list[i].name;
    	return child_ctx;
    }

    // (39:4) {#each items as { work, name }}
    function create_each_block(ctx) {
    	let div0;
    	let t0_value = /*work*/ ctx[1] + "";
    	let t0;
    	let t1;
    	let div1;
    	let html_tag;
    	let raw_value = /*name*/ ctx[2] + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			attr_dev(div0, "class", "col-start-1 col-end-2 ml-auto pt-1");
    			add_location(div0, file$3, 39, 6, 798);
    			html_tag = new HtmlTag(t2);
    			attr_dev(div1, "class", "col-start-2 col-end-3 mr-auto pt-1");
    			set_style(div1, "word-break", "keep-all");
    			add_location(div1, file$3, 40, 6, 865);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			html_tag.m(raw_value, div1);
    			append_dev(div1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 1 && t0_value !== (t0_value = /*work*/ ctx[1] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*items*/ 1 && raw_value !== (raw_value = /*name*/ ctx[2] + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(39:4) {#each items as { work, name }}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div1;
    	let h2;
    	let t1;
    	let div0;
    	let t2;
    	let span;
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "製作團隊";
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			span = element("span");
    			span.textContent = "（姓名依筆劃排序）";
    			attr_dev(h2, "class", "text-white font-light pt-6 pb-3");
    			add_location(h2, file$3, 35, 2, 605);
    			attr_dev(div0, "class", "creator-grid inline-block text-left text-sm sm:text-base px-4 content-center svelte-7pxywl");
    			add_location(div0, file$3, 36, 2, 661);
    			attr_dev(span, "class", "block text-sm sm:text-base mt-3");
    			add_location(span, file$3, 47, 2, 1017);
    			attr_dev(div1, "class", "text-center text-white font-light pb-6");
    			add_location(div1, file$3, 34, 0, 550);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h2);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div1, t2);
    			append_dev(div1, span);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*items*/ 1) {
    				each_value = /*items*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CreatorList", slots, []);

    	let { items = [
    		{
    			work: "文字內容",
    			name: ["林宜萱、羅元祺<br/>Nicholas Haggerty<br/>Daphne K. Lee"]
    		},
    		{
    			work: "網頁設計",
    			name: ["林奕甫、高嘉宏<br/>黃彥翔、楊時鈞"]
    		},
    		{ work: "網頁工程", name: ["楊時鈞"] },
    		{ work: "影音製作", name: ["李漢威、高丞澔<br/>鄭宇軒"] },
    		{ work: "共同監製", name: ["翁世航、黃筱歡<br/>楊士範"] }
    	] } = $$props;

    	const writable_props = ["items"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CreatorList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    	};

    	$$self.$capture_state = () => ({ items });

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [items];
    }

    class CreatorList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { items: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CreatorList",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get items() {
    		throw new Error("<CreatorList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<CreatorList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/utils/MobileDetector.svelte generated by Svelte v3.29.4 */

    function create_fragment$4(ctx) {
    	const block = {
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

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MobileDetector", slots, []);
    	let { minWidth = 500 } = $$props;

    	// media query event handler
    	if (matchMedia) {
    		const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    		mq.addListener(WidthSizeChange);
    		WidthSizeChange(mq);
    	}

    	// mobile detector when window's width size change
    	function WidthSizeChange(mq) {
    		if (mq.matches) {
    			isMobile.set(false);
    		} else {
    			isMobile.set(true);
    		}
    	}

    	const writable_props = ["minWidth"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MobileDetector> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("minWidth" in $$props) $$invalidate(0, minWidth = $$props.minWidth);
    	};

    	$$self.$capture_state = () => ({ isMobile, minWidth, WidthSizeChange });

    	$$self.$inject_state = $$props => {
    		if ("minWidth" in $$props) $$invalidate(0, minWidth = $$props.minWidth);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [minWidth];
    }

    class MobileDetector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { minWidth: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MobileDetector",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get minWidth() {
    		throw new Error("<MobileDetector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minWidth(value) {
    		throw new Error("<MobileDetector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.4 */
    const file$4 = "src/App.svelte";

    function create_fragment$5(ctx) {
    	let mobiledetector;
    	let t0;
    	let main;
    	let navbar;
    	let t1;
    	let article;
    	let section;
    	let div0;
    	let h1;
    	let t3;
    	let p;
    	let t5;
    	let div2;
    	let div1;
    	let creatorlist;
    	let t6;
    	let footer;
    	let current;
    	mobiledetector = new MobileDetector({ $$inline: true });
    	navbar = new NavBar({ $$inline: true });
    	creatorlist = new CreatorList({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(mobiledetector.$$.fragment);
    			t0 = space();
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t1 = space();
    			article = element("article");
    			section = element("section");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "TNL Graphic";
    			t3 = space();
    			p = element("p");
    			p.textContent = "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Cum magni, quidem doloribus optio est, nisi\n          excepturi necessitatibus rem quis molestias et? Quibusdam dolorum voluptate sunt laudantium, doloremque\n          perspiciatis doloribus officiis?";
    			t5 = space();
    			div2 = element("div");
    			div1 = element("div");
    			create_component(creatorlist.$$.fragment);
    			t6 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(h1, "class", " text-green-800 text-center pt-4");
    			add_location(h1, file$4, 16, 8, 452);
    			attr_dev(p, "class", " pt-4");
    			add_location(p, file$4, 17, 8, 522);
    			attr_dev(div0, "class", "w-full");
    			set_style(div0, "max-width", "560px");
    			add_location(div0, file$4, 15, 6, 398);
    			attr_dev(section, "class", "grid-full-cols");
    			add_location(section, file$4, 14, 4, 359);
    			attr_dev(article, "class", "main-grid-template");
    			add_location(article, file$4, 13, 2, 318);
    			attr_dev(div1, "class", "container-width mx-auto");
    			add_location(div1, file$4, 27, 4, 952);
    			attr_dev(div2, "class", "grid-full-cols");
    			set_style(div2, "background-color", "#4D4D4D");
    			add_location(div2, file$4, 26, 2, 884);
    			add_location(main, file$4, 11, 0, 296);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(mobiledetector, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(navbar, main, null);
    			append_dev(main, t1);
    			append_dev(main, article);
    			append_dev(article, section);
    			append_dev(section, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t3);
    			append_dev(div0, p);
    			append_dev(main, t5);
    			append_dev(main, div2);
    			append_dev(div2, div1);
    			mount_component(creatorlist, div1, null);
    			append_dev(main, t6);
    			mount_component(footer, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mobiledetector.$$.fragment, local);
    			transition_in(navbar.$$.fragment, local);
    			transition_in(creatorlist.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mobiledetector.$$.fragment, local);
    			transition_out(navbar.$$.fragment, local);
    			transition_out(creatorlist.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(mobiledetector, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    			destroy_component(creatorlist);
    			destroy_component(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		NavBar,
    		Footer,
    		CreatorList,
    		MobileDetector
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
