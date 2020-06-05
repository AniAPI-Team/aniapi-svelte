
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
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
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
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
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

    let current_component;
    function set_current_component(component) {
        current_component = component;
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
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.23.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
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
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
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

    const currentPage = writable('home');
    const currentAnime = writable(undefined);

    const API = readable({
      url: {"env":{"API_URL":"http://localhost:8080/api/v1/"}}.env.API_URL,
      endpoints: {
        anime: 'anime',
        episode: 'episode'
      }
    });

    const animeGenres = readable([
      'Action',
      'Adventure',
      'Cars',
      'Comedy',
      'Dementia',
      'Demons',
      'Drama',
      'Ecchi',
      'Fantasy',
      'Game',
      'Harem',
      'Historical',
      'Horror',
      'Josei',
      'Kids',
      'Magic',
      'Martial Arts',
      'Mecha',
      'Military',
      'Music',
      'Mystery',
      'Parody',
      'Police',
      'Psychological',
      'Romance',
      'Samurai',
      'School',
      'Sci - Fi',
      'Seinen',
      'Shoujo',
      'Shoujo Ai',
      'Shounen',
      'Shounen Ai',
      'Slice of Life',
      'Space',
      'Sports',
      'Super Power',
      'Supernatural',
      'Thriller',
      'Vampire',
      'Yaoi',
      'Yuri'
    ]);

    const animeTypes = readable([
      'TV',
      'OVA',
      'Movie',
      'Special',
      'ONA'
    ]);

    const animeSorts = readable([
      'Airing Date',
      'Score',
      'Title'
    ]);

    /* src\components\Navbar.svelte generated by Svelte v3.23.0 */
    const file = "src\\components\\Navbar.svelte";

    function create_fragment(ctx) {
    	let navbar;
    	let nav;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let ul0;
    	let li0;
    	let t2;
    	let li1;
    	let t4;
    	let li2;
    	let t6;
    	let li3;
    	let img1;
    	let img1_src_value;
    	let t7;
    	let ul1;
    	let li4;
    	let img2;
    	let img2_src_value;
    	let t8;
    	let li5;
    	let img3;
    	let img3_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			navbar = element("navbar");
    			nav = element("nav");
    			img0 = element("img");
    			t0 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			li0.textContent = "About";
    			t2 = space();
    			li1 = element("li");
    			li1.textContent = "API";
    			t4 = space();
    			li2 = element("li");
    			li2.textContent = "Status";
    			t6 = space();
    			li3 = element("li");
    			img1 = element("img");
    			t7 = space();
    			ul1 = element("ul");
    			li4 = element("li");
    			img2 = element("img");
    			t8 = space();
    			li5 = element("li");
    			img3 = element("img");
    			if (img0.src !== (img0_src_value = "/images/aniapi_icon.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "AniAPI logo");
    			attr_dev(img0, "class", "brand svelte-15b7dxi");
    			add_location(img0, file, 79, 4, 1317);
    			attr_dev(li0, "class", "svelte-15b7dxi");
    			add_location(li0, file, 85, 6, 1468);
    			attr_dev(li1, "class", "svelte-15b7dxi");
    			add_location(li1, file, 86, 6, 1527);
    			attr_dev(li2, "class", "svelte-15b7dxi");
    			add_location(li2, file, 87, 6, 1582);
    			if (img1.src !== (img1_src_value = "/images/nav_github_icon.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Github");
    			attr_dev(img1, "class", "svelte-15b7dxi");
    			add_location(img1, file, 89, 8, 1657);
    			attr_dev(li3, "class", "svelte-15b7dxi");
    			add_location(li3, file, 88, 6, 1643);
    			attr_dev(ul0, "class", "svelte-15b7dxi");
    			add_location(ul0, file, 84, 4, 1456);
    			if (img2.src !== (img2_src_value = "/images/nav_search_icon.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Search");
    			attr_dev(img2, "class", "svelte-15b7dxi");
    			add_location(img2, file, 97, 8, 1851);
    			attr_dev(li4, "class", "svelte-15b7dxi");
    			add_location(li4, file, 96, 6, 1837);
    			attr_dev(img3, "class", "profile svelte-15b7dxi");
    			if (img3.src !== (img3_src_value = "https://s4.anilist.co/file/anilistcdn/user/avatar/large/default.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "Profile");
    			add_location(img3, file, 100, 8, 1940);
    			attr_dev(li5, "class", "svelte-15b7dxi");
    			add_location(li5, file, 99, 6, 1926);
    			attr_dev(ul1, "class", "side svelte-15b7dxi");
    			add_location(ul1, file, 95, 4, 1812);
    			attr_dev(nav, "class", "svelte-15b7dxi");
    			add_location(nav, file, 78, 2, 1306);
    			attr_dev(navbar, "class", "svelte-15b7dxi");
    			add_location(navbar, file, 77, 0, 1294);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, navbar, anchor);
    			append_dev(navbar, nav);
    			append_dev(nav, img0);
    			append_dev(nav, t0);
    			append_dev(nav, ul0);
    			append_dev(ul0, li0);
    			append_dev(ul0, t2);
    			append_dev(ul0, li1);
    			append_dev(ul0, t4);
    			append_dev(ul0, li2);
    			append_dev(ul0, t6);
    			append_dev(ul0, li3);
    			append_dev(li3, img1);
    			append_dev(nav, t7);
    			append_dev(nav, ul1);
    			append_dev(ul1, li4);
    			append_dev(li4, img2);
    			append_dev(ul1, t8);
    			append_dev(ul1, li5);
    			append_dev(li5, img3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(img0, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(li0, "click", /*click_handler_1*/ ctx[2], false, false, false),
    					listen_dev(li1, "click", /*click_handler_2*/ ctx[3], false, false, false),
    					listen_dev(li2, "click", /*click_handler_3*/ ctx[4], false, false, false),
    					listen_dev(img1, "click", /*click_handler_4*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(navbar);
    			mounted = false;
    			run_all(dispose);
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

    function instance($$self, $$props, $$invalidate) {
    	function changePage(page) {
    		if (page === "github") {
    			window.open("https://github.com/AniAPI-Team/aniapi-svelte");
    			return;
    		}

    		currentPage.set(page);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", $$slots, []);
    	const click_handler = () => changePage("home");
    	const click_handler_1 = () => changePage("about");
    	const click_handler_2 = () => changePage("api");
    	const click_handler_3 = () => changePage("status");
    	const click_handler_4 = () => changePage("github");
    	$$self.$capture_state = () => ({ currentPage, changePage });

    	return [
    		changePage,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\components\TextBox.svelte generated by Svelte v3.23.0 */

    const file$1 = "src\\components\\TextBox.svelte";

    // (80:2) {:else}
    function create_else_block(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-times fa-fw svelte-124qxfa");
    			set_style(i, "visibility", "hidden");
    			add_location(i, file$1, 80, 4, 1315);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(80:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (78:2) {#if !empty}
    function create_if_block(ctx) {
    	let i;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-times fa-fw svelte-124qxfa");
    			add_location(i, file$1, 78, 4, 1249);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);

    			if (!mounted) {
    				dispose = listen_dev(i, "click", /*clear*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(78:2) {#if !empty}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let i;
    	let t0;
    	let input;
    	let t1;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (!/*empty*/ ctx[2]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			i = element("i");
    			t0 = space();
    			input = element("input");
    			t1 = space();
    			if_block.c();
    			attr_dev(i, "class", "fas fa-search fa-fw svelte-124qxfa");
    			add_location(i, file$1, 75, 2, 1120);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", /*hint*/ ctx[1]);
    			input.value = /*text*/ ctx[0];
    			attr_dev(input, "class", "svelte-124qxfa");
    			add_location(input, file$1, 76, 2, 1157);
    			attr_dev(div, "class", "textbox svelte-124qxfa");
    			add_location(div, file$1, 74, 0, 1095);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, i);
    			append_dev(div, t0);
    			append_dev(div, input);
    			append_dev(div, t1);
    			if_block.m(div, null);

    			if (!mounted) {
    				dispose = listen_dev(input, "keyup", /*keyUp*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*hint*/ 2) {
    				attr_dev(input, "placeholder", /*hint*/ ctx[1]);
    			}

    			if (dirty & /*text*/ 1 && input.value !== /*text*/ ctx[0]) {
    				prop_dev(input, "value", /*text*/ ctx[0]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			mounted = false;
    			dispose();
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
    	let { hint } = $$props;
    	let { callback } = $$props;
    	let { text } = $$props;
    	let empty = true;

    	if (!text) {
    		text = "";
    	}

    	function keyUp(e) {
    		let value = e.target.value.trim();
    		$$invalidate(2, empty = value === "");
    		$$invalidate(0, text = value);

    		if (callback) {
    			callback(text);
    		}
    	}

    	function clear() {
    		$$invalidate(0, text = "");
    		$$invalidate(2, empty = true);

    		if (callback) {
    			callback(text);
    		}
    	}

    	const writable_props = ["hint", "callback", "text"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TextBox> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TextBox", $$slots, []);

    	$$self.$set = $$props => {
    		if ("hint" in $$props) $$invalidate(1, hint = $$props.hint);
    		if ("callback" in $$props) $$invalidate(5, callback = $$props.callback);
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    	};

    	$$self.$capture_state = () => ({
    		hint,
    		callback,
    		text,
    		empty,
    		keyUp,
    		clear
    	});

    	$$self.$inject_state = $$props => {
    		if ("hint" in $$props) $$invalidate(1, hint = $$props.hint);
    		if ("callback" in $$props) $$invalidate(5, callback = $$props.callback);
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("empty" in $$props) $$invalidate(2, empty = $$props.empty);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, hint, empty, keyUp, clear, callback];
    }

    class TextBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { hint: 1, callback: 5, text: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextBox",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*hint*/ ctx[1] === undefined && !("hint" in props)) {
    			console.warn("<TextBox> was created without expected prop 'hint'");
    		}

    		if (/*callback*/ ctx[5] === undefined && !("callback" in props)) {
    			console.warn("<TextBox> was created without expected prop 'callback'");
    		}

    		if (/*text*/ ctx[0] === undefined && !("text" in props)) {
    			console.warn("<TextBox> was created without expected prop 'text'");
    		}
    	}

    	get hint() {
    		throw new Error("<TextBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hint(value) {
    		throw new Error("<TextBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get callback() {
    		throw new Error("<TextBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<TextBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<TextBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<TextBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\ComboBox.svelte generated by Svelte v3.23.0 */

    const file$2 = "src\\components\\ComboBox.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    // (247:2) {:else}
    function create_else_block_1(ctx) {
    	let i;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-chevron-down fa-fw svelte-1ob5j3g");
    			add_location(i, file$2, 247, 4, 4453);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);

    			if (!mounted) {
    				dispose = listen_dev(i, "click", /*show*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(247:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (245:2) {#if !empty}
    function create_if_block_2(ctx) {
    	let i;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-times fa-fw svelte-1ob5j3g");
    			add_location(i, file$2, 245, 4, 4387);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);

    			if (!mounted) {
    				dispose = listen_dev(i, "click", /*clear*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(245:2) {#if !empty}",
    		ctx
    	});

    	return block;
    }

    // (252:6) {#if item.value.toLowerCase().includes(text.toLowerCase())}
    function create_if_block$1(ctx) {
    	let div;
    	let t0_value = /*item*/ ctx[18].value + "";
    	let t0;
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*item*/ ctx[18].selected) return create_if_block_1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[16](/*item*/ ctx[18], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			if_block.c();
    			t2 = space();
    			attr_dev(div, "class", "item svelte-1ob5j3g");
    			add_location(div, file$2, 252, 8, 4678);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			if_block.m(div, null);
    			append_dev(div, t2);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*items*/ 2 && t0_value !== (t0_value = /*item*/ ctx[18].value + "")) set_data_dev(t0, t0_value);

    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t2);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(252:6) {#if item.value.toLowerCase().includes(text.toLowerCase())}",
    		ctx
    	});

    	return block;
    }

    // (257:10) {:else}
    function create_else_block$1(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-check-circle fa-fw svelte-1ob5j3g");
    			set_style(i, "visibility", "hidden");
    			add_location(i, file$2, 257, 12, 4877);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(257:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (255:10) {#if item.selected}
    function create_if_block_1(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-check-circle fa-fw svelte-1ob5j3g");
    			add_location(i, file$2, 255, 12, 4805);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(255:10) {#if item.selected}",
    		ctx
    	});

    	return block;
    }

    // (251:4) {#each items as item}
    function create_each_block(ctx) {
    	let show_if = /*item*/ ctx[18].value.toLowerCase().includes(/*text*/ ctx[0].toLowerCase());
    	let if_block_anchor;
    	let if_block = show_if && create_if_block$1(ctx);

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
    			if (dirty & /*items, text*/ 3) show_if = /*item*/ ctx[18].value.toLowerCase().includes(/*text*/ ctx[0].toLowerCase());

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(251:4) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let input;
    	let t0;
    	let t1;
    	let div0;
    	let div0_class_value;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (!/*empty*/ ctx[4]) return create_if_block_2;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);
    	let each_value = /*items*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			input = element("input");
    			t0 = space();
    			if_block.c();
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", /*hint*/ ctx[2]);
    			input.value = /*text*/ ctx[0];
    			attr_dev(input, "class", "svelte-1ob5j3g");
    			add_location(input, file$2, 238, 2, 4254);
    			attr_dev(div0, "class", div0_class_value = "dropdown " + (/*showDropdown*/ ctx[5] ? "active" : "") + " svelte-1ob5j3g");
    			add_location(div0, file$2, 249, 2, 4521);
    			attr_dev(div1, "class", "combobox svelte-1ob5j3g");
    			add_location(div1, file$2, 237, 0, 4208);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, input);
    			append_dev(div1, t0);
    			if_block.m(div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			/*div1_binding*/ ctx[17](div1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "keyup", /*keyUp*/ ctx[6], false, false, false),
    					listen_dev(input, "click", /*show*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*hint*/ 4) {
    				attr_dev(input, "placeholder", /*hint*/ ctx[2]);
    			}

    			if (dirty & /*text*/ 1 && input.value !== /*text*/ ctx[0]) {
    				prop_dev(input, "value", /*text*/ ctx[0]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, t1);
    				}
    			}

    			if (dirty & /*changeItem, items, text*/ 259) {
    				each_value = /*items*/ ctx[1];
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

    			if (dirty & /*showDropdown*/ 32 && div0_class_value !== (div0_class_value = "dropdown " + (/*showDropdown*/ ctx[5] ? "active" : "") + " svelte-1ob5j3g")) {
    				attr_dev(div0, "class", div0_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_block.d();
    			destroy_each(each_blocks, detaching);
    			/*div1_binding*/ ctx[17](null);
    			mounted = false;
    			run_all(dispose);
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
    	let { hint } = $$props;
    	let { text } = $$props;
    	let { items } = $$props;
    	let { single } = $$props;
    	let { selected = undefined } = $$props;
    	let { callback } = $$props;
    	let element;
    	let empty = true;
    	let showDropdown = false;

    	if (!text) {
    		text = "";
    	}

    	if (!items) {
    		items = [];
    	}

    	if (!single) {
    		single = false;
    	}

    	for (let i = 0; i < items.length; i++) {
    		if (items[i].value) {
    			items[i].selected = selected && items[i].value === selected;
    			continue;
    		}

    		items[i] = {
    			value: items[i],
    			selected: selected && items[i] === selected
    		};
    	}

    	document.body.addEventListener("click", function (e) {
    		let outside = true;

    		for (let i = 0; i < e.path.length; i++) {
    			if (e.path[i] === element) {
    				outside = false;
    			}
    		}

    		if (outside) {
    			$$invalidate(5, showDropdown = false);
    		}
    	});

    	function keyUp(e) {
    		let value = e.target.value.trim();
    		$$invalidate(0, text = value);
    	}

    	function show() {
    		$$invalidate(5, showDropdown = true);
    	}

    	function changeItem(value) {
    		if (single) {
    			deselectAll();
    		}

    		let item = items.find(x => x.value === value);
    		item.selected = !item.selected;
    		$$invalidate(1, items);
    		$$invalidate(4, empty = !isOneSelected());
    		$$invalidate(0, text = "");
    		callCallback();
    	}

    	function isOneSelected() {
    		for (let i = 0; i < items.length; i++) {
    			if (items[i].selected) {
    				return true;
    			}
    		}

    		return false;
    	}

    	function deselectAll() {
    		for (let i = 0; i < items.length; i++) {
    			$$invalidate(1, items[i].selected = false, items);
    		}

    		$$invalidate(1, items);
    	}

    	function callCallback() {
    		if (!callback) {
    			return;
    		}

    		let values = [];

    		for (let i = 0; i < items.length; i++) {
    			if (items[i].selected) {
    				values.push(items[i].value);
    			}
    		}

    		if (single) {
    			callback(values[0]);
    		} else {
    			callback(values);
    		}
    	}

    	function clear() {
    		for (let i = 0; i < items.length; i++) {
    			if (single && selected) {
    				$$invalidate(1, items[i].selected = items[i].value === selected, items);
    			} else {
    				$$invalidate(1, items[i].selected = false, items);
    			}
    		}

    		callCallback();
    		$$invalidate(4, empty = true);
    	}

    	const writable_props = ["hint", "text", "items", "single", "selected", "callback"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ComboBox> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ComboBox", $$slots, []);
    	const click_handler = item => changeItem(item.value);

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(3, element = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("hint" in $$props) $$invalidate(2, hint = $$props.hint);
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("items" in $$props) $$invalidate(1, items = $$props.items);
    		if ("single" in $$props) $$invalidate(10, single = $$props.single);
    		if ("selected" in $$props) $$invalidate(11, selected = $$props.selected);
    		if ("callback" in $$props) $$invalidate(12, callback = $$props.callback);
    	};

    	$$self.$capture_state = () => ({
    		hint,
    		text,
    		items,
    		single,
    		selected,
    		callback,
    		element,
    		empty,
    		showDropdown,
    		keyUp,
    		show,
    		changeItem,
    		isOneSelected,
    		deselectAll,
    		callCallback,
    		clear
    	});

    	$$self.$inject_state = $$props => {
    		if ("hint" in $$props) $$invalidate(2, hint = $$props.hint);
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("items" in $$props) $$invalidate(1, items = $$props.items);
    		if ("single" in $$props) $$invalidate(10, single = $$props.single);
    		if ("selected" in $$props) $$invalidate(11, selected = $$props.selected);
    		if ("callback" in $$props) $$invalidate(12, callback = $$props.callback);
    		if ("element" in $$props) $$invalidate(3, element = $$props.element);
    		if ("empty" in $$props) $$invalidate(4, empty = $$props.empty);
    		if ("showDropdown" in $$props) $$invalidate(5, showDropdown = $$props.showDropdown);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		text,
    		items,
    		hint,
    		element,
    		empty,
    		showDropdown,
    		keyUp,
    		show,
    		changeItem,
    		clear,
    		single,
    		selected,
    		callback,
    		isOneSelected,
    		deselectAll,
    		callCallback,
    		click_handler,
    		div1_binding
    	];
    }

    class ComboBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			hint: 2,
    			text: 0,
    			items: 1,
    			single: 10,
    			selected: 11,
    			callback: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ComboBox",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*hint*/ ctx[2] === undefined && !("hint" in props)) {
    			console.warn("<ComboBox> was created without expected prop 'hint'");
    		}

    		if (/*text*/ ctx[0] === undefined && !("text" in props)) {
    			console.warn("<ComboBox> was created without expected prop 'text'");
    		}

    		if (/*items*/ ctx[1] === undefined && !("items" in props)) {
    			console.warn("<ComboBox> was created without expected prop 'items'");
    		}

    		if (/*single*/ ctx[10] === undefined && !("single" in props)) {
    			console.warn("<ComboBox> was created without expected prop 'single'");
    		}

    		if (/*callback*/ ctx[12] === undefined && !("callback" in props)) {
    			console.warn("<ComboBox> was created without expected prop 'callback'");
    		}
    	}

    	get hint() {
    		throw new Error("<ComboBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hint(value) {
    		throw new Error("<ComboBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<ComboBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<ComboBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get items() {
    		throw new Error("<ComboBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<ComboBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get single() {
    		throw new Error("<ComboBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set single(value) {
    		throw new Error("<ComboBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<ComboBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<ComboBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get callback() {
    		throw new Error("<ComboBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<ComboBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\CheckBox.svelte generated by Svelte v3.23.0 */

    const file$3 = "src\\components\\CheckBox.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let div0;
    	let i;
    	let div0_class_value;
    	let t0;
    	let span;
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			i = element("i");
    			t0 = space();
    			span = element("span");
    			t1 = text(/*label*/ ctx[1]);
    			attr_dev(i, "class", "fas fa-check fa-fw svelte-b1zr5s");
    			add_location(i, file$3, 51, 4, 966);
    			attr_dev(div0, "class", div0_class_value = "circle " + (/*checked*/ ctx[0] ? "checked" : "") + " svelte-b1zr5s");
    			add_location(div0, file$3, 50, 2, 913);
    			add_location(span, file$3, 53, 2, 1012);
    			attr_dev(div1, "class", "checkbox svelte-b1zr5s");
    			add_location(div1, file$3, 49, 0, 869);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, i);
    			append_dev(div1, t0);
    			append_dev(div1, span);
    			append_dev(span, t1);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", /*toggle*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*checked*/ 1 && div0_class_value !== (div0_class_value = "circle " + (/*checked*/ ctx[0] ? "checked" : "") + " svelte-b1zr5s")) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (dirty & /*label*/ 2) set_data_dev(t1, /*label*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
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
    	let { label = "" } = $$props;
    	let { checked = false } = $$props;
    	let { callback } = $$props;

    	function toggle() {
    		$$invalidate(0, checked = !checked);

    		if (callback) {
    			callback(checked);
    		}
    	}

    	const writable_props = ["label", "checked", "callback"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CheckBox> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("CheckBox", $$slots, []);

    	$$self.$set = $$props => {
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("checked" in $$props) $$invalidate(0, checked = $$props.checked);
    		if ("callback" in $$props) $$invalidate(3, callback = $$props.callback);
    	};

    	$$self.$capture_state = () => ({ label, checked, callback, toggle });

    	$$self.$inject_state = $$props => {
    		if ("label" in $$props) $$invalidate(1, label = $$props.label);
    		if ("checked" in $$props) $$invalidate(0, checked = $$props.checked);
    		if ("callback" in $$props) $$invalidate(3, callback = $$props.callback);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [checked, label, toggle, callback];
    }

    class CheckBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { label: 1, checked: 0, callback: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CheckBox",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*callback*/ ctx[3] === undefined && !("callback" in props)) {
    			console.warn("<CheckBox> was created without expected prop 'callback'");
    		}
    	}

    	get label() {
    		throw new Error("<CheckBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<CheckBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get checked() {
    		throw new Error("<CheckBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<CheckBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get callback() {
    		throw new Error("<CheckBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<CheckBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\SearchTag.svelte generated by Svelte v3.23.0 */

    const file$4 = "src\\components\\SearchTag.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (27:0) {#if tags.length > 0}
    function create_if_block$2(ctx) {
    	let div;
    	let span;
    	let t0;
    	let t1;
    	let each_value = /*tags*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(/*name*/ ctx[0]);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span, "class", "name svelte-1oxf602");
    			add_location(span, file$4, 28, 4, 451);
    			attr_dev(div, "class", "tags svelte-1oxf602");
    			add_location(div, file$4, 27, 2, 427);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*name*/ 1) set_data_dev(t0, /*name*/ ctx[0]);

    			if (dirty & /*tags*/ 2) {
    				each_value = /*tags*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(27:0) {#if tags.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (30:4) {#each tags as tag}
    function create_each_block$1(ctx) {
    	let span;
    	let t_value = /*tag*/ ctx[2] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "tag svelte-1oxf602");
    			add_location(span, file$4, 30, 6, 516);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tags*/ 2 && t_value !== (t_value = /*tag*/ ctx[2] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(30:4) {#each tags as tag}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let if_block_anchor;
    	let if_block = /*tags*/ ctx[1].length > 0 && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*tags*/ ctx[1].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let { name } = $$props;
    	let { tags } = $$props;
    	const writable_props = ["name", "tags"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SearchTag> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SearchTag", $$slots, []);

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("tags" in $$props) $$invalidate(1, tags = $$props.tags);
    	};

    	$$self.$capture_state = () => ({ name, tags });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("tags" in $$props) $$invalidate(1, tags = $$props.tags);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, tags];
    }

    class SearchTag extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { name: 0, tags: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchTag",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<SearchTag> was created without expected prop 'name'");
    		}

    		if (/*tags*/ ctx[1] === undefined && !("tags" in props)) {
    			console.warn("<SearchTag> was created without expected prop 'tags'");
    		}
    	}

    	get name() {
    		throw new Error("<SearchTag>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<SearchTag>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tags() {
    		throw new Error("<SearchTag>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tags(value) {
    		throw new Error("<SearchTag>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\SearchResult.svelte generated by Svelte v3.23.0 */
    const file$5 = "src\\components\\SearchResult.svelte";

    // (88:6) {#if data.score !== 0}
    function create_if_block$3(ctx) {
    	let i;
    	let t0;
    	let t1_value = /*data*/ ctx[0].score + "";
    	let t1;

    	const block = {
    		c: function create() {
    			i = element("i");
    			t0 = space();
    			t1 = text(t1_value);
    			attr_dev(i, "class", "fas fa-heart fa-fw svelte-owe8m7");
    			add_location(i, file$5, 88, 8, 1791);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t1_value !== (t1_value = /*data*/ ctx[0].score + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(88:6) {#if data.score !== 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2_value = /*data*/ ctx[0].title + "";
    	let t2;
    	let mounted;
    	let dispose;
    	let if_block = /*data*/ ctx[0].score !== 0 && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t1 = space();
    			div2 = element("div");
    			t2 = text(t2_value);
    			attr_dev(div0, "class", "overlay svelte-owe8m7");
    			add_location(div0, file$5, 85, 4, 1703);
    			attr_dev(div1, "class", "score svelte-owe8m7");
    			add_location(div1, file$5, 86, 4, 1732);
    			attr_dev(div2, "class", "title svelte-owe8m7");
    			add_location(div2, file$5, 92, 4, 1876);
    			attr_dev(div3, "class", "picture svelte-owe8m7");
    			set_style(div3, "background-image", "url(" + /*data*/ ctx[0].picture + ")");
    			add_location(div3, file$5, 84, 2, 1631);
    			attr_dev(div4, "class", "card svelte-owe8m7");
    			add_location(div4, file$5, 83, 0, 1574);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, t2);

    			if (!mounted) {
    				dispose = listen_dev(div4, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*data*/ ctx[0].score !== 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*data*/ 1 && t2_value !== (t2_value = /*data*/ ctx[0].title + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*data*/ 1) {
    				set_style(div3, "background-image", "url(" + /*data*/ ctx[0].picture + ")");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
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
    	let { data } = $$props;

    	function selectAnime(anime) {
    		currentAnime.set(anime);
    		currentPage.set("detail");
    	}

    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SearchResult> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SearchResult", $$slots, []);
    	const click_handler = () => selectAnime(data);

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({
    		currentPage,
    		currentAnime,
    		data,
    		selectAnime
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data, selectAnime, click_handler];
    }

    class SearchResult extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchResult",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<SearchResult> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<SearchResult>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<SearchResult>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const api = get_store_value(API);

    async function getAnimes(title, genres, type, sort, desc, callback) {
      let url = api.url + api.endpoints.anime + '?';

      let params = [];

      if (title !== '') {
        params.push('title=' + encodeURI(title));
      }

      if (genres.length > 0) {
        params.push('genres=' + genres.join(','));
      }

      if (type !== '') {
        params.push('type=' + type);
      }

      if (sort !== '') {
        switch (sort) {
          case 'Airing Date':
            sort = 'airing_start';
            break;
          case 'Score':
            sort = 'score';
            break;
          case 'Title':
            sort = 'main_title';
            break;
        }

        params.push('sort=' + sort);
      }

      if (desc) {
        params.push('desc=1');
      }

      url += params.join('&');
      console.log(url);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let data = await res.json();
      callback(data);
    }

    /* src\views\Home.svelte generated by Svelte v3.23.0 */
    const file$6 = "src\\views\\Home.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (117:4) {#if search.title !== ''}
    function create_if_block_1$1(ctx) {
    	let current;

    	const searchtag = new SearchTag({
    			props: {
    				name: "Title",
    				tags: [/*search*/ ctx[0].title]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(searchtag.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(searchtag, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const searchtag_changes = {};
    			if (dirty & /*search*/ 1) searchtag_changes.tags = [/*search*/ ctx[0].title];
    			searchtag.$set(searchtag_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(searchtag.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(searchtag.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(searchtag, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(117:4) {#if search.title !== ''}",
    		ctx
    	});

    	return block;
    }

    // (122:4) {#if search.sort !== ''}
    function create_if_block$4(ctx) {
    	let current;

    	const searchtag = new SearchTag({
    			props: {
    				name: "Sort",
    				tags: [/*search*/ ctx[0].sort]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(searchtag.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(searchtag, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const searchtag_changes = {};
    			if (dirty & /*search*/ 1) searchtag_changes.tags = [/*search*/ ctx[0].sort];
    			searchtag.$set(searchtag_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(searchtag.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(searchtag.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(searchtag, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(122:4) {#if search.sort !== ''}",
    		ctx
    	});

    	return block;
    }

    // (127:4) {#each search.results as result}
    function create_each_block$2(ctx) {
    	let current;

    	const searchresult = new SearchResult({
    			props: { data: /*result*/ ctx[8] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(searchresult.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(searchresult, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const searchresult_changes = {};
    			if (dirty & /*search*/ 1) searchresult_changes.data = /*result*/ ctx[8];
    			searchresult.$set(searchresult_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(searchresult.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(searchresult.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(searchresult, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(127:4) {#each search.results as result}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let main;
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let div1;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let div2;
    	let current;

    	const textbox = new TextBox({
    			props: {
    				hint: "Search",
    				callback: /*onTitleChange*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const combobox0 = new ComboBox({
    			props: {
    				hint: "Genres",
    				items: get_store_value(animeGenres),
    				callback: /*onGenresChange*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const combobox1 = new ComboBox({
    			props: {
    				hint: "Type",
    				items: get_store_value(animeTypes),
    				selected: "TV",
    				single: true,
    				callback: /*onTypeChange*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const combobox2 = new ComboBox({
    			props: {
    				hint: "Sort",
    				items: get_store_value(animeSorts),
    				selected: "Title",
    				single: true,
    				callback: /*onSortChange*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const checkbox = new CheckBox({
    			props: {
    				label: "Sort descending",
    				callback: /*onSortDirectionChange*/ ctx[5]
    			},
    			$$inline: true
    		});

    	let if_block0 = /*search*/ ctx[0].title !== "" && create_if_block_1$1(ctx);

    	const searchtag0 = new SearchTag({
    			props: {
    				name: "Genres",
    				tags: /*search*/ ctx[0].genres
    			},
    			$$inline: true
    		});

    	const searchtag1 = new SearchTag({
    			props: {
    				name: "Type",
    				tags: [/*search*/ ctx[0].type]
    			},
    			$$inline: true
    		});

    	let if_block1 = /*search*/ ctx[0].sort !== "" && create_if_block$4(ctx);
    	let each_value = /*search*/ ctx[0].results;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			create_component(textbox.$$.fragment);
    			t0 = space();
    			create_component(combobox0.$$.fragment);
    			t1 = space();
    			create_component(combobox1.$$.fragment);
    			t2 = space();
    			create_component(combobox2.$$.fragment);
    			t3 = space();
    			create_component(checkbox.$$.fragment);
    			t4 = space();
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t5 = space();
    			create_component(searchtag0.$$.fragment);
    			t6 = space();
    			create_component(searchtag1.$$.fragment);
    			t7 = space();
    			if (if_block1) if_block1.c();
    			t8 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "search-filters svelte-9xkn2r");
    			add_location(div0, file$6, 95, 2, 1930);
    			attr_dev(div1, "class", "search-tags svelte-9xkn2r");
    			add_location(div1, file$6, 115, 2, 2492);
    			attr_dev(div2, "class", "search-results svelte-9xkn2r");
    			add_location(div2, file$6, 125, 2, 2830);
    			attr_dev(main, "class", "svelte-9xkn2r");
    			add_location(main, file$6, 94, 0, 1920);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			mount_component(textbox, div0, null);
    			append_dev(div0, t0);
    			mount_component(combobox0, div0, null);
    			append_dev(div0, t1);
    			mount_component(combobox1, div0, null);
    			append_dev(div0, t2);
    			mount_component(combobox2, div0, null);
    			append_dev(div0, t3);
    			mount_component(checkbox, div0, null);
    			append_dev(main, t4);
    			append_dev(main, div1);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t5);
    			mount_component(searchtag0, div1, null);
    			append_dev(div1, t6);
    			mount_component(searchtag1, div1, null);
    			append_dev(div1, t7);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(main, t8);
    			append_dev(main, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*search*/ ctx[0].title !== "") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*search*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div1, t5);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			const searchtag0_changes = {};
    			if (dirty & /*search*/ 1) searchtag0_changes.tags = /*search*/ ctx[0].genres;
    			searchtag0.$set(searchtag0_changes);
    			const searchtag1_changes = {};
    			if (dirty & /*search*/ 1) searchtag1_changes.tags = [/*search*/ ctx[0].type];
    			searchtag1.$set(searchtag1_changes);

    			if (/*search*/ ctx[0].sort !== "") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*search*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$4(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*search*/ 1) {
    				each_value = /*search*/ ctx[0].results;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div2, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textbox.$$.fragment, local);
    			transition_in(combobox0.$$.fragment, local);
    			transition_in(combobox1.$$.fragment, local);
    			transition_in(combobox2.$$.fragment, local);
    			transition_in(checkbox.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(searchtag0.$$.fragment, local);
    			transition_in(searchtag1.$$.fragment, local);
    			transition_in(if_block1);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textbox.$$.fragment, local);
    			transition_out(combobox0.$$.fragment, local);
    			transition_out(combobox1.$$.fragment, local);
    			transition_out(combobox2.$$.fragment, local);
    			transition_out(checkbox.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(searchtag0.$$.fragment, local);
    			transition_out(searchtag1.$$.fragment, local);
    			transition_out(if_block1);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(textbox);
    			destroy_component(combobox0);
    			destroy_component(combobox1);
    			destroy_component(combobox2);
    			destroy_component(checkbox);
    			if (if_block0) if_block0.d();
    			destroy_component(searchtag0);
    			destroy_component(searchtag1);
    			if (if_block1) if_block1.d();
    			destroy_each(each_blocks, detaching);
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

    function instance$6($$self, $$props, $$invalidate) {
    	let search = {
    		title: "",
    		genres: [],
    		type: "TV",
    		sort: "Title",
    		desc: false,
    		results: []
    	};

    	let searchTimeout;

    	function onTitleChange(text) {
    		$$invalidate(0, search.title = text, search);
    		onChange();
    	}

    	function onGenresChange(values) {
    		$$invalidate(0, search.genres = values, search);
    		onChange();
    	}

    	function onTypeChange(value) {
    		$$invalidate(0, search.type = value, search);
    		onChange();
    	}

    	function onSortChange(value) {
    		$$invalidate(0, search.sort = value, search);
    		onChange();
    	}

    	function onSortDirectionChange(value) {
    		$$invalidate(0, search.desc = value, search);
    		onChange();
    	}

    	function onChange() {
    		clearTimeout(searchTimeout);
    		searchTimeout = setTimeout(() => getAnimes(search.title, search.genres, search.type, search.sort, search.desc, results => $$invalidate(0, search.results = results, search)), 1000);
    	}

    	onChange();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Home", $$slots, []);

    	$$self.$capture_state = () => ({
    		TextBox,
    		ComboBox,
    		CheckBox,
    		SearchTag,
    		SearchResult,
    		get: get_store_value,
    		animeGenres,
    		animeTypes,
    		animeSorts,
    		getAnimes,
    		search,
    		searchTimeout,
    		onTitleChange,
    		onGenresChange,
    		onTypeChange,
    		onSortChange,
    		onSortDirectionChange,
    		onChange
    	});

    	$$self.$inject_state = $$props => {
    		if ("search" in $$props) $$invalidate(0, search = $$props.search);
    		if ("searchTimeout" in $$props) searchTimeout = $$props.searchTimeout;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		search,
    		onTitleChange,
    		onGenresChange,
    		onTypeChange,
    		onSortChange,
    		onSortDirectionChange
    	];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\views\Detail.svelte generated by Svelte v3.23.0 */
    const file$7 = "src\\views\\Detail.svelte";

    function create_fragment$7(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = `${/*anime*/ ctx[0].title}`;
    			add_location(h1, file$7, 7, 0, 147);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
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
    	const anime = get_store_value(currentAnime);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Detail> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Detail", $$slots, []);
    	$$self.$capture_state = () => ({ get: get_store_value, currentAnime, anime });
    	return [anime];
    }

    class Detail extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Detail",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.23.0 */
    const file$8 = "src\\App.svelte";

    // (21:2) {#if page === 'home'}
    function create_if_block_1$2(ctx) {
    	let current;
    	const home = new Home({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(home.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(home, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(home.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(home.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(home, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(21:2) {#if page === 'home'}",
    		ctx
    	});

    	return block;
    }

    // (25:2) {#if page === 'detail'}
    function create_if_block$5(ctx) {
    	let current;
    	const detail = new Detail({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(detail.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(detail, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(detail.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(detail.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(detail, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(25:2) {#if page === 'detail'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let t0;
    	let main;
    	let t1;
    	let current;
    	const navbar = new Navbar({ $$inline: true });
    	let if_block0 = /*page*/ ctx[0] === "home" && create_if_block_1$2(ctx);
    	let if_block1 = /*page*/ ctx[0] === "detail" && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			add_location(main, file$8, 19, 0, 367);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(navbar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t1);
    			if (if_block1) if_block1.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*page*/ ctx[0] === "home") {
    				if (if_block0) {
    					if (dirty & /*page*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*page*/ ctx[0] === "detail") {
    				if (if_block1) {
    					if (dirty & /*page*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$5(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navbar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
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
    	let page = get_store_value(currentPage);

    	currentPage.subscribe(newPage => {
    		$$invalidate(0, page = newPage);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Navbar,
    		Home,
    		Detail,
    		get: get_store_value,
    		currentPage,
    		page
    	});

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page];
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
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
