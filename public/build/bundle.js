
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
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
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
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

    // (42:0) {:else}
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
    			set_style(path0, "fill", /*socialIconColor*/ ctx[1]);
    			add_location(path0, file, 44, 93, 1764);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "width", "24");
    			attr_dev(svg0, "height", "24");
    			attr_dev(svg0, "viewBox", "0 0 23.5 23.5");
    			add_location(svg0, file, 44, 6, 1677);
    			attr_dev(a0, "href", a0_href_value = `https://www.facebook.com/sharer/sharer.php?u=${/*shareUrl*/ ctx[0]}`);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "class", "px-2 hover-opacity");
    			add_location(a0, file, 43, 4, 1558);
    			attr_dev(path1, "d", "M18.8,0H5.2A5.2,5.2,0,0,0,0,5.2V18.8A5.2,5.2,0,0,0,5.2,24H18.8A5.2,5.2,0,0,0,24,18.8V5.2A5.2,5.2,0,0,0,18.8,0Zm0,15.31A28.29,28.29,0,0,1,12,20.38c-.93.39-.79-.25-.76-.47s.13-.75.13-.75a1.76,1.76,0,0,0,0-.79c-.1-.24-.48-.37-.77-.43-4.2-.55-7.31-3.49-7.31-7C3.22,7,7.14,3.85,12,3.85S20.7,7,20.7,10.94a6.34,6.34,0,0,1-1.87,4.37Z");
    			set_style(path1, "fill", /*socialIconColor*/ ctx[1]);
    			add_location(path1, file, 50, 89, 2244);
    			attr_dev(path2, "d", "M10.19,9.06H9.57a.17.17,0,0,0-.17.17V13a.17.17,0,0,0,.17.17h.62a.17.17,0,0,0,.17-.17V9.23a.17.17,0,0,0-.17-.17");
    			set_style(path2, "fill", /*socialIconColor*/ ctx[1]);
    			add_location(path2, file, 54, 8, 2650);
    			attr_dev(path3, "d", "M14.4,9.06h-.61a.17.17,0,0,0-.17.17v2.26L11.88,9.13l0,0h-.74a.17.17,0,0,0-.17.17V13a.17.17,0,0,0,.17.17h.61a.17.17,0,0,0,.18-.17V10.77l1.74,2.36a.1.1,0,0,0,0,0h.7a.16.16,0,0,0,.17-.17V9.23a.16.16,0,0,0-.17-.17");
    			set_style(path3, "fill", /*socialIconColor*/ ctx[1]);
    			add_location(path3, file, 58, 8, 2841);
    			attr_dev(path4, "d", "M8.71,12.25H7v-3a.16.16,0,0,0-.17-.17H6.26a.17.17,0,0,0-.17.17V13a.17.17,0,0,0,0,.12h0a.21.21,0,0,0,.12,0H8.71A.17.17,0,0,0,8.88,13v-.61a.18.18,0,0,0-.17-.17");
    			set_style(path4, "fill", /*socialIconColor*/ ctx[1]);
    			add_location(path4, file, 62, 8, 3131);
    			attr_dev(path5, "d", "M17.79,10A.18.18,0,0,0,18,9.84V9.23a.17.17,0,0,0-.17-.17H15.34a.16.16,0,0,0-.12,0h0a.17.17,0,0,0-.05.12V13a.17.17,0,0,0,.05.12h0a.17.17,0,0,0,.12,0h2.45A.17.17,0,0,0,18,13v-.61a.18.18,0,0,0-.17-.17H16.12v-.64h1.67a.18.18,0,0,0,.17-.17v-.62a.18.18,0,0,0-.17-.17H16.12V10Z");
    			set_style(path5, "fill", /*socialIconColor*/ ctx[1]);
    			add_location(path5, file, 66, 8, 3369);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "width", "24");
    			attr_dev(svg1, "height", "24");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			add_location(svg1, file, 50, 6, 2161);
    			attr_dev(a1, "href", a1_href_value = `https://lineit.line.me/share/ui?url=${/*shareUrl*/ ctx[0]}`);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "class", "px-2 hover-opacity");
    			add_location(a1, file, 49, 4, 2051);
    			attr_dev(path6, "d", "M162.49,38.91A65.42,65.42,0,0,1,143.93,44a32.21,32.21,0,0,0,14.2-17.74A64.79,64.79,0,0,1,137.63,34a32.2,32.2,0,0,0-55,29.19A92,92,0,0,1,16.14,29.77a31.87,31.87,0,0,0,10,42.74,32.77,32.77,0,0,1-14.64-4v.38a32.09,32.09,0,0,0,25.88,31.38,32.35,32.35,0,0,1-8.48,1.15,34.5,34.5,0,0,1-6.08-.59A32.32,32.32,0,0,0,53,123.05a65.16,65.16,0,0,1-40.09,13.69,61.75,61.75,0,0,1-7.69-.45,92.23,92.23,0,0,0,49.48,14.36c59.36,0,91.84-48.75,91.84-91,0-1.38-.05-2.77-.11-4.13a63.63,63.63,0,0,0,16.11-16.57");
    			attr_dev(path6, "transform", "translate(-5.17 -23.92)");
    			set_style(path6, "fill", /*socialIconColor*/ ctx[1]);
    			add_location(path6, file, 72, 97, 3926);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "width", "24");
    			attr_dev(svg2, "height", "24");
    			attr_dev(svg2, "viewBox", "0 0 157.32 126.73");
    			add_location(svg2, file, 72, 6, 3835);
    			attr_dev(a2, "href", a2_href_value = `https://twitter.com/share?url=${/*shareUrl*/ ctx[0]}`);
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "class", "px-2 hover-opacity");
    			add_location(a2, file, 71, 4, 3731);
    			attr_dev(div, "class", "flex mx-auto");
    			add_location(div, file, 42, 2, 1527);
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
    			if (dirty & /*socialIconColor*/ 2) {
    				set_style(path0, "fill", /*socialIconColor*/ ctx[1]);
    			}

    			if (dirty & /*shareUrl*/ 1 && a0_href_value !== (a0_href_value = `https://www.facebook.com/sharer/sharer.php?u=${/*shareUrl*/ ctx[0]}`)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*socialIconColor*/ 2) {
    				set_style(path1, "fill", /*socialIconColor*/ ctx[1]);
    			}

    			if (dirty & /*socialIconColor*/ 2) {
    				set_style(path2, "fill", /*socialIconColor*/ ctx[1]);
    			}

    			if (dirty & /*socialIconColor*/ 2) {
    				set_style(path3, "fill", /*socialIconColor*/ ctx[1]);
    			}

    			if (dirty & /*socialIconColor*/ 2) {
    				set_style(path4, "fill", /*socialIconColor*/ ctx[1]);
    			}

    			if (dirty & /*socialIconColor*/ 2) {
    				set_style(path5, "fill", /*socialIconColor*/ ctx[1]);
    			}

    			if (dirty & /*shareUrl*/ 1 && a1_href_value !== (a1_href_value = `https://lineit.line.me/share/ui?url=${/*shareUrl*/ ctx[0]}`)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*socialIconColor*/ 2) {
    				set_style(path6, "fill", /*socialIconColor*/ ctx[1]);
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
    		source: "(42:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (34:0) {#if $isMobile && !isFacebookApp()}
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
    			set_style(path, "fill", /*socialIconColor*/ ctx[1]);
    			add_location(path, file, 35, 93, 1181);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "24");
    			attr_dev(svg, "height", "24");
    			attr_dev(svg, "viewBox", "0 0 20.44 23.36");
    			add_location(svg, file, 35, 4, 1092);
    			attr_dev(div, "class", "px-2");
    			attr_dev(div, "id", "mobile-share-icon");
    			add_location(div, file, 34, 2, 1046);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*socialIconColor*/ 2) {
    				set_style(path, "fill", /*socialIconColor*/ ctx[1]);
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
    		source: "(34:0) {#if $isMobile && !isFacebookApp()}",
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
    	let { tnlDomainPageId } = $$props;
    	let { socialIconColor = "#484748" } = $$props;
    	let webShareIcon;

    	onMount(() => {
    		// if user is on mobile device add event listener to 'mobile-share-icon' element
    		if ($isMobile && !isFacebookApp()) {
    			webShareIcon = document.getElementById("mobile-share-icon");

    			webShareIcon.addEventListener("click", async () => {
    				if (navigator.share) {
    					navigator.share({ url: tnlDomainPageId }).then(() => console.log("successful share!")).catch(error => console.log("error sharing!", error));
    				}
    			});
    		}
    	});

    	const writable_props = ["shareUrl", "tnlDomainPageId", "socialIconColor"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<SocialBox> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("shareUrl" in $$props) $$invalidate(0, shareUrl = $$props.shareUrl);
    		if ("tnlDomainPageId" in $$props) $$invalidate(3, tnlDomainPageId = $$props.tnlDomainPageId);
    		if ("socialIconColor" in $$props) $$invalidate(1, socialIconColor = $$props.socialIconColor);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		isMobile,
    		shareUrl,
    		tnlDomainPageId,
    		socialIconColor,
    		webShareIcon,
    		isFacebookApp,
    		$isMobile
    	});

    	$$self.$inject_state = $$props => {
    		if ("shareUrl" in $$props) $$invalidate(0, shareUrl = $$props.shareUrl);
    		if ("tnlDomainPageId" in $$props) $$invalidate(3, tnlDomainPageId = $$props.tnlDomainPageId);
    		if ("socialIconColor" in $$props) $$invalidate(1, socialIconColor = $$props.socialIconColor);
    		if ("webShareIcon" in $$props) webShareIcon = $$props.webShareIcon;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [shareUrl, socialIconColor, $isMobile, tnlDomainPageId];
    }

    class SocialBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			shareUrl: 0,
    			tnlDomainPageId: 3,
    			socialIconColor: 1
    		});

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

    		if (/*tnlDomainPageId*/ ctx[3] === undefined && !("tnlDomainPageId" in props)) {
    			console_1.warn("<SocialBox> was created without expected prop 'tnlDomainPageId'");
    		}
    	}

    	get shareUrl() {
    		throw new Error("<SocialBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shareUrl(value) {
    		throw new Error("<SocialBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tnlDomainPageId() {
    		throw new Error("<SocialBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tnlDomainPageId(value) {
    		throw new Error("<SocialBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get socialIconColor() {
    		throw new Error("<SocialBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set socialIconColor(value) {
    		throw new Error("<SocialBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/shared/Header.svelte generated by Svelte v3.29.4 */
    const file$1 = "src/shared/Header.svelte";

    function create_fragment$1(ctx) {
    	let header;
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
    				shareUrl: /*shareUrl*/ ctx[1],
    				tnlDomainPageId: /*tnlDomainPageId*/ ctx[2],
    				socialIconColor: /*socialIconColor*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			header = element("header");
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
    			add_location(img, file$1, 19, 8, 437);
    			attr_dev(figure, "class", "ml-2");
    			add_location(figure, file$1, 18, 6, 407);
    			attr_dev(a, "href", /*homePageUrl*/ ctx[0]);
    			add_location(a, file$1, 17, 4, 378);
    			attr_dev(div0, "class", "inline-block");
    			add_location(div0, file$1, 16, 2, 347);
    			attr_dev(div1, "class", "inline-block");
    			add_location(div1, file$1, 23, 2, 576);
    			attr_dev(header, "class", "flex justify-between bg-white py-2 px-2 shadow");
    			add_location(header, file$1, 15, 0, 281);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div0);
    			append_dev(div0, a);
    			append_dev(a, figure);
    			append_dev(figure, img);
    			append_dev(header, t);
    			append_dev(header, div1);
    			mount_component(socialbox, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*homePageUrl*/ 1) {
    				attr_dev(a, "href", /*homePageUrl*/ ctx[0]);
    			}

    			const socialbox_changes = {};
    			if (dirty & /*shareUrl*/ 2) socialbox_changes.shareUrl = /*shareUrl*/ ctx[1];
    			if (dirty & /*tnlDomainPageId*/ 4) socialbox_changes.tnlDomainPageId = /*tnlDomainPageId*/ ctx[2];
    			if (dirty & /*socialIconColor*/ 8) socialbox_changes.socialIconColor = /*socialIconColor*/ ctx[3];
    			socialbox.$set(socialbox_changes);
    		},
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
    			if (detaching) detach_dev(header);
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
    	validate_slots("Header", slots, []);
    	let { homePageUrl = "https://www.thenewslens.com/" } = $$props;
    	let { shareUrl = "#" } = $$props;
    	let { tnlDomainPageId = "#" } = $$props;
    	let { socialIconColor = "#807F80" } = $$props;
    	const writable_props = ["homePageUrl", "shareUrl", "tnlDomainPageId", "socialIconColor"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("homePageUrl" in $$props) $$invalidate(0, homePageUrl = $$props.homePageUrl);
    		if ("shareUrl" in $$props) $$invalidate(1, shareUrl = $$props.shareUrl);
    		if ("tnlDomainPageId" in $$props) $$invalidate(2, tnlDomainPageId = $$props.tnlDomainPageId);
    		if ("socialIconColor" in $$props) $$invalidate(3, socialIconColor = $$props.socialIconColor);
    	};

    	$$self.$capture_state = () => ({
    		SocialBox,
    		homePageUrl,
    		shareUrl,
    		tnlDomainPageId,
    		socialIconColor
    	});

    	$$self.$inject_state = $$props => {
    		if ("homePageUrl" in $$props) $$invalidate(0, homePageUrl = $$props.homePageUrl);
    		if ("shareUrl" in $$props) $$invalidate(1, shareUrl = $$props.shareUrl);
    		if ("tnlDomainPageId" in $$props) $$invalidate(2, tnlDomainPageId = $$props.tnlDomainPageId);
    		if ("socialIconColor" in $$props) $$invalidate(3, socialIconColor = $$props.socialIconColor);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [homePageUrl, shareUrl, tnlDomainPageId, socialIconColor];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			homePageUrl: 0,
    			shareUrl: 1,
    			tnlDomainPageId: 2,
    			socialIconColor: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get homePageUrl() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set homePageUrl(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shareUrl() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shareUrl(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tnlDomainPageId() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tnlDomainPageId(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get socialIconColor() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set socialIconColor(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/shared/Footer.svelte generated by Svelte v3.29.4 */

    const file$2 = "src/shared/Footer.svelte";

    function create_fragment$2(ctx) {
    	let footer;
    	let div1;
    	let a;
    	let figure;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let t1;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div1 = element("div");
    			a = element("a");
    			figure = element("figure");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			t1 = text("Copyright © 2020 The News Lens 關鍵評論");
    			attr_dev(img, "class", "mx-auto my-2");
    			attr_dev(img, "width", "250px");
    			if (img.src !== (img_src_value = `${/*tnlLogoUrl*/ ctx[4]}?utm_source=TNL-interactive&utm_medium=footer&utm_campaign=${/*projectName*/ ctx[1]}`)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "tnl-white-logo");
    			add_location(img, file$2, 12, 8, 485);
    			attr_dev(figure, "class", "mx-auto my-2");
    			add_location(figure, file$2, 11, 6, 447);
    			attr_dev(a, "href", /*homePageUrl*/ ctx[3]);
    			add_location(a, file$2, 10, 4, 418);
    			attr_dev(div0, "class", "text-xs md:text-sm pt-2");
    			set_style(div0, "color", /*copyRightColor*/ ctx[2]);
    			add_location(div0, file$2, 20, 4, 721);
    			attr_dev(div1, "class", "text-center p-8 text-white font-light tracking-wide");
    			set_style(div1, "background-color", /*bgColor*/ ctx[0]);
    			add_location(div1, file$2, 9, 2, 311);
    			add_location(footer, file$2, 8, 0, 300);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div1);
    			append_dev(div1, a);
    			append_dev(a, figure);
    			append_dev(figure, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*tnlLogoUrl, projectName*/ 18 && img.src !== (img_src_value = `${/*tnlLogoUrl*/ ctx[4]}?utm_source=TNL-interactive&utm_medium=footer&utm_campaign=${/*projectName*/ ctx[1]}`)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*homePageUrl*/ 8) {
    				attr_dev(a, "href", /*homePageUrl*/ ctx[3]);
    			}

    			if (dirty & /*copyRightColor*/ 4) {
    				set_style(div0, "color", /*copyRightColor*/ ctx[2]);
    			}

    			if (dirty & /*bgColor*/ 1) {
    				set_style(div1, "background-color", /*bgColor*/ ctx[0]);
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
    	let { bgColor = "black" } = $$props;
    	let { projectName = "" } = $$props;
    	let { copyRightColor = "white" } = $$props;
    	let { homePageUrl = "https://www.thenewslens.com/" } = $$props;
    	let { tnlLogoUrl = "https://datastore.thenewslens.com/infographic/assets/tnl-logo/tnl-footer-dark-bg-logo.png" } = $$props;
    	const writable_props = ["bgColor", "projectName", "copyRightColor", "homePageUrl", "tnlLogoUrl"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("bgColor" in $$props) $$invalidate(0, bgColor = $$props.bgColor);
    		if ("projectName" in $$props) $$invalidate(1, projectName = $$props.projectName);
    		if ("copyRightColor" in $$props) $$invalidate(2, copyRightColor = $$props.copyRightColor);
    		if ("homePageUrl" in $$props) $$invalidate(3, homePageUrl = $$props.homePageUrl);
    		if ("tnlLogoUrl" in $$props) $$invalidate(4, tnlLogoUrl = $$props.tnlLogoUrl);
    	};

    	$$self.$capture_state = () => ({
    		bgColor,
    		projectName,
    		copyRightColor,
    		homePageUrl,
    		tnlLogoUrl
    	});

    	$$self.$inject_state = $$props => {
    		if ("bgColor" in $$props) $$invalidate(0, bgColor = $$props.bgColor);
    		if ("projectName" in $$props) $$invalidate(1, projectName = $$props.projectName);
    		if ("copyRightColor" in $$props) $$invalidate(2, copyRightColor = $$props.copyRightColor);
    		if ("homePageUrl" in $$props) $$invalidate(3, homePageUrl = $$props.homePageUrl);
    		if ("tnlLogoUrl" in $$props) $$invalidate(4, tnlLogoUrl = $$props.tnlLogoUrl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [bgColor, projectName, copyRightColor, homePageUrl, tnlLogoUrl];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			bgColor: 0,
    			projectName: 1,
    			copyRightColor: 2,
    			homePageUrl: 3,
    			tnlLogoUrl: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$2.name
    		});
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

    const contentDataUrl = 'https://datastore.thenewslens.com/infographic/test/test.json?sffdf';

    const ContentDataStore = writable(undefined, async set => {
      const res = await fetch(contentDataUrl);
      const data = await res.json();
      set(data);
      return () => {};
    });

    /* src/shared/BasicParagraphs.svelte generated by Svelte v3.29.4 */
    const file$3 = "src/shared/BasicParagraphs.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i].type;
    	child_ctx[4] = list[i].value;
    	return child_ctx;
    }

    // (43:2) {#if $ContentDataStore}
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*basicPragraphsData*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*basicPragraphsData*/ 1) {
    				each_value = /*basicPragraphsData*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
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
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(43:2) {#if $ContentDataStore}",
    		ctx
    	});

    	return block;
    }

    // (49:33) 
    function create_if_block_3(ctx) {
    	let figure;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let figcaption;
    	let t1_value = /*value*/ ctx[4].note + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			figure = element("figure");
    			img = element("img");
    			t0 = space();
    			figcaption = element("figcaption");
    			t1 = text(t1_value);
    			t2 = space();
    			if (img.src !== (img_src_value = /*value*/ ctx[4].url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*value*/ ctx[4].discription);
    			add_location(img, file$3, 50, 10, 1202);
    			attr_dev(figcaption, "class", "svelte-18blbr1");
    			add_location(figcaption, file$3, 51, 10, 1260);
    			attr_dev(figure, "class", "img-wrapper");
    			add_location(figure, file$3, 49, 8, 1163);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, figure, anchor);
    			append_dev(figure, img);
    			append_dev(figure, t0);
    			append_dev(figure, figcaption);
    			append_dev(figcaption, t1);
    			append_dev(figure, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*basicPragraphsData*/ 1 && img.src !== (img_src_value = /*value*/ ctx[4].url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*basicPragraphsData*/ 1 && img_alt_value !== (img_alt_value = /*value*/ ctx[4].discription)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*basicPragraphsData*/ 1 && t1_value !== (t1_value = /*value*/ ctx[4].note + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(figure);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(49:33) ",
    		ctx
    	});

    	return block;
    }

    // (47:36) 
    function create_if_block_2(ctx) {
    	let h3;
    	let t_value = /*value*/ ctx[4] + "";
    	let t;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t = text(t_value);
    			add_location(h3, file$3, 47, 8, 1104);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*basicPragraphsData*/ 1 && t_value !== (t_value = /*value*/ ctx[4] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(47:36) ",
    		ctx
    	});

    	return block;
    }

    // (45:6) {#if type === 'text'}
    function create_if_block_1(ctx) {
    	let p;
    	let t_value = /*value*/ ctx[4] + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			add_location(p, file$3, 45, 8, 1044);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*basicPragraphsData*/ 1 && t_value !== (t_value = /*value*/ ctx[4] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(45:6) {#if type === 'text'}",
    		ctx
    	});

    	return block;
    }

    // (44:4) {#each basicPragraphsData as { type, value }}
    function create_each_block(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*type*/ ctx[3] === "text") return create_if_block_1;
    		if (/*type*/ ctx[3] === "subtitle") return create_if_block_2;
    		if (/*type*/ ctx[3] === "image") return create_if_block_3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
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
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(44:4) {#each basicPragraphsData as { type, value }}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let if_block = /*$ContentDataStore*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "basic-p-container");
    			add_location(div, file$3, 40, 0, 842);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$ContentDataStore*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
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
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
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
    	let $ContentDataStore;
    	validate_store(ContentDataStore, "ContentDataStore");
    	component_subscribe($$self, ContentDataStore, $$value => $$invalidate(1, $ContentDataStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BasicParagraphs", slots, []);
    	let { sectionName = "testing" } = $$props;
    	let basicPragraphsData;
    	const writable_props = ["sectionName"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BasicParagraphs> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("sectionName" in $$props) $$invalidate(2, sectionName = $$props.sectionName);
    	};

    	$$self.$capture_state = () => ({
    		ContentDataStore,
    		sectionName,
    		basicPragraphsData,
    		$ContentDataStore
    	});

    	$$self.$inject_state = $$props => {
    		if ("sectionName" in $$props) $$invalidate(2, sectionName = $$props.sectionName);
    		if ("basicPragraphsData" in $$props) $$invalidate(0, basicPragraphsData = $$props.basicPragraphsData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$ContentDataStore, sectionName*/ 6) {
    			// check store has fetched content data from GCS
    			 if ($ContentDataStore) {
    				$$invalidate(0, basicPragraphsData = $ContentDataStore[sectionName]);
    			}
    		}
    	};

    	return [basicPragraphsData, $ContentDataStore, sectionName];
    }

    class BasicParagraphs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { sectionName: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BasicParagraphs",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get sectionName() {
    		throw new Error("<BasicParagraphs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sectionName(value) {
    		throw new Error("<BasicParagraphs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/shared/TeamCreatorList.svelte generated by Svelte v3.29.4 */

    const file$4 = "src/shared/TeamCreatorList.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i].work;
    	child_ctx[5] = list[i].name;
    	return child_ctx;
    }

    // (31:6) {#each creators as { work, name }}
    function create_each_block$1(ctx) {
    	let div0;
    	let t0_value = /*work*/ ctx[4] + "";
    	let t0;
    	let t1;
    	let div1;
    	let html_tag;
    	let raw_value = /*name*/ ctx[5] + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			attr_dev(div0, "class", "col-start-1 col-end-2 ml-auto pt-1");
    			add_location(div0, file$4, 31, 8, 847);
    			html_tag = new HtmlTag(t2);
    			attr_dev(div1, "class", "col-start-2 col-end-3 mr-auto pt-1");
    			set_style(div1, "word-break", "keep-all");
    			add_location(div1, file$4, 32, 8, 916);
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
    			if (dirty & /*creators*/ 4 && t0_value !== (t0_value = /*work*/ ctx[4] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*creators*/ 4 && raw_value !== (raw_value = /*name*/ ctx[5] + "")) html_tag.p(raw_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(31:6) {#each creators as { work, name }}",
    		ctx
    	});

    	return block;
    }

    // (38:4) {#if !englishVersion}
    function create_if_block$2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "（姓名依筆劃排序）";
    			attr_dev(span, "class", "block text-sm sm:text-base mt-3");
    			add_location(span, file$4, 37, 25, 1083);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(38:4) {#if !englishVersion}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div2;
    	let div1;
    	let h4;
    	let t1;
    	let div0;
    	let t2;
    	let each_value = /*creators*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	let if_block = !/*englishVersion*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			h4 = element("h4");
    			h4.textContent = `${/*teamText*/ ctx[3]}`;
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(h4, "class", "text-lg sm:text-2xl leading-normal tracking-wide text-white font-light pb-3");
    			add_location(h4, file$4, 28, 4, 599);
    			attr_dev(div0, "class", "creator-grid inline-block text-left text-sm sm:text-base px-4 content-center svelte-7pxywl");
    			add_location(div0, file$4, 29, 4, 707);
    			attr_dev(div1, "class", "text-center text-white font-light pt-6 pb-6");
    			add_location(div1, file$4, 27, 2, 537);
    			attr_dev(div2, "class", "mx-auto");
    			set_style(div2, "background-color", /*bgColor*/ ctx[0]);
    			add_location(div2, file$4, 26, 0, 476);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, h4);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div1, t2);
    			if (if_block) if_block.m(div1, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*creators*/ 4) {
    				each_value = /*creators*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (!/*englishVersion*/ ctx[1]) {
    				if (if_block) ; else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*bgColor*/ 1) {
    				set_style(div2, "background-color", /*bgColor*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    		}
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
    	validate_slots("TeamCreatorList", slots, []);
    	let { bgColor = "#4D4D4D" } = $$props;
    	let { englishVersion = false } = $$props;

    	let { creators = [
    		{
    			work: "製作",
    			name: ["Steven Yeo、Steven Yeo"]
    		},
    		{
    			work: "監製",
    			name: ["Steven Yeo、Steven Yeo"]
    		}
    	] } = $$props;

    	const teamText = englishVersion ? "Production Team" : "製作團隊";
    	const writable_props = ["bgColor", "englishVersion", "creators"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TeamCreatorList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("bgColor" in $$props) $$invalidate(0, bgColor = $$props.bgColor);
    		if ("englishVersion" in $$props) $$invalidate(1, englishVersion = $$props.englishVersion);
    		if ("creators" in $$props) $$invalidate(2, creators = $$props.creators);
    	};

    	$$self.$capture_state = () => ({
    		bgColor,
    		englishVersion,
    		creators,
    		teamText
    	});

    	$$self.$inject_state = $$props => {
    		if ("bgColor" in $$props) $$invalidate(0, bgColor = $$props.bgColor);
    		if ("englishVersion" in $$props) $$invalidate(1, englishVersion = $$props.englishVersion);
    		if ("creators" in $$props) $$invalidate(2, creators = $$props.creators);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [bgColor, englishVersion, creators, teamText];
    }

    class TeamCreatorList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			bgColor: 0,
    			englishVersion: 1,
    			creators: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TeamCreatorList",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get bgColor() {
    		throw new Error("<TeamCreatorList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<TeamCreatorList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get englishVersion() {
    		throw new Error("<TeamCreatorList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set englishVersion(value) {
    		throw new Error("<TeamCreatorList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get creators() {
    		throw new Error("<TeamCreatorList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set creators(value) {
    		throw new Error("<TeamCreatorList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/utils/MobileDetector.svelte generated by Svelte v3.29.4 */

    function create_fragment$5(ctx) {
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { minWidth: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MobileDetector",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get minWidth() {
    		throw new Error("<MobileDetector>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minWidth(value) {
    		throw new Error("<MobileDetector>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/shared/Spinner.svelte generated by Svelte v3.29.4 */

    const file$5 = "src/shared/Spinner.svelte";

    function create_fragment$6(ctx) {
    	let svg;
    	let circle;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			circle = svg_element("circle");
    			attr_dev(circle, "class", "path svelte-1b7swrt");
    			attr_dev(circle, "cx", "25");
    			attr_dev(circle, "cy", "25");
    			attr_dev(circle, "r", "20");
    			attr_dev(circle, "fill", "none");
    			attr_dev(circle, "stroke-width", "5");
    			add_location(circle, file$5, 63, 41, 1279);
    			attr_dev(svg, "class", "spinner svelte-1b7swrt");
    			attr_dev(svg, "viewBox", "0 0 50 50");
    			add_location(svg, file$5, 63, 0, 1238);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, circle);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Spinner", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Spinner> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Spinner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Spinner",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/shared/ArticleList.svelte generated by Svelte v3.29.4 */
    const file$6 = "src/shared/ArticleList.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i].articletitle;
    	child_ctx[7] = list[i].articledate;
    	child_ctx[8] = list[i].articleimage;
    	child_ctx[9] = list[i].articleid;
    	return child_ctx;
    }

    // (55:2) {:catch error}
    function create_catch_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "An error occurred!";
    			attr_dev(p, "class", "text-center");
    			add_location(p, file$6, 55, 4, 1624);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(55:2) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (33:2) {:then articleData}
    function create_then_block(ctx) {
    	let each_1_anchor;
    	let each_value = /*articleData*/ ctx[1].slice(0, 6);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*articleData, projectName*/ 3) {
    				each_value = /*articleData*/ ctx[1].slice(0, 6);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
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
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(33:2) {:then articleData}",
    		ctx
    	});

    	return block;
    }

    // (34:4) {#each articleData.slice(0, 6) as { articletitle, articledate, articleimage, articleid }}
    function create_each_block$2(ctx) {
    	let div1;
    	let div0;
    	let a0;
    	let img;
    	let img_src_value;
    	let a0_href_value;
    	let t0;
    	let span;
    	let t1_value = /*articledate*/ ctx[7] + "";
    	let t1;
    	let t2;
    	let a1;
    	let h3;
    	let t3_value = /*articletitle*/ ctx[6] + "";
    	let t3;
    	let a1_href_value;
    	let t4;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			img = element("img");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			a1 = element("a");
    			h3 = element("h3");
    			t3 = text(t3_value);
    			t4 = space();
    			attr_dev(img, "class", "article-lists-img hover:scale-110");
    			if (img.src !== (img_src_value = /*articleimage*/ ctx[8])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file$6, 41, 12, 1096);
    			attr_dev(a0, "href", a0_href_value = `https://www.thenewslens.com/${/*articleid*/ ctx[9]}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${/*projectName*/ ctx[0]}`);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noopener noreferrer");
    			add_location(a0, file$6, 36, 10, 862);
    			attr_dev(div0, "class", "overflow-hidden");
    			add_location(div0, file$6, 35, 8, 822);
    			attr_dev(span, "class", "article-lists-date");
    			add_location(span, file$6, 44, 8, 1210);
    			attr_dev(h3, "class", "article-lists-h3 hover:text-blue-800");
    			add_location(h3, file$6, 50, 10, 1496);
    			attr_dev(a1, "href", a1_href_value = `https://www.thenewslens.com/${/*articleid*/ ctx[9]}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${/*projectName*/ ctx[0]}`);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "rel", "noopener noreferrer");
    			add_location(a1, file$6, 45, 8, 1272);
    			attr_dev(div1, "class", "my-4 shadow");
    			add_location(div1, file$6, 34, 6, 788);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(a0, img);
    			append_dev(div1, t0);
    			append_dev(div1, span);
    			append_dev(span, t1);
    			append_dev(div1, t2);
    			append_dev(div1, a1);
    			append_dev(a1, h3);
    			append_dev(h3, t3);
    			append_dev(div1, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*projectName*/ 1 && a0_href_value !== (a0_href_value = `https://www.thenewslens.com/${/*articleid*/ ctx[9]}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${/*projectName*/ ctx[0]}`)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*projectName*/ 1 && a1_href_value !== (a1_href_value = `https://www.thenewslens.com/${/*articleid*/ ctx[9]}?utm_source=TNL-interactive&utm_medium=article-zone&utm_campaign=${/*projectName*/ ctx[0]}`)) {
    				attr_dev(a1, "href", a1_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(34:4) {#each articleData.slice(0, 6) as { articletitle, articledate, articleimage, articleid }}",
    		ctx
    	});

    	return block;
    }

    // (29:22)      <div class="w-64 h-64">       <Spinner />     </div>   {:then articleData}
    function create_pending_block(ctx) {
    	let div;
    	let spinner;
    	let current;
    	spinner = new Spinner({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(spinner.$$.fragment);
    			attr_dev(div, "class", "w-64 h-64");
    			add_location(div, file$6, 29, 4, 613);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(spinner, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(spinner.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(spinner.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(spinner);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(29:22)      <div class=\\\"w-64 h-64\\\">       <Spinner />     </div>   {:then articleData}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let t;
    	let div;
    	let promise;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 1,
    		error: 12,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*articleData*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    			t = space();
    			div = element("div");
    			info.block.c();
    			attr_dev(div, "class", "article-list-grid-template pb-20");
    			add_location(div, file$6, 27, 0, 539);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[1] = child_ctx[12] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);

    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ArticleList", slots, ['default']);
    	let { projectName = "" } = $$props;
    	let { tnlLanguage = "tw" } = $$props;
    	const articleListsUrl = "https://datastore.thenewslens.com/infographic/article-lists/" + projectName + ".json?" + `${Date.now()}`;

    	const articleData = (async () => {
    		const response = await fetch(articleListsUrl);
    		return await response.json();
    	})();

    	const writable_props = ["projectName", "tnlLanguage"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ArticleList> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("projectName" in $$props) $$invalidate(0, projectName = $$props.projectName);
    		if ("tnlLanguage" in $$props) $$invalidate(2, tnlLanguage = $$props.tnlLanguage);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		Spinner,
    		projectName,
    		tnlLanguage,
    		articleListsUrl,
    		articleData
    	});

    	$$self.$inject_state = $$props => {
    		if ("projectName" in $$props) $$invalidate(0, projectName = $$props.projectName);
    		if ("tnlLanguage" in $$props) $$invalidate(2, tnlLanguage = $$props.tnlLanguage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [projectName, articleData, tnlLanguage, $$scope, slots];
    }

    class ArticleList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { projectName: 0, tnlLanguage: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ArticleList",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get projectName() {
    		throw new Error("<ArticleList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set projectName(value) {
    		throw new Error("<ArticleList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tnlLanguage() {
    		throw new Error("<ArticleList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tnlLanguage(value) {
    		throw new Error("<ArticleList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.4 */
    const file$7 = "src/App.svelte";

    // (29:4) <ArticleList projectName="us-election-2020-article-lists-tc">
    function create_default_slot(ctx) {
    	let h2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "延伸閱讀";
    			attr_dev(h2, "class", "text-center");
    			add_location(h2, file$7, 29, 6, 775);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(29:4) <ArticleList projectName=\\\"us-election-2020-article-lists-tc\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let mobiledetector;
    	let t0;
    	let header;
    	let t1;
    	let main;
    	let article;
    	let section;
    	let basicparagraphs;
    	let t2;
    	let div;
    	let articlelist;
    	let t3;
    	let teamcreatorlist;
    	let t4;
    	let footer;
    	let current;
    	mobiledetector = new MobileDetector({ $$inline: true });
    	header = new Header({ $$inline: true });
    	basicparagraphs = new BasicParagraphs({ $$inline: true });

    	articlelist = new ArticleList({
    			props: {
    				projectName: "us-election-2020-article-lists-tc",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	teamcreatorlist = new TeamCreatorList({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(mobiledetector.$$.fragment);
    			t0 = space();
    			create_component(header.$$.fragment);
    			t1 = space();
    			main = element("main");
    			article = element("article");
    			section = element("section");
    			create_component(basicparagraphs.$$.fragment);
    			t2 = space();
    			div = element("div");
    			create_component(articlelist.$$.fragment);
    			t3 = space();
    			create_component(teamcreatorlist.$$.fragment);
    			t4 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(section, "class", "container-width mx-auto grid-full-cols svelte-gu3le");
    			add_location(section, file$7, 22, 4, 547);
    			attr_dev(article, "class", "main-grid-template");
    			add_location(article, file$7, 21, 2, 506);
    			attr_dev(div, "class", "mx-auto");
    			add_location(div, file$7, 27, 2, 681);
    			add_location(main, file$7, 20, 0, 497);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(mobiledetector, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(header, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, article);
    			append_dev(article, section);
    			mount_component(basicparagraphs, section, null);
    			append_dev(main, t2);
    			append_dev(main, div);
    			mount_component(articlelist, div, null);
    			insert_dev(target, t3, anchor);
    			mount_component(teamcreatorlist, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const articlelist_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				articlelist_changes.$$scope = { dirty, ctx };
    			}

    			articlelist.$set(articlelist_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(mobiledetector.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(basicparagraphs.$$.fragment, local);
    			transition_in(articlelist.$$.fragment, local);
    			transition_in(teamcreatorlist.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(mobiledetector.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(basicparagraphs.$$.fragment, local);
    			transition_out(articlelist.$$.fragment, local);
    			transition_out(teamcreatorlist.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(mobiledetector, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(main);
    			destroy_component(basicparagraphs);
    			destroy_component(articlelist);
    			if (detaching) detach_dev(t3);
    			destroy_component(teamcreatorlist, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Header,
    		Footer,
    		BasicParagraphs,
    		TeamCreatorList,
    		MobileDetector,
    		ArticleList
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
