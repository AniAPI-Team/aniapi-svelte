
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
    function null_to_empty(value) {
        return value == null ? '' : value;
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
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
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

    /* src\components\Button.svelte generated by Svelte v3.23.0 */

    const file = "src\\components\\Button.svelte";

    // (104:2) {#if icon}
    function create_if_block_2(ctx) {
    	let i;
    	let i_class_value;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", i_class_value = "fas fa-" + /*icon*/ ctx[1] + " fa-fw" + " svelte-ubs5cm");
    			add_location(i, file, 104, 4, 1905);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*icon*/ 2 && i_class_value !== (i_class_value = "fas fa-" + /*icon*/ ctx[1] + " fa-fw" + " svelte-ubs5cm")) {
    				attr_dev(i, "class", i_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(i);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(104:2) {#if icon}",
    		ctx
    	});

    	return block;
    }

    // (107:2) {#if text}
    function create_if_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*text*/ ctx[0]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*text*/ 1) set_data_dev(t, /*text*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(107:2) {#if text}",
    		ctx
    	});

    	return block;
    }

    // (108:2) {#if tooltip}
    function create_if_block(ctx) {
    	let div;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", div_class_value = "tooltip " + /*tooltipDirection*/ ctx[3] + " svelte-ubs5cm");
    			add_location(div, file, 108, 4, 1995);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			div.innerHTML = /*tooltip*/ ctx[2];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tooltip*/ 4) div.innerHTML = /*tooltip*/ ctx[2];
    			if (dirty & /*tooltipDirection*/ 8 && div_class_value !== (div_class_value = "tooltip " + /*tooltipDirection*/ ctx[3] + " svelte-ubs5cm")) {
    				attr_dev(div, "class", div_class_value);
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
    		source: "(108:2) {#if tooltip}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let button;
    	let t0;
    	let t1;
    	let button_class_value;
    	let mounted;
    	let dispose;
    	let if_block0 = /*icon*/ ctx[1] && create_if_block_2(ctx);
    	let if_block1 = /*text*/ ctx[0] && create_if_block_1(ctx);
    	let if_block2 = /*tooltip*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*circle*/ ctx[4] ? "circle" : "") + " svelte-ubs5cm"));
    			attr_dev(button, "style", /*css*/ ctx[5]);
    			add_location(button, file, 102, 0, 1814);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if (if_block0) if_block0.m(button, null);
    			append_dev(button, t0);
    			if (if_block1) if_block1.m(button, null);
    			append_dev(button, t1);
    			if (if_block2) if_block2.m(button, null);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*callback*/ ctx[6])) /*callback*/ ctx[6].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (/*icon*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(button, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*text*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(button, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*tooltip*/ ctx[2]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(button, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty & /*circle*/ 16 && button_class_value !== (button_class_value = "" + (null_to_empty(/*circle*/ ctx[4] ? "circle" : "") + " svelte-ubs5cm"))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (dirty & /*css*/ 32) {
    				attr_dev(button, "style", /*css*/ ctx[5]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			dispose();
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
    	let { text } = $$props;
    	let { icon } = $$props;
    	let { tooltip } = $$props;
    	let { tooltipDirection = "left" } = $$props;
    	let { circle } = $$props;
    	let { css } = $$props;
    	let { callback } = $$props;
    	const writable_props = ["text", "icon", "tooltip", "tooltipDirection", "circle", "css", "callback"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Button", $$slots, []);

    	$$self.$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("tooltip" in $$props) $$invalidate(2, tooltip = $$props.tooltip);
    		if ("tooltipDirection" in $$props) $$invalidate(3, tooltipDirection = $$props.tooltipDirection);
    		if ("circle" in $$props) $$invalidate(4, circle = $$props.circle);
    		if ("css" in $$props) $$invalidate(5, css = $$props.css);
    		if ("callback" in $$props) $$invalidate(6, callback = $$props.callback);
    	};

    	$$self.$capture_state = () => ({
    		text,
    		icon,
    		tooltip,
    		tooltipDirection,
    		circle,
    		css,
    		callback
    	});

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("tooltip" in $$props) $$invalidate(2, tooltip = $$props.tooltip);
    		if ("tooltipDirection" in $$props) $$invalidate(3, tooltipDirection = $$props.tooltipDirection);
    		if ("circle" in $$props) $$invalidate(4, circle = $$props.circle);
    		if ("css" in $$props) $$invalidate(5, css = $$props.css);
    		if ("callback" in $$props) $$invalidate(6, callback = $$props.callback);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, icon, tooltip, tooltipDirection, circle, css, callback];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			text: 0,
    			icon: 1,
    			tooltip: 2,
    			tooltipDirection: 3,
    			circle: 4,
    			css: 5,
    			callback: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*text*/ ctx[0] === undefined && !("text" in props)) {
    			console.warn("<Button> was created without expected prop 'text'");
    		}

    		if (/*icon*/ ctx[1] === undefined && !("icon" in props)) {
    			console.warn("<Button> was created without expected prop 'icon'");
    		}

    		if (/*tooltip*/ ctx[2] === undefined && !("tooltip" in props)) {
    			console.warn("<Button> was created without expected prop 'tooltip'");
    		}

    		if (/*circle*/ ctx[4] === undefined && !("circle" in props)) {
    			console.warn("<Button> was created without expected prop 'circle'");
    		}

    		if (/*css*/ ctx[5] === undefined && !("css" in props)) {
    			console.warn("<Button> was created without expected prop 'css'");
    		}

    		if (/*callback*/ ctx[6] === undefined && !("callback" in props)) {
    			console.warn("<Button> was created without expected prop 'callback'");
    		}
    	}

    	get text() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tooltip() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tooltip(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tooltipDirection() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tooltipDirection(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get circle() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set circle(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get css() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set css(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get callback() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
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

    const currentUser = writable(undefined);

    const currentPage = writable('home');
    const currentAnime = writable(undefined);
    const currentVideo = writable(undefined);

    const API = readable({
      url: {"env":{"API_URL":"http://localhost:8080/api/v1/","ANILIST_CLIENTID":"3615"}}.env.API_URL,
      endpoints: {
        anime: 'anime',
        episode: 'episode',
        matching: 'matching',
        notification: 'notification',
        scraper: 'scraper',
        queue: 'queue'
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

    const animeStatuses = readable([
      'None',
      'Watching',
      'Paused',
      'Completed',
      'Planning',
      'Dropped'
    ]);

    const animeEpisodesFrom = readable([
      'dreamsub'
    ]);

    const animeEpisodesFromTemplate = readable({
      'dreamsub': 'https://dreamsub.stream/anime/anime-name'
    });

    /* src\components\Navbar.svelte generated by Svelte v3.23.0 */
    const file$1 = "src\\components\\Navbar.svelte";

    // (124:6) {#if user}
    function create_if_block_1$1(ctx) {
    	let li0;
    	let img;
    	let img_src_value;
    	let t0;
    	let li1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			li0 = element("li");
    			img = element("img");
    			t0 = space();
    			li1 = element("li");
    			li1.textContent = "Profile";
    			if (img.src !== (img_src_value = "/images/nav_notifications_icon.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Notifications");
    			attr_dev(img, "class", "svelte-ecx4h9");
    			add_location(img, file$1, 125, 10, 2543);
    			attr_dev(li0, "class", "svelte-ecx4h9");
    			add_location(li0, file$1, 124, 8, 2527);
    			attr_dev(li1, "class", "svelte-ecx4h9");
    			add_location(li1, file$1, 130, 8, 2719);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li0, anchor);
    			append_dev(li0, img);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, li1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(img, "click", /*click_handler_5*/ ctx[7], false, false, false),
    					listen_dev(li1, "click", /*click_handler_6*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(li1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(124:6) {#if user}",
    		ctx
    	});

    	return block;
    }

    // (136:8) {:else}
    function create_else_block(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "image-profile svelte-ecx4h9");
    			attr_dev(div, "title", "Logout");
    			set_style(div, "background-image", "url('" + /*user*/ ctx[0].avatar + "')");
    			add_location(div, file$1, 136, 10, 2930);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", tryLogout, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*user*/ 1) {
    				set_style(div, "background-image", "url('" + /*user*/ ctx[0].avatar + "')");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(136:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (134:8) {#if !user}
    function create_if_block$1(ctx) {
    	let current;

    	const button = new Button({
    			props: {
    				text: "Login",
    				css: "font-size:14px",
    				callback: tryOauthLogin
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(134:8) {#if !user}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
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
    	let t8;
    	let li4;
    	let current_block_type_index;
    	let if_block1;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*user*/ ctx[0] && create_if_block_1$1(ctx);
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*user*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

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
    			if (if_block0) if_block0.c();
    			t8 = space();
    			li4 = element("li");
    			if_block1.c();
    			if (img0.src !== (img0_src_value = "/images/aniapi_icon.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "AniAPI logo");
    			attr_dev(img0, "class", "brand svelte-ecx4h9");
    			add_location(img0, file$1, 106, 4, 1987);
    			attr_dev(li0, "class", "svelte-ecx4h9");
    			add_location(li0, file$1, 112, 6, 2138);
    			attr_dev(li1, "class", "svelte-ecx4h9");
    			add_location(li1, file$1, 113, 6, 2197);
    			attr_dev(li2, "class", "svelte-ecx4h9");
    			add_location(li2, file$1, 114, 6, 2252);
    			if (img1.src !== (img1_src_value = "/images/nav_github_icon.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Github");
    			attr_dev(img1, "class", "svelte-ecx4h9");
    			add_location(img1, file$1, 116, 8, 2327);
    			attr_dev(li3, "class", "svelte-ecx4h9");
    			add_location(li3, file$1, 115, 6, 2313);
    			attr_dev(ul0, "class", "svelte-ecx4h9");
    			add_location(ul0, file$1, 111, 4, 2126);
    			attr_dev(li4, "class", "svelte-ecx4h9");
    			add_location(li4, file$1, 132, 6, 2795);
    			attr_dev(ul1, "class", "side svelte-ecx4h9");
    			add_location(ul1, file$1, 122, 4, 2482);
    			attr_dev(nav, "class", "svelte-ecx4h9");
    			add_location(nav, file$1, 105, 2, 1976);
    			attr_dev(navbar, "class", "svelte-ecx4h9");
    			add_location(navbar, file$1, 104, 0, 1964);
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
    			if (if_block0) if_block0.m(ul1, null);
    			append_dev(ul1, t8);
    			append_dev(ul1, li4);
    			if_blocks[current_block_type_index].m(li4, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(img0, "click", /*click_handler*/ ctx[2], false, false, false),
    					listen_dev(li0, "click", /*click_handler_1*/ ctx[3], false, false, false),
    					listen_dev(li1, "click", /*click_handler_2*/ ctx[4], false, false, false),
    					listen_dev(li2, "click", /*click_handler_3*/ ctx[5], false, false, false),
    					listen_dev(img1, "click", /*click_handler_4*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*user*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(ul1, t8);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(li4, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(navbar);
    			if (if_block0) if_block0.d();
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			run_all(dispose);
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

    function tryOauthLogin() {
    	window.location.href = "https://anilist.co/api/v2/oauth/authorize?client_id=" + {"env":{"API_URL":"http://localhost:8080/api/v1/","ANILIST_CLIENTID":"3615"}}.env.ANILIST_CLIENTID + "&response_type=token";
    }

    function tryLogout() {
    	localStorage.removeItem("current_user");
    	window.location.reload();
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let user = get_store_value(currentUser);
    	currentUser.subscribe(newUser => $$invalidate(0, user = newUser));

    	function changePage(page) {
    		if (page === "github") {
    			window.open("https://github.com/AniAPI-Team/aniapi-svelte");
    			return;
    		}

    		if (page === "profile") {
    			window.open(user.siteUrl);
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
    	const click_handler_5 = () => changePage("notification");
    	const click_handler_6 = () => changePage("profile");

    	$$self.$capture_state = () => ({
    		Button,
    		get: get_store_value,
    		currentPage,
    		currentUser,
    		user,
    		changePage,
    		tryOauthLogin,
    		tryLogout
    	});

    	$$self.$inject_state = $$props => {
    		if ("user" in $$props) $$invalidate(0, user = $$props.user);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		user,
    		changePage,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6
    	];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\components\VideoPlayer.svelte generated by Svelte v3.23.0 */
    const file$2 = "src\\components\\VideoPlayer.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let i;
    	let t;
    	let video_1;
    	let video_1_src_value;
    	let div_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			i = element("i");
    			t = space();
    			video_1 = element("video");
    			attr_dev(i, "class", "fas fa-times fa-fw svelte-1shkhdd");
    			add_location(i, file$2, 79, 2, 1338);
    			if (video_1.src !== (video_1_src_value = /*src*/ ctx[0])) attr_dev(video_1, "src", video_1_src_value);
    			video_1.controls = true;
    			video_1.autoplay = true;
    			attr_dev(video_1, "disablepictureinpicture", "");
    			attr_dev(video_1, "class", "svelte-1shkhdd");
    			add_location(video_1, file$2, 80, 2, 1391);
    			attr_dev(div, "class", div_class_value = "video-player " + (/*src*/ ctx[0] ? "visible" : "") + " svelte-1shkhdd");
    			add_location(div, file$2, 78, 0, 1285);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, i);
    			append_dev(div, t);
    			append_dev(div, video_1);
    			/*video_1_binding*/ ctx[3](video_1);

    			if (!mounted) {
    				dispose = listen_dev(i, "click", /*close*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*src*/ 1 && video_1.src !== (video_1_src_value = /*src*/ ctx[0])) {
    				attr_dev(video_1, "src", video_1_src_value);
    			}

    			if (dirty & /*src*/ 1 && div_class_value !== (div_class_value = "video-player " + (/*src*/ ctx[0] ? "visible" : "") + " svelte-1shkhdd")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*video_1_binding*/ ctx[3](null);
    			mounted = false;
    			dispose();
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
    	let { src } = $$props;
    	let video;

    	currentVideo.subscribe(newSrc => {
    		if (!newSrc) {
    			$$invalidate(0, src = newSrc);
    			return;
    		}

    		if (newSrc.includes("vvvid")) {
    			window.open(newSrc);
    		} else {
    			$$invalidate(0, src = newSrc);
    		}
    	});

    	function close() {
    		currentVideo.set(undefined);
    		video.pause();
    	}

    	const writable_props = ["src"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<VideoPlayer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("VideoPlayer", $$slots, []);

    	function video_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, video = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    	};

    	$$self.$capture_state = () => ({ currentVideo, src, video, close });

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    		if ("video" in $$props) $$invalidate(1, video = $$props.video);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src, video, close, video_1_binding];
    }

    class VideoPlayer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { src: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VideoPlayer",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*src*/ ctx[0] === undefined && !("src" in props)) {
    			console.warn("<VideoPlayer> was created without expected prop 'src'");
    		}
    	}

    	get src() {
    		throw new Error("<VideoPlayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<VideoPlayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\TextBox.svelte generated by Svelte v3.23.0 */

    const file$3 = "src\\components\\TextBox.svelte";

    // (83:2) {:else}
    function create_else_block$1(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-times fa-fw svelte-15ux751");
    			set_style(i, "visibility", "hidden");
    			add_location(i, file$3, 83, 4, 1399);
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(83:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (81:2) {#if !empty}
    function create_if_block$2(ctx) {
    	let i;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-times fa-fw svelte-15ux751");
    			add_location(i, file$3, 81, 4, 1333);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, i, anchor);

    			if (!mounted) {
    				dispose = listen_dev(i, "click", /*clear*/ ctx[6], false, false, false);
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(81:2) {#if !empty}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let i;
    	let i_class_value;
    	let t0;
    	let input;
    	let t1;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (!/*empty*/ ctx[4]) return create_if_block$2;
    		return create_else_block$1;
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
    			attr_dev(i, "class", i_class_value = "fas fa-" + /*icon*/ ctx[2] + " fa-fw" + " svelte-15ux751");
    			add_location(i, file$3, 78, 2, 1204);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", /*hint*/ ctx[1]);
    			input.value = /*text*/ ctx[0];
    			attr_dev(input, "class", "svelte-15ux751");
    			add_location(input, file$3, 79, 2, 1241);
    			attr_dev(div, "class", "textbox svelte-15ux751");
    			attr_dev(div, "style", /*css*/ ctx[3]);
    			add_location(div, file$3, 77, 0, 1167);
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
    				dispose = listen_dev(input, "keyup", /*keyUp*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*icon*/ 4 && i_class_value !== (i_class_value = "fas fa-" + /*icon*/ ctx[2] + " fa-fw" + " svelte-15ux751")) {
    				attr_dev(i, "class", i_class_value);
    			}

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

    			if (dirty & /*css*/ 8) {
    				attr_dev(div, "style", /*css*/ ctx[3]);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { hint } = $$props;
    	let { callback } = $$props;
    	let { text } = $$props;
    	let { icon = "search" } = $$props;
    	let { css } = $$props;
    	let empty = true;

    	if (!text) {
    		text = "";
    	}

    	function keyUp(e) {
    		let value = e.target.value.trim();
    		$$invalidate(4, empty = value === "");
    		$$invalidate(0, text = value);

    		if (callback) {
    			callback(text);
    		}
    	}

    	function clear() {
    		$$invalidate(0, text = "");
    		$$invalidate(4, empty = true);

    		if (callback) {
    			callback(text);
    		}
    	}

    	const writable_props = ["hint", "callback", "text", "icon", "css"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TextBox> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TextBox", $$slots, []);

    	$$self.$set = $$props => {
    		if ("hint" in $$props) $$invalidate(1, hint = $$props.hint);
    		if ("callback" in $$props) $$invalidate(7, callback = $$props.callback);
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("icon" in $$props) $$invalidate(2, icon = $$props.icon);
    		if ("css" in $$props) $$invalidate(3, css = $$props.css);
    	};

    	$$self.$capture_state = () => ({
    		hint,
    		callback,
    		text,
    		icon,
    		css,
    		empty,
    		keyUp,
    		clear
    	});

    	$$self.$inject_state = $$props => {
    		if ("hint" in $$props) $$invalidate(1, hint = $$props.hint);
    		if ("callback" in $$props) $$invalidate(7, callback = $$props.callback);
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("icon" in $$props) $$invalidate(2, icon = $$props.icon);
    		if ("css" in $$props) $$invalidate(3, css = $$props.css);
    		if ("empty" in $$props) $$invalidate(4, empty = $$props.empty);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, hint, icon, css, empty, keyUp, clear, callback];
    }

    class TextBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			hint: 1,
    			callback: 7,
    			text: 0,
    			icon: 2,
    			css: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TextBox",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*hint*/ ctx[1] === undefined && !("hint" in props)) {
    			console.warn("<TextBox> was created without expected prop 'hint'");
    		}

    		if (/*callback*/ ctx[7] === undefined && !("callback" in props)) {
    			console.warn("<TextBox> was created without expected prop 'callback'");
    		}

    		if (/*text*/ ctx[0] === undefined && !("text" in props)) {
    			console.warn("<TextBox> was created without expected prop 'text'");
    		}

    		if (/*css*/ ctx[3] === undefined && !("css" in props)) {
    			console.warn("<TextBox> was created without expected prop 'css'");
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

    	get icon() {
    		throw new Error("<TextBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<TextBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get css() {
    		throw new Error("<TextBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set css(value) {
    		throw new Error("<TextBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\ComboBox.svelte generated by Svelte v3.23.0 */

    const file$4 = "src\\components\\ComboBox.svelte";

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
    			add_location(i, file$4, 247, 4, 4453);
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
    function create_if_block_2$1(ctx) {
    	let i;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-times fa-fw svelte-1ob5j3g");
    			add_location(i, file$4, 245, 4, 4387);
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
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(245:2) {#if !empty}",
    		ctx
    	});

    	return block;
    }

    // (252:6) {#if item.value.toLowerCase().includes(text.toLowerCase())}
    function create_if_block$3(ctx) {
    	let div;
    	let t0_value = /*item*/ ctx[18].value + "";
    	let t0;
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*item*/ ctx[18].selected) return create_if_block_1$2;
    		return create_else_block$2;
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
    			add_location(div, file$4, 252, 8, 4678);
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(252:6) {#if item.value.toLowerCase().includes(text.toLowerCase())}",
    		ctx
    	});

    	return block;
    }

    // (257:10) {:else}
    function create_else_block$2(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-check-circle fa-fw svelte-1ob5j3g");
    			set_style(i, "visibility", "hidden");
    			add_location(i, file$4, 257, 12, 4877);
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
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(257:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (255:10) {#if item.selected}
    function create_if_block_1$2(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-check-circle fa-fw svelte-1ob5j3g");
    			add_location(i, file$4, 255, 12, 4805);
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
    		id: create_if_block_1$2.name,
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
    	let if_block = show_if && create_if_block$3(ctx);

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
    					if_block = create_if_block$3(ctx);
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

    function create_fragment$4(ctx) {
    	let div1;
    	let input;
    	let t0;
    	let t1;
    	let div0;
    	let div0_class_value;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (!/*empty*/ ctx[4]) return create_if_block_2$1;
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
    			add_location(input, file$4, 238, 2, 4254);
    			attr_dev(div0, "class", div0_class_value = "dropdown " + (/*showDropdown*/ ctx[5] ? "active" : "") + " svelte-1ob5j3g");
    			add_location(div0, file$4, 249, 2, 4521);
    			attr_dev(div1, "class", "combobox svelte-1ob5j3g");
    			add_location(div1, file$4, 237, 0, 4208);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
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
    			id: create_fragment$4.name
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

    const file$5 = "src\\components\\CheckBox.svelte";

    function create_fragment$5(ctx) {
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
    			attr_dev(i, "class", "fas fa-check fa-fw svelte-aoi5n4");
    			add_location(i, file$5, 51, 4, 966);
    			attr_dev(div0, "class", div0_class_value = "circle " + (/*checked*/ ctx[0] ? "checked" : "") + " svelte-aoi5n4");
    			add_location(div0, file$5, 50, 2, 913);
    			add_location(span, file$5, 53, 2, 1012);
    			attr_dev(div1, "class", "checkbox svelte-aoi5n4");
    			add_location(div1, file$5, 49, 0, 869);
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
    			if (dirty & /*checked*/ 1 && div0_class_value !== (div0_class_value = "circle " + (/*checked*/ ctx[0] ? "checked" : "") + " svelte-aoi5n4")) {
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { label: 1, checked: 0, callback: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CheckBox",
    			options,
    			id: create_fragment$5.name
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

    const file$6 = "src\\components\\SearchTag.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (27:0) {#if tags.length > 0}
    function create_if_block$4(ctx) {
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
    			add_location(span, file$6, 28, 4, 451);
    			attr_dev(div, "class", "tags svelte-1oxf602");
    			add_location(div, file$6, 27, 2, 427);
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
    		id: create_if_block$4.name,
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
    			add_location(span, file$6, 30, 6, 516);
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

    function create_fragment$6(ctx) {
    	let if_block_anchor;
    	let if_block = /*tags*/ ctx[1].length > 0 && create_if_block$4(ctx);

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
    					if_block = create_if_block$4(ctx);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { name: 0, tags: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchTag",
    			options,
    			id: create_fragment$6.name
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

    /**
     * The code was extracted from:
     * https://github.com/davidchambers/Base64.js
     */

    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    function InvalidCharacterError(message) {
      this.message = message;
    }

    InvalidCharacterError.prototype = new Error();
    InvalidCharacterError.prototype.name = 'InvalidCharacterError';

    function polyfill (input) {
      var str = String(input).replace(/=+$/, '');
      if (str.length % 4 == 1) {
        throw new InvalidCharacterError("'atob' failed: The string to be decoded is not correctly encoded.");
      }
      for (
        // initialize result and counters
        var bc = 0, bs, buffer, idx = 0, output = '';
        // get next character
        buffer = str.charAt(idx++);
        // character found in table? initialize bit storage and add its ascii value;
        ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
          // and if not first of each 4 characters,
          // convert the first 8 bits to one ascii character
          bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
      ) {
        // try to find character in table (0-63, not found => -1)
        buffer = chars.indexOf(buffer);
      }
      return output;
    }


    var atob = typeof window !== 'undefined' && window.atob && window.atob.bind(window) || polyfill;

    function b64DecodeUnicode(str) {
      return decodeURIComponent(atob(str).replace(/(.)/g, function (m, p) {
        var code = p.charCodeAt(0).toString(16).toUpperCase();
        if (code.length < 2) {
          code = '0' + code;
        }
        return '%' + code;
      }));
    }

    var base64_url_decode = function(str) {
      var output = str.replace(/-/g, "+").replace(/_/g, "/");
      switch (output.length % 4) {
        case 0:
          break;
        case 2:
          output += "==";
          break;
        case 3:
          output += "=";
          break;
        default:
          throw "Illegal base64url string!";
      }

      try{
        return b64DecodeUnicode(output);
      } catch (err) {
        return atob(output);
      }
    };

    function InvalidTokenError(message) {
      this.message = message;
    }

    InvalidTokenError.prototype = new Error();
    InvalidTokenError.prototype.name = 'InvalidTokenError';

    var lib = function (token,options) {
      if (typeof token !== 'string') {
        throw new InvalidTokenError('Invalid token specified');
      }

      options = options || {};
      var pos = options.header === true ? 0 : 1;
      try {
        return JSON.parse(base64_url_decode(token.split('.')[pos]));
      } catch (e) {
        throw new InvalidTokenError('Invalid token specified: ' + e.message);
      }
    };

    var InvalidTokenError_1 = InvalidTokenError;
    lib.InvalidTokenError = InvalidTokenError_1;

    async function getUser(jwt) {
      let token = lib(jwt);

      const res = await anilistQuery(jwt, `
    query {
      User(id: ${parseInt(token.sub)}) {
        id
        name
        avatar {
          medium
        }
        siteUrl
      }
    }
  `);

      let user = res.data.User;
      user.avatar = user.avatar.medium;
      user.token = jwt;
      user.locale = (navigator.language || navigator.userLanguage).substr(0, 2);
      user.lists = await getUserLists(user);

      localStorage.setItem('current_user', JSON.stringify(user));
      window.location.href = "./";
    }

    async function getUserLists(user) {
      const res = await anilistQuery(user.token, `
    query {
      MediaListCollection(userId: ${user.id}, type: ANIME) {
        lists {
          entries {
            id
            mediaId
            progress
          }
          isCustomList
          status
        }
      }
    }
  `);

      user.media = {};

      for (let i = 0; i < res.data.MediaListCollection.lists.length; i++) {
        let list = res.data.MediaListCollection.lists[i];

        if (list.isCustomList) {
          continue;
        }

        for (let j = 0; j < list.entries.length; j++) {
          user.media[list.entries[j].mediaId] = {
            id: list.entries[j].id,
            status: list.status,
            progress: list.entries[j].progress
          };
        }
      }

      currentUser.set(user);
    }

    async function getAnimeInfos(animeId) {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: `
        query {
          Media(id: ${animeId}) {
            description
            bannerImage
            trailer {
              id
            }
            episodes
            airingSchedule {
              nodes {
                episode
              }
            } 
          }
        }
      `
        })
      });

      let data = (await res.json()).data.Media;

      return {
        description: data.description,
        banner: data.bannerImage,
        trailer: data.trailer ? `http://www.youtube.com/embed/${data.trailer.id}` : '',
        episodes: data.episodes ? data.episodes : data.airingSchedule.nodes[data.airingSchedule.nodes.length - 1].episode
      }
    }

    async function updateAnimeStatus(animeId, status) {
      let user = get_store_value(currentUser);
      status = statusToAnilist(status);

      if (!status) {
        let id = user.media[animeId].id;

        if (id) {
          await anilistQuery(user.token, `
        mutation {
          DeleteMediaListEntry(id: ${id}) {
            deleted
          }
        }
      `);
        }
      } else {
        await anilistQuery(user.token, `
      mutation {
        SaveMediaListEntry(mediaId: ${animeId}, status: ${status}) {
          id
          status
        }
      }
    `);
      }

      user.lists = await getUserLists(user);
      currentUser.set(user);
    }

    async function updateAnimeProgress(animeId, progress) {
      let user = get_store_value(currentUser);

      await anilistQuery(user.token, `
    mutation {
      SaveMediaListEntry(mediaId: ${animeId}, progress: ${progress}) {
        id
        progress
      }
    }
  `);

      user.lists = await getUserLists(user);
      currentUser.set(user);
    }

    function statusToAnilist(status) {
      switch (status) {
        case "Watching":
          return "CURRENT";
        case "Paused":
          return "PAUSED";
        case "Completed":
          return "COMPLETED";
        case "Planning":
          return "PLANNING";
        case "Dropped":
          return "DROPPED";
      }

      return undefined;
    }

    function formatStatus(status) {
      switch (status) {
        case "CURRENT":
          return "Watching";
        case "PAUSED":
          return "Paused";
        case "COMPLETED":
          return "Completed";
        case "PLANNING":
          return "Planning";
        case "DROPPED":
          return "Dropped";
      }

      return undefined;
    }

    function statusIntToString(status) {
      switch (status) {
        case 0:
          return "Completed";
        case 1:
          return "Airing";
        case 2:
          return "Coming soon";
      }

      return "Unknown";
    }

    function getSeason(date) {
      switch (date.getMonth()) {
        case 0:
        case 1:
        case 2:
          return "Winter";
        case 3:
        case 4:
        case 5:
          return "Spring";
        case 6:
        case 7:
        case 8:
          return "Summer";
        case 9:
        case 10:
        case 11:
          return "Fall";
      }

      return "Unknown";
    }

    async function anilistQuery(token, query) {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: query
        })
      });

      return await res.json();
    }

    /* src\components\SearchResult.svelte generated by Svelte v3.23.0 */
    const file$7 = "src\\components\\SearchResult.svelte";

    // (210:4) {#if status}
    function create_if_block_2$2(ctx) {
    	let div;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", div_class_value = "status " + /*status*/ ctx[1].toLowerCase() + " svelte-zfhnpa");
    			attr_dev(div, "title", /*status*/ ctx[1]);
    			add_location(div, file$7, 210, 6, 4080);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*status*/ 2 && div_class_value !== (div_class_value = "status " + /*status*/ ctx[1].toLowerCase() + " svelte-zfhnpa")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*status*/ 2) {
    				attr_dev(div, "title", /*status*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(210:4) {#if status}",
    		ctx
    	});

    	return block;
    }

    // (213:4) {#if progress}
    function create_if_block_1$3(ctx) {
    	let div;
    	let i;
    	let t0;
    	let t1;
    	let div_title_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			i = element("i");
    			t0 = space();
    			t1 = text(/*progress*/ ctx[2]);
    			attr_dev(i, "class", "fas fa-clipboard-check fa-fw svelte-zfhnpa");
    			add_location(i, file$7, 214, 8, 4244);
    			attr_dev(div, "class", "progress svelte-zfhnpa");
    			attr_dev(div, "title", div_title_value = "" + (/*progress*/ ctx[2] + " episodes seen"));
    			add_location(div, file$7, 213, 6, 4179);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, i);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*progress*/ 4) set_data_dev(t1, /*progress*/ ctx[2]);

    			if (dirty & /*progress*/ 4 && div_title_value !== (div_title_value = "" + (/*progress*/ ctx[2] + " episodes seen"))) {
    				attr_dev(div, "title", div_title_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(213:4) {#if progress}",
    		ctx
    	});

    	return block;
    }

    // (220:6) {#if data.score !== 0}
    function create_if_block$5(ctx) {
    	let i;
    	let t0;
    	let t1_value = /*data*/ ctx[0].score + "";
    	let t1;

    	const block = {
    		c: function create() {
    			i = element("i");
    			t0 = space();
    			t1 = text(t1_value);
    			attr_dev(i, "class", "fas fa-heart fa-fw svelte-zfhnpa");
    			add_location(i, file$7, 220, 8, 4396);
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
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(220:6) {#if data.score !== 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let div2;
    	let t4_value = /*data*/ ctx[0].title + "";
    	let t4;
    	let div2_title_value;
    	let div4_class_value;
    	let mounted;
    	let dispose;
    	let if_block0 = /*status*/ ctx[1] && create_if_block_2$2(ctx);
    	let if_block1 = /*progress*/ ctx[2] && create_if_block_1$3(ctx);
    	let if_block2 = /*data*/ ctx[0].score !== 0 && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			div1 = element("div");
    			if (if_block2) if_block2.c();
    			t3 = space();
    			div2 = element("div");
    			t4 = text(t4_value);
    			attr_dev(div0, "class", "overlay svelte-zfhnpa");
    			add_location(div0, file$7, 208, 4, 4031);
    			attr_dev(div1, "class", "score svelte-zfhnpa");
    			add_location(div1, file$7, 218, 4, 4337);
    			attr_dev(div2, "class", "title svelte-zfhnpa");
    			attr_dev(div2, "title", div2_title_value = /*data*/ ctx[0].title);
    			add_location(div2, file$7, 224, 4, 4481);
    			attr_dev(div3, "class", "picture svelte-zfhnpa");
    			set_style(div3, "background-image", "url(" + /*data*/ ctx[0].picture + ")");
    			add_location(div3, file$7, 207, 2, 3959);
    			attr_dev(div4, "class", div4_class_value = "card " + (/*status*/ ctx[1] ? /*status*/ ctx[1].toLowerCase() : "") + " svelte-zfhnpa");
    			add_location(div4, file$7, 204, 0, 3859);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			if (if_block0) if_block0.m(div3, null);
    			append_dev(div3, t1);
    			if (if_block1) if_block1.m(div3, null);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			if (if_block2) if_block2.m(div1, null);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, t4);

    			if (!mounted) {
    				dispose = listen_dev(div4, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*status*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2$2(ctx);
    					if_block0.c();
    					if_block0.m(div3, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*progress*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$3(ctx);
    					if_block1.c();
    					if_block1.m(div3, t2);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*data*/ ctx[0].score !== 0) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block$5(ctx);
    					if_block2.c();
    					if_block2.m(div1, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty & /*data*/ 1 && t4_value !== (t4_value = /*data*/ ctx[0].title + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*data*/ 1 && div2_title_value !== (div2_title_value = /*data*/ ctx[0].title)) {
    				attr_dev(div2, "title", div2_title_value);
    			}

    			if (dirty & /*data*/ 1) {
    				set_style(div3, "background-image", "url(" + /*data*/ ctx[0].picture + ")");
    			}

    			if (dirty & /*status*/ 2 && div4_class_value !== (div4_class_value = "card " + (/*status*/ ctx[1] ? /*status*/ ctx[1].toLowerCase() : "") + " svelte-zfhnpa")) {
    				attr_dev(div4, "class", div4_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			dispose();
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
    	let { data } = $$props;
    	let status;
    	let progress;

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
    		get: get_store_value,
    		currentPage,
    		currentAnime,
    		currentUser,
    		formatStatus,
    		data,
    		status,
    		progress,
    		selectAnime
    	});

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    		if ("status" in $$props) $$invalidate(1, status = $$props.status);
    		if ("progress" in $$props) $$invalidate(2, progress = $$props.progress);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data*/ 1) {
    			 {
    				let user = get_store_value(currentUser);

    				if (user) {
    					let media = user.media[data.anilist_id];

    					if (media) {
    						$$invalidate(1, status = formatStatus(media.status));
    						$$invalidate(2, progress = media.progress);
    					} else {
    						$$invalidate(1, status = undefined);
    						$$invalidate(2, progress = undefined);
    					}
    				} else {
    					$$invalidate(1, status = undefined);
    					$$invalidate(2, progress = undefined);
    				}
    			}
    		}
    	};

    	return [data, status, progress, selectAnime, click_handler];
    }

    class SearchResult extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchResult",
    			options,
    			id: create_fragment$7.name
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

    /* src\components\Pagination.svelte generated by Svelte v3.23.0 */

    function create_fragment$8(ctx) {
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { page = 1 } = $$props;
    	let { callback } = $$props;
    	document.addEventListener("keyup", keyUp);

    	function keyUp(e) {
    		if (e.keyCode === 39) {
    			changePage(1);
    		} else if (e.keyCode === 37) {
    			changePage(-1);
    		}
    	}

    	function changePage(n) {
    		$$invalidate(0, page += n);

    		if (page < 1) {
    			$$invalidate(0, page = 1);
    		}

    		if (callback) {
    			callback(page);
    		}
    	}

    	const writable_props = ["page", "callback"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Pagination> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Pagination", $$slots, []);

    	$$self.$set = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    		if ("callback" in $$props) $$invalidate(1, callback = $$props.callback);
    	};

    	$$self.$capture_state = () => ({ page, callback, keyUp, changePage });

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    		if ("callback" in $$props) $$invalidate(1, callback = $$props.callback);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, callback];
    }

    class Pagination extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { page: 0, callback: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pagination",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*callback*/ ctx[1] === undefined && !("callback" in props)) {
    			console.warn("<Pagination> was created without expected prop 'callback'");
    		}
    	}

    	get page() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get callback() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const api = get_store_value(API);

    async function getAnime(id, callback) {
      let url = api.url + api.endpoints.anime + '/' + id;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let data = await res.json();
      callback(data);
    }

    async function getAnimes(title, genres, type, sort, desc, page, callback) {
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

      params.push('page=' + page);

      url += params.join('&');

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let data = await res.json();
      callback(data);
    }

    async function getEpisodes(animeId, number, page, callback) {
      let url = api.url + api.endpoints.episode + '?anime_id=' + animeId + '&number=' + number + '&sort=number&page=' + page;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let data = await res.json();
      callback(data);
    }

    async function getMatchings(animeId, from, callback) {
      let url = api.url + api.endpoints.matching + '?anime_id=' + animeId + '&from=' + from + '&sort=ratio&desc=1';

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let data = await res.json();
      callback(data);
    }

    async function increaseMatchingVote(animeId, from, title, callback) {
      let url = api.url + api.endpoints.matching;

      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          anime_id: animeId,
          from: from,
          title: title
        })
      });

      callback();
    }

    async function addCustomMatching(animeId, from, siteUrl, episodes, callback) {
      let url = api.url + api.endpoints.matching;

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          anime_id: animeId,
          from: from,
          episodes: episodes,
          url: siteUrl
        })
      });

      let data = await res.json();
      callback(data);
    }

    async function getNotifications(anilistIds, callback) {
      let url = api.url + api.endpoints.notification + '?anilist_id=' + anilistIds;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let data = await res.json();
      callback(data);
    }

    async function getScraper(callback) {
      let url = api.url + api.endpoints.scraper;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      let data = await res.json();
      callback(data);
    }

    async function getQueue(callback) {
      let url = api.url + api.endpoints.queue;

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
    const file$8 = "src\\views\\Home.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (165:4) {#if search.title !== ''}
    function create_if_block_2$3(ctx) {
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
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(165:4) {#if search.title !== ''}",
    		ctx
    	});

    	return block;
    }

    // (170:4) {#if search.sort !== ''}
    function create_if_block_1$4(ctx) {
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
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(170:4) {#if search.sort !== ''}",
    		ctx
    	});

    	return block;
    }

    // (175:4) {#if search.results.length === 0}
    function create_if_block$6(ctx) {
    	let div;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = "/images/aniapi_404.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "404 - Not found");
    			add_location(img, file$8, 176, 8, 4144);
    			attr_dev(div, "class", "no-results");
    			add_location(div, file$8, 175, 6, 4110);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(175:4) {#if search.results.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (180:4) {#each search.results as result}
    function create_each_block$2(ctx) {
    	let current;

    	const searchresult = new SearchResult({
    			props: { data: /*result*/ ctx[10] },
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
    			if (dirty & /*search*/ 1) searchresult_changes.data = /*result*/ ctx[10];
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
    		source: "(180:4) {#each search.results as result}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let main;
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let div1;
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let div2;
    	let t10;
    	let div2_class_value;
    	let t11;
    	let current;

    	const textbox = new TextBox({
    			props: {
    				hint: "Search",
    				callback: /*onTitleChange*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const combobox0 = new ComboBox({
    			props: {
    				hint: "Genres",
    				items: get_store_value(animeGenres),
    				callback: /*onGenresChange*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const combobox1 = new ComboBox({
    			props: {
    				hint: "Type",
    				items: get_store_value(animeTypes),
    				selected: "TV",
    				single: true,
    				callback: /*onTypeChange*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const combobox2 = new ComboBox({
    			props: {
    				hint: "Sort",
    				items: get_store_value(animeSorts),
    				selected: "Score",
    				single: true,
    				callback: /*onSortChange*/ ctx[5]
    			},
    			$$inline: true
    		});

    	const checkbox = new CheckBox({
    			props: {
    				label: "Sort descending",
    				checked: true,
    				callback: /*onSortDirectionChange*/ ctx[6]
    			},
    			$$inline: true
    		});

    	const button = new Button({
    			props: {
    				icon: "keyboard",
    				tooltip: "You can use <b>arrow keys</b> or <b>swipe's gestures</b> to\r\n      change page",
    				circle: true,
    				css: "margin-left:auto"
    			},
    			$$inline: true
    		});

    	let if_block0 = /*search*/ ctx[0].title !== "" && create_if_block_2$3(ctx);

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

    	let if_block1 = /*search*/ ctx[0].sort !== "" && create_if_block_1$4(ctx);
    	let if_block2 = /*search*/ ctx[0].results.length === 0 && create_if_block$6(ctx);
    	let each_value = /*search*/ ctx[0].results;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const pagination = new Pagination({
    			props: {
    				page: /*search*/ ctx[0].page,
    				empty: /*emptyPage*/ ctx[1],
    				callback: /*onPageChange*/ ctx[7]
    			},
    			$$inline: true
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
    			create_component(button.$$.fragment);
    			t5 = space();
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t6 = space();
    			create_component(searchtag0.$$.fragment);
    			t7 = space();
    			create_component(searchtag1.$$.fragment);
    			t8 = space();
    			if (if_block1) if_block1.c();
    			t9 = space();
    			div2 = element("div");
    			if (if_block2) if_block2.c();
    			t10 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t11 = space();
    			create_component(pagination.$$.fragment);
    			attr_dev(div0, "class", "search-filters svelte-16pbnno");
    			add_location(div0, file$8, 134, 2, 2868);
    			attr_dev(div1, "class", "search-tags svelte-16pbnno");
    			add_location(div1, file$8, 163, 2, 3652);
    			attr_dev(div2, "class", div2_class_value = "search-results " + (/*search*/ ctx[0].results.length === 0 ? "empty" : "") + " svelte-16pbnno");
    			add_location(div2, file$8, 173, 2, 3990);
    			attr_dev(main, "class", "svelte-16pbnno");
    			add_location(main, file$8, 133, 0, 2858);
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
    			append_dev(div0, t4);
    			mount_component(button, div0, null);
    			append_dev(main, t5);
    			append_dev(main, div1);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t6);
    			mount_component(searchtag0, div1, null);
    			append_dev(div1, t7);
    			mount_component(searchtag1, div1, null);
    			append_dev(div1, t8);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(main, t9);
    			append_dev(main, div2);
    			if (if_block2) if_block2.m(div2, null);
    			append_dev(div2, t10);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_dev(main, t11);
    			mount_component(pagination, main, null);
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
    					if_block0 = create_if_block_2$3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div1, t6);
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
    					if_block1 = create_if_block_1$4(ctx);
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

    			if (/*search*/ ctx[0].results.length === 0) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block$6(ctx);
    					if_block2.c();
    					if_block2.m(div2, t10);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
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

    			if (!current || dirty & /*search*/ 1 && div2_class_value !== (div2_class_value = "search-results " + (/*search*/ ctx[0].results.length === 0 ? "empty" : "") + " svelte-16pbnno")) {
    				attr_dev(div2, "class", div2_class_value);
    			}

    			const pagination_changes = {};
    			if (dirty & /*search*/ 1) pagination_changes.page = /*search*/ ctx[0].page;
    			if (dirty & /*emptyPage*/ 2) pagination_changes.empty = /*emptyPage*/ ctx[1];
    			pagination.$set(pagination_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textbox.$$.fragment, local);
    			transition_in(combobox0.$$.fragment, local);
    			transition_in(combobox1.$$.fragment, local);
    			transition_in(combobox2.$$.fragment, local);
    			transition_in(checkbox.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(searchtag0.$$.fragment, local);
    			transition_in(searchtag1.$$.fragment, local);
    			transition_in(if_block1);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(pagination.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textbox.$$.fragment, local);
    			transition_out(combobox0.$$.fragment, local);
    			transition_out(combobox1.$$.fragment, local);
    			transition_out(combobox2.$$.fragment, local);
    			transition_out(checkbox.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(searchtag0.$$.fragment, local);
    			transition_out(searchtag1.$$.fragment, local);
    			transition_out(if_block1);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(pagination.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(textbox);
    			destroy_component(combobox0);
    			destroy_component(combobox1);
    			destroy_component(combobox2);
    			destroy_component(checkbox);
    			destroy_component(button);
    			if (if_block0) if_block0.d();
    			destroy_component(searchtag0);
    			destroy_component(searchtag1);
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			destroy_each(each_blocks, detaching);
    			destroy_component(pagination);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let search = {
    		title: "",
    		genres: [],
    		type: "TV",
    		sort: "Score",
    		desc: true,
    		page: 1,
    		results: []
    	};

    	let searchTimeout;
    	let emptyPage;

    	function onTitleChange(text) {
    		$$invalidate(0, search.title = text, search);
    		$$invalidate(0, search.page = 1, search);
    		onChange();
    	}

    	function onGenresChange(values) {
    		$$invalidate(0, search.genres = values, search);
    		$$invalidate(0, search.page = 1, search);
    		onChange();
    	}

    	function onTypeChange(value) {
    		$$invalidate(0, search.type = value, search);
    		$$invalidate(0, search.page = 1, search);
    		onChange();
    	}

    	function onSortChange(value) {
    		$$invalidate(0, search.sort = value, search);
    		$$invalidate(0, search.page = 1, search);
    		onChange();
    	}

    	function onSortDirectionChange(value) {
    		$$invalidate(0, search.desc = value, search);
    		$$invalidate(0, search.page = 1, search);
    		onChange();
    	}

    	function onPageChange(value) {
    		$$invalidate(0, search.page = value, search);
    		onChange();
    	}

    	function onChange() {
    		clearTimeout(searchTimeout);

    		searchTimeout = setTimeout(
    			() => getAnimes(search.title, search.genres, search.type, search.sort, search.desc, search.page, results => {
    				if (results.length === 0) {
    					$$invalidate(1, emptyPage = true);

    					if (search.page > 1) {
    						$$invalidate(0, search.page--, search);
    					} else {
    						$$invalidate(0, search.results = [], search);
    					}
    				} else {
    					$$invalidate(0, search.results = results, search);
    					$$invalidate(1, emptyPage = false);
    				}
    			}),
    			500
    		);
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
    		Button,
    		SearchTag,
    		SearchResult,
    		Pagination,
    		get: get_store_value,
    		animeGenres,
    		animeTypes,
    		animeSorts,
    		getAnimes,
    		search,
    		searchTimeout,
    		emptyPage,
    		onTitleChange,
    		onGenresChange,
    		onTypeChange,
    		onSortChange,
    		onSortDirectionChange,
    		onPageChange,
    		onChange
    	});

    	$$self.$inject_state = $$props => {
    		if ("search" in $$props) $$invalidate(0, search = $$props.search);
    		if ("searchTimeout" in $$props) searchTimeout = $$props.searchTimeout;
    		if ("emptyPage" in $$props) $$invalidate(1, emptyPage = $$props.emptyPage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		search,
    		emptyPage,
    		onTitleChange,
    		onGenresChange,
    		onTypeChange,
    		onSortChange,
    		onSortDirectionChange,
    		onPageChange
    	];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\components\SelectBox.svelte generated by Svelte v3.23.0 */

    const file$9 = "src\\components\\SelectBox.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (201:8) {:else}
    function create_else_block$3(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-check-circle fa-fw svelte-ngfb6s");
    			set_style(i, "visibility", "hidden");
    			add_location(i, file$9, 201, 10, 3847);
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
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(201:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (199:8) {#if item.selected}
    function create_if_block$7(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-check-circle fa-fw svelte-ngfb6s");
    			add_location(i, file$9, 199, 10, 3779);
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
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(199:8) {#if item.selected}",
    		ctx
    	});

    	return block;
    }

    // (196:4) {#each items as item}
    function create_each_block$3(ctx) {
    	let div;
    	let t0_value = /*item*/ ctx[11].value + "";
    	let t0;
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[11].selected) return create_if_block$7;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[9](/*item*/ ctx[11], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			if_block.c();
    			t2 = space();
    			attr_dev(div, "class", "item svelte-ngfb6s");
    			add_location(div, file$9, 196, 6, 3658);
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
    			if (dirty & /*items*/ 1 && t0_value !== (t0_value = /*item*/ ctx[11].value + "")) set_data_dev(t0, t0_value);

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
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
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(196:4) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div1;
    	let input;
    	let t0;
    	let i;
    	let t1;
    	let div0;
    	let div0_class_value;
    	let mounted;
    	let dispose;
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			input = element("input");
    			t0 = space();
    			i = element("i");
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input, "type", "text");
    			input.value = /*selected*/ ctx[1];
    			input.readOnly = true;
    			attr_dev(input, "class", "svelte-ngfb6s");
    			add_location(input, file$9, 192, 2, 3444);
    			attr_dev(i, "class", "fas fa-chevron-down fa-fw svelte-ngfb6s");
    			add_location(i, file$9, 193, 2, 3511);
    			attr_dev(div0, "class", div0_class_value = "dropdown " + (/*showDropdown*/ ctx[3] ? "active" : "") + " svelte-ngfb6s");
    			add_location(div0, file$9, 194, 2, 3570);
    			attr_dev(div1, "class", "selectbox svelte-ngfb6s");
    			add_location(div1, file$9, 191, 0, 3397);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, input);
    			append_dev(div1, t0);
    			append_dev(div1, i);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			/*div1_binding*/ ctx[10](div1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "click", /*show*/ ctx[4], false, false, false),
    					listen_dev(i, "click", /*show*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selected*/ 2 && input.value !== /*selected*/ ctx[1]) {
    				prop_dev(input, "value", /*selected*/ ctx[1]);
    			}

    			if (dirty & /*changeItem, items*/ 33) {
    				each_value = /*items*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*showDropdown*/ 8 && div0_class_value !== (div0_class_value = "dropdown " + (/*showDropdown*/ ctx[3] ? "active" : "") + " svelte-ngfb6s")) {
    				attr_dev(div0, "class", div0_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			/*div1_binding*/ ctx[10](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { items } = $$props;
    	let { selected = undefined } = $$props;
    	let { callback } = $$props;
    	let element;
    	let showDropdown = false;

    	if (!items) {
    		items = [];
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
    			$$invalidate(3, showDropdown = false);
    		}
    	});

    	function show() {
    		$$invalidate(3, showDropdown = true);
    	}

    	function changeItem(value) {
    		deselectAll();
    		let item = items.find(x => x.value === value);
    		item.selected = !item.selected;
    		$$invalidate(0, items);
    		$$invalidate(1, selected = item.value);
    		$$invalidate(3, showDropdown = false);
    		callCallback();
    	}

    	function deselectAll() {
    		for (let i = 0; i < items.length; i++) {
    			$$invalidate(0, items[i].selected = false, items);
    		}

    		$$invalidate(0, items);
    	}

    	function callCallback() {
    		if (!callback) {
    			return;
    		}

    		let value;

    		for (let i = 0; i < items.length; i++) {
    			if (items[i].selected) {
    				value = items[i].value;
    			}
    		}

    		callback(value);
    	}

    	const writable_props = ["items", "selected", "callback"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SelectBox> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("SelectBox", $$slots, []);
    	const click_handler = item => changeItem(item.value);

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(2, element = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("selected" in $$props) $$invalidate(1, selected = $$props.selected);
    		if ("callback" in $$props) $$invalidate(6, callback = $$props.callback);
    	};

    	$$self.$capture_state = () => ({
    		items,
    		selected,
    		callback,
    		element,
    		showDropdown,
    		show,
    		changeItem,
    		deselectAll,
    		callCallback
    	});

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("selected" in $$props) $$invalidate(1, selected = $$props.selected);
    		if ("callback" in $$props) $$invalidate(6, callback = $$props.callback);
    		if ("element" in $$props) $$invalidate(2, element = $$props.element);
    		if ("showDropdown" in $$props) $$invalidate(3, showDropdown = $$props.showDropdown);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		items,
    		selected,
    		element,
    		showDropdown,
    		show,
    		changeItem,
    		callback,
    		deselectAll,
    		callCallback,
    		click_handler,
    		div1_binding
    	];
    }

    class SelectBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { items: 0, selected: 1, callback: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelectBox",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*items*/ ctx[0] === undefined && !("items" in props)) {
    			console.warn("<SelectBox> was created without expected prop 'items'");
    		}

    		if (/*callback*/ ctx[6] === undefined && !("callback" in props)) {
    			console.warn("<SelectBox> was created without expected prop 'callback'");
    		}
    	}

    	get items() {
    		throw new Error("<SelectBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<SelectBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<SelectBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<SelectBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get callback() {
    		throw new Error("<SelectBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<SelectBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\NumericBox.svelte generated by Svelte v3.23.0 */

    const file$a = "src\\components\\NumericBox.svelte";

    function create_fragment$b(ctx) {
    	let div;
    	let i0;
    	let t0;
    	let input;
    	let t1;
    	let i1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			i0 = element("i");
    			t0 = space();
    			input = element("input");
    			t1 = space();
    			i1 = element("i");
    			attr_dev(i0, "class", "fas fa-minus fa-fw svelte-1cpww5");
    			add_location(i0, file$a, 64, 2, 1075);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "placeholder", /*hint*/ ctx[1]);
    			attr_dev(input, "class", "svelte-1cpww5");
    			add_location(input, file$a, 65, 2, 1136);
    			attr_dev(i1, "class", "fas fa-plus fa-fw svelte-1cpww5");
    			add_location(i1, file$a, 70, 2, 1247);
    			attr_dev(div, "class", "numericbox svelte-1cpww5");
    			attr_dev(div, "style", /*css*/ ctx[2]);
    			add_location(div, file$a, 63, 0, 1035);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, i0);
    			append_dev(div, t0);
    			append_dev(div, input);
    			set_input_value(input, /*number*/ ctx[0]);
    			append_dev(div, t1);
    			append_dev(div, i1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(i0, "click", /*click_handler*/ ctx[6], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    					listen_dev(input, "change", /*change_handler*/ ctx[8], false, false, false),
    					listen_dev(i1, "click", /*click_handler_1*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*hint*/ 2) {
    				attr_dev(input, "placeholder", /*hint*/ ctx[1]);
    			}

    			if (dirty & /*number*/ 1 && to_number(input.value) !== /*number*/ ctx[0]) {
    				set_input_value(input, /*number*/ ctx[0]);
    			}

    			if (dirty & /*css*/ 4) {
    				attr_dev(div, "style", /*css*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { hint } = $$props;
    	let { callback } = $$props;
    	let { number } = $$props;
    	let { css } = $$props;
    	let { positive = false } = $$props;

    	if (!number) {
    		number = 0;
    	}

    	function add(n) {
    		$$invalidate(0, number += n);

    		if (positive && number < 0) {
    			$$invalidate(0, number = 0);
    		}

    		if (callback) {
    			callback(number);
    		}
    	}

    	const writable_props = ["hint", "callback", "number", "css", "positive"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NumericBox> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("NumericBox", $$slots, []);
    	const click_handler = () => add(-1);

    	function input_input_handler() {
    		number = to_number(this.value);
    		$$invalidate(0, number);
    	}

    	const change_handler = () => add(0);
    	const click_handler_1 = () => add(1);

    	$$self.$set = $$props => {
    		if ("hint" in $$props) $$invalidate(1, hint = $$props.hint);
    		if ("callback" in $$props) $$invalidate(4, callback = $$props.callback);
    		if ("number" in $$props) $$invalidate(0, number = $$props.number);
    		if ("css" in $$props) $$invalidate(2, css = $$props.css);
    		if ("positive" in $$props) $$invalidate(5, positive = $$props.positive);
    	};

    	$$self.$capture_state = () => ({
    		hint,
    		callback,
    		number,
    		css,
    		positive,
    		add
    	});

    	$$self.$inject_state = $$props => {
    		if ("hint" in $$props) $$invalidate(1, hint = $$props.hint);
    		if ("callback" in $$props) $$invalidate(4, callback = $$props.callback);
    		if ("number" in $$props) $$invalidate(0, number = $$props.number);
    		if ("css" in $$props) $$invalidate(2, css = $$props.css);
    		if ("positive" in $$props) $$invalidate(5, positive = $$props.positive);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		number,
    		hint,
    		css,
    		add,
    		callback,
    		positive,
    		click_handler,
    		input_input_handler,
    		change_handler,
    		click_handler_1
    	];
    }

    class NumericBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			hint: 1,
    			callback: 4,
    			number: 0,
    			css: 2,
    			positive: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NumericBox",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*hint*/ ctx[1] === undefined && !("hint" in props)) {
    			console.warn("<NumericBox> was created without expected prop 'hint'");
    		}

    		if (/*callback*/ ctx[4] === undefined && !("callback" in props)) {
    			console.warn("<NumericBox> was created without expected prop 'callback'");
    		}

    		if (/*number*/ ctx[0] === undefined && !("number" in props)) {
    			console.warn("<NumericBox> was created without expected prop 'number'");
    		}

    		if (/*css*/ ctx[2] === undefined && !("css" in props)) {
    			console.warn("<NumericBox> was created without expected prop 'css'");
    		}
    	}

    	get hint() {
    		throw new Error("<NumericBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hint(value) {
    		throw new Error("<NumericBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get callback() {
    		throw new Error("<NumericBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<NumericBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get number() {
    		throw new Error("<NumericBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set number(value) {
    		throw new Error("<NumericBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get css() {
    		throw new Error("<NumericBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set css(value) {
    		throw new Error("<NumericBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get positive() {
    		throw new Error("<NumericBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set positive(value) {
    		throw new Error("<NumericBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Tabs.svelte generated by Svelte v3.23.0 */

    const file$b = "src\\components\\Tabs.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (79:4) {:else}
    function create_else_block$4(ctx) {
    	let div;
    	let t0_value = /*item*/ ctx[7].value + "";
    	let t0;
    	let t1;
    	let div_class_value;
    	let mounted;
    	let dispose;

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[6](/*item*/ ctx[7], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", div_class_value = "tab " + (/*item*/ ctx[7].selected ? "selected" : "") + " svelte-196vlsn");
    			add_location(div, file$b, 79, 6, 1537);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*items*/ 1 && t0_value !== (t0_value = /*item*/ ctx[7].value + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*items*/ 1 && div_class_value !== (div_class_value = "tab " + (/*item*/ ctx[7].selected ? "selected" : "") + " svelte-196vlsn")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(79:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (75:4) {#if counter}
    function create_if_block$8(ctx) {
    	let div;
    	let t0_value = /*i*/ ctx[9] + 1 + "";
    	let t0;
    	let t1;
    	let div_class_value;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[5](/*i*/ ctx[9], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", div_class_value = "tab " + (/*item*/ ctx[7] ? "selected" : "") + " svelte-196vlsn");
    			add_location(div, file$b, 75, 6, 1415);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*items*/ 1 && div_class_value !== (div_class_value = "tab " + (/*item*/ ctx[7] ? "selected" : "") + " svelte-196vlsn")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(75:4) {#if counter}",
    		ctx
    	});

    	return block;
    }

    // (74:2) {#each items as item, i}
    function create_each_block$4(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*counter*/ ctx[2]) return create_if_block$8;
    		return create_else_block$4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
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
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(74:2) {#each items as item, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div;
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "tabs svelte-196vlsn");
    			attr_dev(div, "style", /*css*/ ctx[1]);
    			add_location(div, file$b, 72, 0, 1330);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*items, onClick, counter*/ 13) {
    				each_value = /*items*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*css*/ 2) {
    				attr_dev(div, "style", /*css*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { items } = $$props;
    	let { callback } = $$props;
    	let { css } = $$props;
    	let { counter = false } = $$props;

    	if (!counter) {
    		for (let i = 0; i < items.length; i++) {
    			if (!items[i].value) {
    				items[i] = { value: items[i] };
    				items[i].selected = i === 0;
    			}
    		}
    	}

    	function onClick(value) {
    		for (let i = 0; i < items.length; i++) {
    			if (counter) {
    				$$invalidate(0, items[i] = i === value, items);
    			} else {
    				$$invalidate(0, items[i].selected = items[i].value === value, items);
    			}
    		}

    		$$invalidate(0, items);
    		callback(value + 1);
    	}

    	const writable_props = ["items", "callback", "css", "counter"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tabs> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Tabs", $$slots, []);
    	const click_handler = i => onClick(i);
    	const click_handler_1 = item => onClick(item.value);

    	$$self.$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("callback" in $$props) $$invalidate(4, callback = $$props.callback);
    		if ("css" in $$props) $$invalidate(1, css = $$props.css);
    		if ("counter" in $$props) $$invalidate(2, counter = $$props.counter);
    	};

    	$$self.$capture_state = () => ({ items, callback, css, counter, onClick });

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("callback" in $$props) $$invalidate(4, callback = $$props.callback);
    		if ("css" in $$props) $$invalidate(1, css = $$props.css);
    		if ("counter" in $$props) $$invalidate(2, counter = $$props.counter);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [items, css, counter, onClick, callback, click_handler, click_handler_1];
    }

    class Tabs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
    			items: 0,
    			callback: 4,
    			css: 1,
    			counter: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tabs",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*items*/ ctx[0] === undefined && !("items" in props)) {
    			console.warn("<Tabs> was created without expected prop 'items'");
    		}

    		if (/*callback*/ ctx[4] === undefined && !("callback" in props)) {
    			console.warn("<Tabs> was created without expected prop 'callback'");
    		}

    		if (/*css*/ ctx[1] === undefined && !("css" in props)) {
    			console.warn("<Tabs> was created without expected prop 'css'");
    		}
    	}

    	get items() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get callback() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get css() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set css(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get counter() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set counter(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Matchings.svelte generated by Svelte v3.23.0 */
    const file$c = "src\\components\\Matchings.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (182:2) {:else}
    function create_else_block$5(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*foundMatchings*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

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
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*foundMatchings, vote, inspect*/ 3) {
    				each_value = /*foundMatchings*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
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

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(182:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (180:2) {#if !foundMatchings || foundMatchings.length === 0}
    function create_if_block$9(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "No matchings to vote found";
    			add_location(div, file$c, 180, 4, 3997);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(180:2) {#if !foundMatchings || foundMatchings.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (190:10) {:else}
    function create_else_block_1$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "fas fa-vote-yea fa-fw");
    			set_style(span, "display", "none");
    			add_location(span, file$c, 190, 12, 4333);
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
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(190:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (186:10) {#if m.voted}
    function create_if_block_2$4(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "fas fa-vote-yea fa-fw");
    			attr_dev(span, "title", "You already voted this matching");
    			add_location(span, file$c, 186, 12, 4192);
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
    		id: create_if_block_2$4.name,
    		type: "if",
    		source: "(186:10) {#if m.voted}",
    		ctx
    	});

    	return block;
    }

    // (203:10) {#if !m.voted}
    function create_if_block_1$5(ctx) {
    	let current;

    	function func_1(...args) {
    		return /*func_1*/ ctx[6](/*m*/ ctx[7], ...args);
    	}

    	const button = new Button({
    			props: {
    				icon: "vote-yea",
    				tooltip: "Vote as OK",
    				tooltipDirection: "center",
    				circle: true,
    				css: "margin-left:4px",
    				callback: func_1
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const button_changes = {};
    			if (dirty & /*foundMatchings*/ 1) button_changes.callback = func_1;
    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(203:10) {#if !m.voted}",
    		ctx
    	});

    	return block;
    }

    // (183:4) {#each foundMatchings as m}
    function create_each_block$5(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let span0;
    	let t1_value = /*m*/ ctx[7].from + "";
    	let t1;
    	let t2;
    	let span1;
    	let t3_value = /*m*/ ctx[7].ratio.toFixed(2) + "";
    	let t3;
    	let t4;
    	let span1_class_value;
    	let t5;
    	let span2;
    	let t6_value = /*m*/ ctx[7].votes + "";
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let t10;
    	let span3;
    	let t11_value = /*m*/ ctx[7].title + "";
    	let t11;
    	let t12;
    	let div1_class_value;
    	let current;

    	function select_block_type_1(ctx, dirty) {
    		if (/*m*/ ctx[7].voted) return create_if_block_2$4;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block0 = current_block_type(ctx);

    	function func(...args) {
    		return /*func*/ ctx[5](/*m*/ ctx[7], ...args);
    	}

    	const button = new Button({
    			props: {
    				icon: "user-secret",
    				tooltip: "Inspect",
    				tooltipDirection: "center",
    				circle: true,
    				css: "margin-left:auto",
    				callback: func
    			},
    			$$inline: true
    		});

    	let if_block1 = !/*m*/ ctx[7].voted && create_if_block_1$5(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if_block0.c();
    			t0 = space();
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = text("%");
    			t5 = space();
    			span2 = element("span");
    			t6 = text(t6_value);
    			t7 = text(" votes");
    			t8 = space();
    			create_component(button.$$.fragment);
    			t9 = space();
    			if (if_block1) if_block1.c();
    			t10 = space();
    			span3 = element("span");
    			t11 = text(t11_value);
    			t12 = space();
    			attr_dev(span0, "class", "from svelte-1mlage2");
    			add_location(span0, file$c, 192, 10, 4421);
    			attr_dev(span1, "class", span1_class_value = "ratio " + /*m*/ ctx[7].ratioClass + " svelte-1mlage2");
    			add_location(span1, file$c, 193, 10, 4467);
    			attr_dev(span2, "class", "votes svelte-1mlage2");
    			add_location(span2, file$c, 194, 10, 4542);
    			attr_dev(div0, "class", "region svelte-1mlage2");
    			add_location(div0, file$c, 184, 8, 4133);
    			attr_dev(span3, "class", "title svelte-1mlage2");
    			add_location(span3, file$c, 212, 8, 5137);
    			attr_dev(div1, "class", div1_class_value = "matching " + /*m*/ ctx[7].ratioClass + " svelte-1mlage2");
    			add_location(div1, file$c, 183, 6, 4086);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if_block0.m(div0, null);
    			append_dev(div0, t0);
    			append_dev(div0, span0);
    			append_dev(span0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, span1);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			append_dev(div0, t5);
    			append_dev(div0, span2);
    			append_dev(span2, t6);
    			append_dev(span2, t7);
    			append_dev(div0, t8);
    			mount_component(button, div0, null);
    			append_dev(div0, t9);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div1, t10);
    			append_dev(div1, span3);
    			append_dev(span3, t11);
    			append_dev(div1, t12);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, t0);
    				}
    			}

    			if ((!current || dirty & /*foundMatchings*/ 1) && t1_value !== (t1_value = /*m*/ ctx[7].from + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*foundMatchings*/ 1) && t3_value !== (t3_value = /*m*/ ctx[7].ratio.toFixed(2) + "")) set_data_dev(t3, t3_value);

    			if (!current || dirty & /*foundMatchings*/ 1 && span1_class_value !== (span1_class_value = "ratio " + /*m*/ ctx[7].ratioClass + " svelte-1mlage2")) {
    				attr_dev(span1, "class", span1_class_value);
    			}

    			if ((!current || dirty & /*foundMatchings*/ 1) && t6_value !== (t6_value = /*m*/ ctx[7].votes + "")) set_data_dev(t6, t6_value);
    			const button_changes = {};
    			if (dirty & /*foundMatchings*/ 1) button_changes.callback = func;
    			button.$set(button_changes);

    			if (!/*m*/ ctx[7].voted) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*foundMatchings*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$5(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty & /*foundMatchings*/ 1) && t11_value !== (t11_value = /*m*/ ctx[7].title + "")) set_data_dev(t11, t11_value);

    			if (!current || dirty & /*foundMatchings*/ 1 && div1_class_value !== (div1_class_value = "matching " + /*m*/ ctx[7].ratioClass + " svelte-1mlage2")) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_block0.d();
    			destroy_component(button);
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(183:4) {#each foundMatchings as m}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$9, create_else_block$5];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*foundMatchings*/ ctx[0] || /*foundMatchings*/ ctx[0].length === 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "matchings svelte-1mlage2");
    			add_location(div, file$c, 178, 0, 3912);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function inspect(url) {
    	window.open(url);
    }

    function compare(a, b) {
    	let aR = a.ratio / 10 + a.votes;
    	let bR = b.ratio / 10 + b.votes;
    	return bR - aR;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { animeId } = $$props;
    	let { from } = $$props;
    	let { reload } = $$props;
    	let foundMatchings = [];

    	function vote(title, from) {
    		increaseMatchingVote(animeId, from, title, () => {
    			let votes = JSON.parse(localStorage.getItem("user_votes"));

    			if (!votes) {
    				votes = {};
    			}

    			if (!votes[animeId]) {
    				votes[animeId] = [];
    			}

    			votes[animeId].push(title + "_" + from);
    			localStorage.setItem("user_votes", JSON.stringify(votes));
    			let m = foundMatchings.find(x => x.anime_id === animeId && x.title === title && x.from === from);
    			m.voted = true;
    			m.votes++;
    			foundMatchings.sort(compare);
    			((($$invalidate(0, foundMatchings), $$invalidate(2, reload)), $$invalidate(3, animeId)), $$invalidate(4, from));
    		});
    	}

    	const writable_props = ["animeId", "from", "reload"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Matchings> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Matchings", $$slots, []);
    	const func = m => inspect(m.url);
    	const func_1 = m => vote(m.title, m.from);

    	$$self.$set = $$props => {
    		if ("animeId" in $$props) $$invalidate(3, animeId = $$props.animeId);
    		if ("from" in $$props) $$invalidate(4, from = $$props.from);
    		if ("reload" in $$props) $$invalidate(2, reload = $$props.reload);
    	};

    	$$self.$capture_state = () => ({
    		Button,
    		getMatchings,
    		increaseMatchingVote,
    		animeId,
    		from,
    		reload,
    		foundMatchings,
    		inspect,
    		vote,
    		compare
    	});

    	$$self.$inject_state = $$props => {
    		if ("animeId" in $$props) $$invalidate(3, animeId = $$props.animeId);
    		if ("from" in $$props) $$invalidate(4, from = $$props.from);
    		if ("reload" in $$props) $$invalidate(2, reload = $$props.reload);
    		if ("foundMatchings" in $$props) $$invalidate(0, foundMatchings = $$props.foundMatchings);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*reload, animeId, from, foundMatchings*/ 29) {
    			 {
    				if (reload) {
    					$$invalidate(2, reload = false);
    					let votes = JSON.parse(localStorage.getItem("user_votes"));

    					getMatchings(animeId, from, results => {
    						$$invalidate(0, foundMatchings = results);

    						if (foundMatchings === null) {
    							return;
    						}

    						for (let i = 0; i < foundMatchings.length; i++) {
    							$$invalidate(0, foundMatchings[i].ratio = parseFloat(foundMatchings[i].ratio) * 100, foundMatchings);
    							$$invalidate(0, foundMatchings[i].ratio += foundMatchings[i].votes / 100, foundMatchings);

    							if (foundMatchings[i].ratio > 100) {
    								$$invalidate(0, foundMatchings[i].ratio = 100, foundMatchings);
    							}

    							if (foundMatchings[i].ratio > 60) {
    								$$invalidate(0, foundMatchings[i].ratioClass = "green", foundMatchings);
    							} else if (foundMatchings[i].ratio > 40) {
    								$$invalidate(0, foundMatchings[i].ratioClass = "yellow", foundMatchings);
    							} else {
    								$$invalidate(0, foundMatchings[i].ratioClass = "red", foundMatchings);
    							}

    							if (votes && votes[foundMatchings[i].anime_id]) {
    								$$invalidate(0, foundMatchings[i].voted = votes[foundMatchings[i].anime_id].includes(foundMatchings[i].title + "_" + foundMatchings[i].from), foundMatchings);
    							}
    						}

    						foundMatchings.sort(compare);
    						((($$invalidate(0, foundMatchings), $$invalidate(2, reload)), $$invalidate(3, animeId)), $$invalidate(4, from));
    					});
    				}
    			}
    		}
    	};

    	return [foundMatchings, vote, reload, animeId, from, func, func_1];
    }

    class Matchings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, { animeId: 3, from: 4, reload: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Matchings",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*animeId*/ ctx[3] === undefined && !("animeId" in props)) {
    			console.warn("<Matchings> was created without expected prop 'animeId'");
    		}

    		if (/*from*/ ctx[4] === undefined && !("from" in props)) {
    			console.warn("<Matchings> was created without expected prop 'from'");
    		}

    		if (/*reload*/ ctx[2] === undefined && !("reload" in props)) {
    			console.warn("<Matchings> was created without expected prop 'reload'");
    		}
    	}

    	get animeId() {
    		throw new Error("<Matchings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animeId(value) {
    		throw new Error("<Matchings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get from() {
    		throw new Error("<Matchings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set from(value) {
    		throw new Error("<Matchings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reload() {
    		throw new Error("<Matchings>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set reload(value) {
    		throw new Error("<Matchings>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Episodes.svelte generated by Svelte v3.23.0 */
    const file$d = "src\\components\\Episodes.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (119:2) {#if foundEpisodes.length === 0}
    function create_if_block$a(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "No episodes found";
    			add_location(div, file$d, 119, 4, 2055);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(119:2) {#if foundEpisodes.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (122:2) {#each foundEpisodes as episode}
    function create_each_block$6(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let i;
    	let t1;
    	let div1;
    	let span0;
    	let span0_class_value;
    	let t2;
    	let span1;
    	let t3_value = /*episode*/ ctx[6].from + "";
    	let t3;
    	let t4;
    	let span2;

    	let t5_value = (/*episode*/ ctx[6].title === ""
    	? "No title provided"
    	: /*episode*/ ctx[6].title) + "";

    	let t5;
    	let t6;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[5](/*episode*/ ctx[6], ...args);
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text("Watch\r\n        ");
    			i = element("i");
    			t1 = space();
    			div1 = element("div");
    			span0 = element("span");
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = space();
    			span2 = element("span");
    			t5 = text(t5_value);
    			t6 = space();
    			attr_dev(i, "class", "fas fa-play fa-fw svelte-b7gebg");
    			add_location(i, file$d, 125, 8, 2248);
    			attr_dev(div0, "class", "overlay svelte-b7gebg");
    			add_location(div0, file$d, 123, 6, 2202);
    			attr_dev(span0, "class", span0_class_value = "flag-icon flag-icon-" + /*episode*/ ctx[6].region + " svelte-b7gebg");
    			add_location(span0, file$d, 128, 8, 2331);
    			attr_dev(span1, "class", "from svelte-b7gebg");
    			add_location(span1, file$d, 129, 8, 2394);
    			attr_dev(div1, "class", "region svelte-b7gebg");
    			add_location(div1, file$d, 127, 6, 2301);
    			attr_dev(span2, "class", "title svelte-b7gebg");
    			add_location(span2, file$d, 131, 6, 2456);
    			attr_dev(div2, "class", "episode svelte-b7gebg");
    			add_location(div2, file$d, 122, 4, 2134);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div0, i);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, span0);
    			append_dev(div1, t2);
    			append_dev(div1, span1);
    			append_dev(span1, t3);
    			append_dev(div2, t4);
    			append_dev(div2, span2);
    			append_dev(span2, t5);
    			append_dev(div2, t6);

    			if (!mounted) {
    				dispose = listen_dev(div2, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*foundEpisodes*/ 1 && span0_class_value !== (span0_class_value = "flag-icon flag-icon-" + /*episode*/ ctx[6].region + " svelte-b7gebg")) {
    				attr_dev(span0, "class", span0_class_value);
    			}

    			if (dirty & /*foundEpisodes*/ 1 && t3_value !== (t3_value = /*episode*/ ctx[6].from + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*foundEpisodes*/ 1 && t5_value !== (t5_value = (/*episode*/ ctx[6].title === ""
    			? "No title provided"
    			: /*episode*/ ctx[6].title) + "")) set_data_dev(t5, t5_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(122:2) {#each foundEpisodes as episode}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let div;
    	let t;
    	let if_block = /*foundEpisodes*/ ctx[0].length === 0 && create_if_block$a(ctx);
    	let each_value = /*foundEpisodes*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "episodes svelte-b7gebg");
    			add_location(div, file$d, 117, 0, 1991);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*foundEpisodes*/ ctx[0].length === 0) {
    				if (if_block) ; else {
    					if_block = create_if_block$a(ctx);
    					if_block.c();
    					if_block.m(div, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*watch, foundEpisodes*/ 3) {
    				each_value = /*foundEpisodes*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
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
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { animeId } = $$props;
    	let { number } = $$props;
    	let page = 1;
    	let foundEpisodes = [];

    	function watch(value) {
    		currentVideo.set(value);
    	}

    	const writable_props = ["animeId", "number"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Episodes> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Episodes", $$slots, []);
    	const click_handler = episode => watch(episode.source);

    	$$self.$set = $$props => {
    		if ("animeId" in $$props) $$invalidate(2, animeId = $$props.animeId);
    		if ("number" in $$props) $$invalidate(3, number = $$props.number);
    	};

    	$$self.$capture_state = () => ({
    		currentVideo,
    		getEpisodes,
    		animeId,
    		number,
    		page,
    		foundEpisodes,
    		watch
    	});

    	$$self.$inject_state = $$props => {
    		if ("animeId" in $$props) $$invalidate(2, animeId = $$props.animeId);
    		if ("number" in $$props) $$invalidate(3, number = $$props.number);
    		if ("page" in $$props) $$invalidate(4, page = $$props.page);
    		if ("foundEpisodes" in $$props) $$invalidate(0, foundEpisodes = $$props.foundEpisodes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*number, animeId*/ 12) {
    			 {
    				if (number) {
    					getEpisodes(animeId, number, page, results => {
    						$$invalidate(0, foundEpisodes = results);
    					});
    				}
    			}
    		}
    	};

    	return [foundEpisodes, watch, animeId, number, page, click_handler];
    }

    class Episodes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { animeId: 2, number: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Episodes",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*animeId*/ ctx[2] === undefined && !("animeId" in props)) {
    			console.warn("<Episodes> was created without expected prop 'animeId'");
    		}

    		if (/*number*/ ctx[3] === undefined && !("number" in props)) {
    			console.warn("<Episodes> was created without expected prop 'number'");
    		}
    	}

    	get animeId() {
    		throw new Error("<Episodes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animeId(value) {
    		throw new Error("<Episodes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get number() {
    		throw new Error("<Episodes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set number(value) {
    		throw new Error("<Episodes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\AddMatching.svelte generated by Svelte v3.23.0 */
    const file$e = "src\\components\\AddMatching.svelte";

    function create_fragment$f(ctx) {
    	let div2;
    	let div1;
    	let t0;
    	let br0;
    	let t1;
    	let div0;
    	let t2;
    	let t3;
    	let br1;
    	let t4;
    	let t5;
    	let br2;
    	let t6;
    	let div2_class_value;
    	let current;

    	const selectbox = new SelectBox({
    			props: {
    				items: get_store_value(animeEpisodesFrom),
    				selected: /*from*/ ctx[2],
    				callback: /*onAnimeFromChange*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const textbox = new TextBox({
    			props: {
    				hint: /*urlHint*/ ctx[3],
    				icon: "link",
    				callback: /*onURLChange*/ ctx[5],
    				css: "flex:1"
    			},
    			$$inline: true
    		});

    	const button0 = new Button({
    			props: {
    				tooltip: "It's important you follow the URL template or the matching\r\n        won't work!",
    				icon: "info",
    				circle: true,
    				css: "margin-left:8px"
    			},
    			$$inline: true
    		});

    	const numericbox = new NumericBox({
    			props: {
    				hint: "Episodes number",
    				number: 1,
    				positive: true,
    				callback: /*onEpisodesNumberChange*/ ctx[6]
    			},
    			$$inline: true
    		});

    	const button1 = new Button({
    			props: {
    				text: "Add matching",
    				callback: /*onAdd*/ ctx[7]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			create_component(selectbox.$$.fragment);
    			t0 = space();
    			br0 = element("br");
    			t1 = space();
    			div0 = element("div");
    			create_component(textbox.$$.fragment);
    			t2 = space();
    			create_component(button0.$$.fragment);
    			t3 = space();
    			br1 = element("br");
    			t4 = space();
    			create_component(numericbox.$$.fragment);
    			t5 = space();
    			br2 = element("br");
    			t6 = space();
    			create_component(button1.$$.fragment);
    			add_location(br0, file$e, 152, 4, 3092);
    			attr_dev(div0, "class", "url svelte-17pok8d");
    			add_location(div0, file$e, 153, 4, 3104);
    			add_location(br1, file$e, 162, 4, 3413);
    			add_location(br2, file$e, 168, 4, 3557);
    			attr_dev(div1, "class", "body svelte-17pok8d");
    			add_location(div1, file$e, 147, 2, 2932);
    			attr_dev(div2, "class", div2_class_value = "addmatching " + (/*active*/ ctx[0] ? "active" : "") + " svelte-17pok8d");
    			add_location(div2, file$e, 146, 0, 2878);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			mount_component(selectbox, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, br0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			mount_component(textbox, div0, null);
    			append_dev(div0, t2);
    			mount_component(button0, div0, null);
    			append_dev(div1, t3);
    			append_dev(div1, br1);
    			append_dev(div1, t4);
    			mount_component(numericbox, div1, null);
    			append_dev(div1, t5);
    			append_dev(div1, br2);
    			append_dev(div1, t6);
    			mount_component(button1, div1, null);
    			/*div1_binding*/ ctx[13](div1);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const selectbox_changes = {};
    			if (dirty & /*from*/ 4) selectbox_changes.selected = /*from*/ ctx[2];
    			selectbox.$set(selectbox_changes);
    			const textbox_changes = {};
    			if (dirty & /*urlHint*/ 8) textbox_changes.hint = /*urlHint*/ ctx[3];
    			textbox.$set(textbox_changes);

    			if (!current || dirty & /*active*/ 1 && div2_class_value !== (div2_class_value = "addmatching " + (/*active*/ ctx[0] ? "active" : "") + " svelte-17pok8d")) {
    				attr_dev(div2, "class", div2_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(selectbox.$$.fragment, local);
    			transition_in(textbox.$$.fragment, local);
    			transition_in(button0.$$.fragment, local);
    			transition_in(numericbox.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(selectbox.$$.fragment, local);
    			transition_out(textbox.$$.fragment, local);
    			transition_out(button0.$$.fragment, local);
    			transition_out(numericbox.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(selectbox);
    			destroy_component(textbox);
    			destroy_component(button0);
    			destroy_component(numericbox);
    			destroy_component(button1);
    			/*div1_binding*/ ctx[13](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { active = false } = $$props;
    	let { callback } = $$props;
    	let element;
    	let from = get_store_value(animeEpisodesFrom)[0].value;
    	let url = "";
    	let urlHint;
    	let episodesNumber = 1;
    	updateURLHint();

    	function onDocumentClick(e) {
    		let outside = true;

    		for (let i = 0; i < e.path.length; i++) {
    			if (e.path[i] === element) {
    				outside = false;
    			}
    		}

    		if (outside) {
    			$$invalidate(0, active = false);
    			document.body.removeEventListener("click", onDocumentClick);
    		}
    	}

    	function onAnimeFromChange(value) {
    		$$invalidate(2, from = value);
    		updateURLHint();
    	}

    	function updateURLHint() {
    		$$invalidate(3, urlHint = get_store_value(animeEpisodesFromTemplate)[from]);
    	}

    	function onURLChange(value) {
    		url = value;
    	}

    	function onEpisodesNumberChange(value) {
    		episodesNumber = value;
    	}

    	function onAdd() {
    		if (url === "" || from === "" || episodesNumber === 0) {
    			alert("Please, fill all fields with valid data!");
    			return;
    		}

    		addCustomMatching(get_store_value(currentAnime).id, from, url, episodesNumber, result => {
    			$$invalidate(0, active = false);
    			callback();
    		});
    	}

    	const writable_props = ["active", "callback"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AddMatching> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("AddMatching", $$slots, []);

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(1, element = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("callback" in $$props) $$invalidate(8, callback = $$props.callback);
    	};

    	$$self.$capture_state = () => ({
    		SelectBox,
    		NumericBox,
    		TextBox,
    		Button,
    		get: get_store_value,
    		currentAnime,
    		animeEpisodesFrom,
    		animeEpisodesFromTemplate,
    		addCustomMatching,
    		active,
    		callback,
    		element,
    		from,
    		url,
    		urlHint,
    		episodesNumber,
    		onDocumentClick,
    		onAnimeFromChange,
    		updateURLHint,
    		onURLChange,
    		onEpisodesNumberChange,
    		onAdd
    	});

    	$$self.$inject_state = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("callback" in $$props) $$invalidate(8, callback = $$props.callback);
    		if ("element" in $$props) $$invalidate(1, element = $$props.element);
    		if ("from" in $$props) $$invalidate(2, from = $$props.from);
    		if ("url" in $$props) url = $$props.url;
    		if ("urlHint" in $$props) $$invalidate(3, urlHint = $$props.urlHint);
    		if ("episodesNumber" in $$props) episodesNumber = $$props.episodesNumber;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*active*/ 1) {
    			 {
    				if (active) {
    					setTimeout(
    						function () {
    							document.body.addEventListener("click", onDocumentClick);
    						},
    						500
    					);
    				}
    			}
    		}
    	};

    	return [
    		active,
    		element,
    		from,
    		urlHint,
    		onAnimeFromChange,
    		onURLChange,
    		onEpisodesNumberChange,
    		onAdd,
    		callback,
    		url,
    		episodesNumber,
    		onDocumentClick,
    		updateURLHint,
    		div1_binding
    	];
    }

    class AddMatching extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { active: 0, callback: 8 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddMatching",
    			options,
    			id: create_fragment$f.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*callback*/ ctx[8] === undefined && !("callback" in props)) {
    			console.warn("<AddMatching> was created without expected prop 'callback'");
    		}
    	}

    	get active() {
    		throw new Error("<AddMatching>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<AddMatching>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get callback() {
    		throw new Error("<AddMatching>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<AddMatching>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\views\Detail.svelte generated by Svelte v3.23.0 */

    const file$f = "src\\views\\Detail.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	return child_ctx;
    }

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    // (267:8) {#if anime.anilist_id}
    function create_if_block_4(ctx) {
    	let a;
    	let img;
    	let img_src_value;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			img = element("img");
    			if (img.src !== (img_src_value = "/images/anilist_logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "AniList Logo");
    			attr_dev(img, "class", "svelte-181dhsm");
    			add_location(img, file$f, 268, 12, 5914);
    			attr_dev(a, "href", a_href_value = "https://anilist.co/anime/" + /*anime*/ ctx[0].anilist_id);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$f, 267, 10, 5830);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, img);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*anime*/ 1 && a_href_value !== (a_href_value = "https://anilist.co/anime/" + /*anime*/ ctx[0].anilist_id)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(267:8) {#if anime.anilist_id}",
    		ctx
    	});

    	return block;
    }

    // (277:6) {#if anime.trailer}
    function create_if_block_3(ctx) {
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			iframe = element("iframe");
    			if (iframe.src !== (iframe_src_value = /*anime*/ ctx[0].trailer)) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "title", "Trailer");
    			attr_dev(iframe, "class", "trailer svelte-181dhsm");
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = true;
    			add_location(iframe, file$f, 277, 8, 6109);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, iframe, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*anime*/ 1 && iframe.src !== (iframe_src_value = /*anime*/ ctx[0].trailer)) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(iframe);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(277:6) {#if anime.trailer}",
    		ctx
    	});

    	return block;
    }

    // (286:8) {#if user}
    function create_if_block_1$6(ctx) {
    	let t;
    	let if_block_anchor;
    	let current;

    	const selectbox = new SelectBox({
    			props: {
    				items: get_store_value(animeStatuses),
    				selected: /*status*/ ctx[3],
    				callback: /*onStatusChange*/ ctx[10]
    			},
    			$$inline: true
    		});

    	let if_block = /*status*/ ctx[3] !== "None" && create_if_block_2$5(ctx);

    	const block = {
    		c: function create() {
    			create_component(selectbox.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(selectbox, target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const selectbox_changes = {};
    			if (dirty & /*status*/ 8) selectbox_changes.selected = /*status*/ ctx[3];
    			selectbox.$set(selectbox_changes);

    			if (/*status*/ ctx[3] !== "None") {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*status*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2$5(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(selectbox.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(selectbox.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(selectbox, detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(286:8) {#if user}",
    		ctx
    	});

    	return block;
    }

    // (291:10) {#if status !== 'None'}
    function create_if_block_2$5(ctx) {
    	let current;

    	const numericbox = new NumericBox({
    			props: {
    				hint: "Progress",
    				css: "margin-top:8px",
    				positive: true,
    				number: /*progress*/ ctx[4],
    				callback: /*onProgressChange*/ ctx[11]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(numericbox.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(numericbox, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const numericbox_changes = {};
    			if (dirty & /*progress*/ 16) numericbox_changes.number = /*progress*/ ctx[4];
    			numericbox.$set(numericbox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(numericbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(numericbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(numericbox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$5.name,
    		type: "if",
    		source: "(291:10) {#if status !== 'None'}",
    		ctx
    	});

    	return block;
    }

    // (303:12) {#each info.items as item}
    function create_each_block_1(ctx) {
    	let span;
    	let t_value = /*item*/ ctx[20] + "";
    	let t;
    	let span_title_value;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "chip svelte-181dhsm");
    			attr_dev(span, "title", span_title_value = /*item*/ ctx[20]);
    			add_location(span, file$f, 303, 14, 6899);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(303:12) {#each info.items as item}",
    		ctx
    	});

    	return block;
    }

    // (300:8) {#each sideInfos as info}
    function create_each_block$7(ctx) {
    	let div1;
    	let div0;
    	let t0_value = /*info*/ ctx[17].title + "";
    	let t0;
    	let t1;
    	let t2;
    	let each_value_1 = /*info*/ ctx[17].items;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr_dev(div0, "class", "subTitle svelte-181dhsm");
    			add_location(div0, file$f, 301, 12, 6803);
    			attr_dev(div1, "class", "info svelte-181dhsm");
    			add_location(div1, file$f, 300, 10, 6771);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*sideInfos*/ 512) {
    				each_value_1 = /*info*/ ctx[17].items;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(300:8) {#each sideInfos as info}",
    		ctx
    	});

    	return block;
    }

    // (311:6) {#if anime.description}
    function create_if_block$b(ctx) {
    	let div;
    	let raw_value = /*anime*/ ctx[0].description + "";

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "desc svelte-181dhsm");
    			add_location(div, file$f, 311, 8, 7091);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			div.innerHTML = raw_value;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*anime*/ 1 && raw_value !== (raw_value = /*anime*/ ctx[0].description + "")) div.innerHTML = raw_value;		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(311:6) {#if anime.description}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let div12;
    	let div6;
    	let div0;
    	let t0;
    	let div1;
    	let i;
    	let t1;
    	let t2_value = /*anime*/ ctx[0].score + "";
    	let t2;
    	let t3;
    	let div5;
    	let div2;
    	let t4;
    	let div3;
    	let t5_value = /*anime*/ ctx[0].title + "";
    	let t5;
    	let t6;
    	let div4;
    	let a;
    	let img;
    	let img_src_value;
    	let a_href_value;
    	let t7;
    	let t8;
    	let main;
    	let div8;
    	let t9;
    	let div7;
    	let t10;
    	let t11;
    	let div11;
    	let t12;
    	let div10;
    	let div9;
    	let t13;
    	let t14;
    	let t15;
    	let t16;
    	let t17;
    	let current;
    	let if_block0 = /*anime*/ ctx[0].anilist_id && create_if_block_4(ctx);
    	let if_block1 = /*anime*/ ctx[0].trailer && create_if_block_3(ctx);
    	let if_block2 = /*user*/ ctx[8] && create_if_block_1$6(ctx);
    	let each_value = /*sideInfos*/ ctx[9];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	let if_block3 = /*anime*/ ctx[0].description && create_if_block$b(ctx);

    	const button = new Button({
    			props: {
    				icon: "plus",
    				tooltip: "Add a matching",
    				circle: true,
    				tooltipDirection: "right",
    				css: "margin-right:8px",
    				callback: /*onAddMatching*/ ctx[14]
    			},
    			$$inline: true
    		});

    	const tabs0 = new Tabs({
    			props: {
    				items: get_store_value(animeEpisodesFrom),
    				callback: /*onMatchingTabChange*/ ctx[13],
    				css: "flex:1"
    			},
    			$$inline: true
    		});

    	const matchings = new Matchings({
    			props: {
    				animeId: /*anime*/ ctx[0].id,
    				from: /*selectedFrom*/ ctx[5],
    				reload: /*reloadMatching*/ ctx[6]
    			},
    			$$inline: true
    		});

    	const tabs1 = new Tabs({
    			props: {
    				items: /*episodes*/ ctx[1],
    				callback: /*onEpisodeTabChange*/ ctx[12],
    				counter: true
    			},
    			$$inline: true
    		});

    	const episodes_1 = new Episodes({
    			props: {
    				number: /*episodeNumber*/ ctx[2],
    				animeId: /*anime*/ ctx[0].id
    			},
    			$$inline: true
    		});

    	const addmatching = new AddMatching({
    			props: {
    				active: /*newMatching*/ ctx[7],
    				callback: /*onMatchingAdded*/ ctx[15]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div12 = element("div");
    			div6 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			i = element("i");
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			div5 = element("div");
    			div2 = element("div");
    			t4 = space();
    			div3 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			div4 = element("div");
    			a = element("a");
    			img = element("img");
    			t7 = space();
    			if (if_block0) if_block0.c();
    			t8 = space();
    			main = element("main");
    			div8 = element("div");
    			if (if_block1) if_block1.c();
    			t9 = space();
    			div7 = element("div");
    			if (if_block2) if_block2.c();
    			t10 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t11 = space();
    			div11 = element("div");
    			if (if_block3) if_block3.c();
    			t12 = space();
    			div10 = element("div");
    			div9 = element("div");
    			create_component(button.$$.fragment);
    			t13 = space();
    			create_component(tabs0.$$.fragment);
    			t14 = space();
    			create_component(matchings.$$.fragment);
    			t15 = space();
    			create_component(tabs1.$$.fragment);
    			t16 = space();
    			create_component(episodes_1.$$.fragment);
    			t17 = space();
    			create_component(addmatching.$$.fragment);
    			attr_dev(div0, "class", "overlay svelte-181dhsm");
    			add_location(div0, file$f, 254, 4, 5327);
    			attr_dev(i, "class", "fas fa-heart fa-fw svelte-181dhsm");
    			add_location(i, file$f, 256, 6, 5383);
    			attr_dev(div1, "class", "score svelte-181dhsm");
    			add_location(div1, file$f, 255, 4, 5356);
    			attr_dev(div2, "class", "picture svelte-181dhsm");
    			set_style(div2, "background-image", "url(" + /*anime*/ ctx[0].picture + ")");
    			add_location(div2, file$f, 260, 6, 5480);
    			attr_dev(div3, "class", "title svelte-181dhsm");
    			add_location(div3, file$f, 261, 6, 5557);
    			if (img.src !== (img_src_value = "/images/mal_logo.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "MyAnimeList Logo");
    			attr_dev(img, "class", "svelte-181dhsm");
    			add_location(img, file$f, 264, 10, 5715);
    			attr_dev(a, "href", a_href_value = "https://myanimelist.net/anime/" + /*anime*/ ctx[0].mal_id);
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$f, 263, 8, 5632);
    			attr_dev(div4, "class", "links svelte-181dhsm");
    			add_location(div4, file$f, 262, 6, 5603);
    			attr_dev(div5, "class", "head svelte-181dhsm");
    			add_location(div5, file$f, 259, 4, 5454);
    			attr_dev(div6, "class", "banner svelte-181dhsm");
    			set_style(div6, "background-image", "url(" + (/*anime*/ ctx[0].banner ? /*anime*/ ctx[0].banner : "") + ")");
    			add_location(div6, file$f, 251, 2, 5226);
    			attr_dev(div7, "class", "content svelte-181dhsm");
    			add_location(div7, file$f, 284, 6, 6279);
    			attr_dev(div8, "class", "side svelte-181dhsm");
    			add_location(div8, file$f, 275, 4, 6054);
    			set_style(div9, "display", "flex");
    			set_style(div9, "align-items", "center");
    			add_location(div9, file$f, 316, 8, 7215);
    			attr_dev(div10, "class", "episodes svelte-181dhsm");
    			add_location(div10, file$f, 315, 6, 7183);
    			attr_dev(div11, "class", "main svelte-181dhsm");
    			add_location(div11, file$f, 309, 4, 7032);
    			attr_dev(main, "class", "svelte-181dhsm");
    			add_location(main, file$f, 274, 2, 6042);
    			attr_dev(div12, "class", "detail");
    			add_location(div12, file$f, 250, 0, 5202);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div12, anchor);
    			append_dev(div12, div6);
    			append_dev(div6, div0);
    			append_dev(div6, t0);
    			append_dev(div6, div1);
    			append_dev(div1, i);
    			append_dev(div1, t1);
    			append_dev(div1, t2);
    			append_dev(div6, t3);
    			append_dev(div6, div5);
    			append_dev(div5, div2);
    			append_dev(div5, t4);
    			append_dev(div5, div3);
    			append_dev(div3, t5);
    			append_dev(div5, t6);
    			append_dev(div5, div4);
    			append_dev(div4, a);
    			append_dev(a, img);
    			append_dev(div4, t7);
    			if (if_block0) if_block0.m(div4, null);
    			append_dev(div12, t8);
    			append_dev(div12, main);
    			append_dev(main, div8);
    			if (if_block1) if_block1.m(div8, null);
    			append_dev(div8, t9);
    			append_dev(div8, div7);
    			if (if_block2) if_block2.m(div7, null);
    			append_dev(div7, t10);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div7, null);
    			}

    			append_dev(main, t11);
    			append_dev(main, div11);
    			if (if_block3) if_block3.m(div11, null);
    			append_dev(div11, t12);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			mount_component(button, div9, null);
    			append_dev(div9, t13);
    			mount_component(tabs0, div9, null);
    			append_dev(div10, t14);
    			mount_component(matchings, div10, null);
    			append_dev(div10, t15);
    			mount_component(tabs1, div10, null);
    			append_dev(div10, t16);
    			mount_component(episodes_1, div10, null);
    			insert_dev(target, t17, anchor);
    			mount_component(addmatching, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*anime*/ 1) && t2_value !== (t2_value = /*anime*/ ctx[0].score + "")) set_data_dev(t2, t2_value);

    			if (!current || dirty & /*anime*/ 1) {
    				set_style(div2, "background-image", "url(" + /*anime*/ ctx[0].picture + ")");
    			}

    			if ((!current || dirty & /*anime*/ 1) && t5_value !== (t5_value = /*anime*/ ctx[0].title + "")) set_data_dev(t5, t5_value);

    			if (!current || dirty & /*anime*/ 1 && a_href_value !== (a_href_value = "https://myanimelist.net/anime/" + /*anime*/ ctx[0].mal_id)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (/*anime*/ ctx[0].anilist_id) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(div4, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!current || dirty & /*anime*/ 1) {
    				set_style(div6, "background-image", "url(" + (/*anime*/ ctx[0].banner ? /*anime*/ ctx[0].banner : "") + ")");
    			}

    			if (/*anime*/ ctx[0].trailer) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					if_block1.m(div8, t9);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*user*/ ctx[8]) if_block2.p(ctx, dirty);

    			if (dirty & /*sideInfos*/ 512) {
    				each_value = /*sideInfos*/ ctx[9];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div7, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*anime*/ ctx[0].description) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block$b(ctx);
    					if_block3.c();
    					if_block3.m(div11, t12);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			const matchings_changes = {};
    			if (dirty & /*anime*/ 1) matchings_changes.animeId = /*anime*/ ctx[0].id;
    			if (dirty & /*selectedFrom*/ 32) matchings_changes.from = /*selectedFrom*/ ctx[5];
    			if (dirty & /*reloadMatching*/ 64) matchings_changes.reload = /*reloadMatching*/ ctx[6];
    			matchings.$set(matchings_changes);
    			const tabs1_changes = {};
    			if (dirty & /*episodes*/ 2) tabs1_changes.items = /*episodes*/ ctx[1];
    			tabs1.$set(tabs1_changes);
    			const episodes_1_changes = {};
    			if (dirty & /*episodeNumber*/ 4) episodes_1_changes.number = /*episodeNumber*/ ctx[2];
    			if (dirty & /*anime*/ 1) episodes_1_changes.animeId = /*anime*/ ctx[0].id;
    			episodes_1.$set(episodes_1_changes);
    			const addmatching_changes = {};
    			if (dirty & /*newMatching*/ 128) addmatching_changes.active = /*newMatching*/ ctx[7];
    			addmatching.$set(addmatching_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block2);
    			transition_in(button.$$.fragment, local);
    			transition_in(tabs0.$$.fragment, local);
    			transition_in(matchings.$$.fragment, local);
    			transition_in(tabs1.$$.fragment, local);
    			transition_in(episodes_1.$$.fragment, local);
    			transition_in(addmatching.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block2);
    			transition_out(button.$$.fragment, local);
    			transition_out(tabs0.$$.fragment, local);
    			transition_out(matchings.$$.fragment, local);
    			transition_out(tabs1.$$.fragment, local);
    			transition_out(episodes_1.$$.fragment, local);
    			transition_out(addmatching.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div12);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			destroy_each(each_blocks, detaching);
    			if (if_block3) if_block3.d();
    			destroy_component(button);
    			destroy_component(tabs0);
    			destroy_component(matchings);
    			destroy_component(tabs1);
    			destroy_component(episodes_1);
    			if (detaching) detach_dev(t17);
    			destroy_component(addmatching, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	const anime = get_store_value(currentAnime);
    	let user = get_store_value(currentUser);
    	let loaded = false;
    	let episodes = [];
    	let episodeNumber;
    	let status;
    	let progress;

    	let sideInfos = [
    		{
    			title: "Status",
    			items: [anime.type, statusIntToString(anime.status)]
    		},
    		{
    			title: "Released",
    			items: [
    				getSeason(new Date(anime.airing_from)),
    				new Date(anime.airing_from).getFullYear()
    			]
    		},
    		{ title: "Genres", items: anime.genres },
    		{
    			title: "Titles",
    			items: anime.other_titles
    		}
    	];

    	let selectedFrom = "dreamsub";
    	let reloadMatching = true;
    	let newMatching = false;

    	function onStatusChange(value) {
    		$$invalidate(3, status = value);
    		updateAnimeStatus(anime.anilist_id, value);
    	}

    	function onProgressChange(value) {
    		updateAnimeProgress(anime.anilist_id, value);
    	}

    	function onEpisodeTabChange(value) {
    		$$invalidate(2, episodeNumber = value);
    	}

    	function onMatchingTabChange(value) {
    		$$invalidate(5, selectedFrom = value);
    	}

    	function onAddMatching() {
    		if (newMatching) {
    			$$invalidate(7, newMatching = false);
    		}

    		$$invalidate(7, newMatching = true);
    	}

    	function onMatchingAdded() {
    		$$invalidate(6, reloadMatching = false);
    		$$invalidate(6, reloadMatching = true);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Detail> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Detail", $$slots, []);

    	$$self.$capture_state = () => ({
    		Button,
    		SelectBox,
    		NumericBox,
    		Tabs,
    		Matchings,
    		Episodes,
    		AddMatching,
    		get: get_store_value,
    		currentAnime,
    		currentUser,
    		animeStatuses,
    		animeEpisodesFrom,
    		getAnimeInfos,
    		formatStatus,
    		statusIntToString,
    		getSeason,
    		updateAnimeStatus,
    		updateAnimeProgress,
    		anime,
    		user,
    		loaded,
    		episodes,
    		episodeNumber,
    		status,
    		progress,
    		sideInfos,
    		selectedFrom,
    		reloadMatching,
    		newMatching,
    		onStatusChange,
    		onProgressChange,
    		onEpisodeTabChange,
    		onMatchingTabChange,
    		onAddMatching,
    		onMatchingAdded
    	});

    	$$self.$inject_state = $$props => {
    		if ("user" in $$props) $$invalidate(8, user = $$props.user);
    		if ("loaded" in $$props) $$invalidate(16, loaded = $$props.loaded);
    		if ("episodes" in $$props) $$invalidate(1, episodes = $$props.episodes);
    		if ("episodeNumber" in $$props) $$invalidate(2, episodeNumber = $$props.episodeNumber);
    		if ("status" in $$props) $$invalidate(3, status = $$props.status);
    		if ("progress" in $$props) $$invalidate(4, progress = $$props.progress);
    		if ("sideInfos" in $$props) $$invalidate(9, sideInfos = $$props.sideInfos);
    		if ("selectedFrom" in $$props) $$invalidate(5, selectedFrom = $$props.selectedFrom);
    		if ("reloadMatching" in $$props) $$invalidate(6, reloadMatching = $$props.reloadMatching);
    		if ("newMatching" in $$props) $$invalidate(7, newMatching = $$props.newMatching);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*loaded, anime*/ 65537) {
    			 {
    				if (!loaded) {
    					getAnimeInfos(anime.anilist_id).then(data => {
    						$$invalidate(0, anime.description = data.description, anime);
    						$$invalidate(0, anime.banner = data.banner, anime);
    						$$invalidate(0, anime.trailer = data.trailer, anime);
    						$$invalidate(1, episodes = new Array(data.episodes));
    						$$invalidate(1, episodes[0] = true, episodes);
    						onEpisodeTabChange(1);
    						$$invalidate(16, loaded = true);
    					});
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*anime*/ 1) {
    			 {
    				if (user) {
    					let media = user.media[anime.anilist_id];

    					if (media) {
    						$$invalidate(3, status = formatStatus(media.status));
    						$$invalidate(4, progress = media.progress);
    					} else {
    						$$invalidate(3, status = "None");
    						$$invalidate(4, progress = undefined);
    					}
    				} else {
    					$$invalidate(3, status = "None");
    					$$invalidate(4, progress = undefined);
    				}
    			}
    		}
    	};

    	return [
    		anime,
    		episodes,
    		episodeNumber,
    		status,
    		progress,
    		selectedFrom,
    		reloadMatching,
    		newMatching,
    		user,
    		sideInfos,
    		onStatusChange,
    		onProgressChange,
    		onEpisodeTabChange,
    		onMatchingTabChange,
    		onAddMatching,
    		onMatchingAdded
    	];
    }

    class Detail extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Detail",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\views\Notification.svelte generated by Svelte v3.23.0 */
    const file$g = "src\\views\\Notification.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (107:2) {#each notifications as n}
    function create_each_block$8(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let span0;
    	let t1_value = /*n*/ ctx[5].anime.title + "";
    	let t1;
    	let t2;
    	let span1;
    	let raw_value = /*n*/ ctx[5].message + "";
    	let t3;
    	let span2;
    	let t4_value = calcTimeFromDate(/*n*/ ctx[5].on) + "";
    	let t4;
    	let t5;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[4](/*n*/ ctx[5], ...args);
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			span1 = element("span");
    			t3 = space();
    			span2 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			attr_dev(div0, "class", "picture svelte-cy0gmz");

    			set_style(div0, "background-image", "url('" + (/*n*/ ctx[5].anime.picture
    			? /*n*/ ctx[5].anime.picture
    			: "") + "')");

    			add_location(div0, file$g, 108, 6, 2107);
    			attr_dev(span0, "class", "anime svelte-cy0gmz");
    			add_location(span0, file$g, 112, 8, 2257);
    			attr_dev(span1, "class", "message svelte-cy0gmz");
    			add_location(span1, file$g, 115, 8, 2367);
    			attr_dev(div1, "class", "info svelte-cy0gmz");
    			add_location(div1, file$g, 111, 6, 2229);
    			attr_dev(span2, "class", "time svelte-cy0gmz");
    			add_location(span2, file$g, 119, 6, 2457);
    			attr_dev(div2, "class", "notification svelte-cy0gmz");
    			add_location(div2, file$g, 107, 4, 2073);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, span0);
    			append_dev(span0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, span1);
    			span1.innerHTML = raw_value;
    			append_dev(div2, t3);
    			append_dev(div2, span2);
    			append_dev(span2, t4);
    			append_dev(div2, t5);

    			if (!mounted) {
    				dispose = listen_dev(span0, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*notifications*/ 1) {
    				set_style(div0, "background-image", "url('" + (/*n*/ ctx[5].anime.picture
    				? /*n*/ ctx[5].anime.picture
    				: "") + "')");
    			}

    			if (dirty & /*notifications*/ 1 && t1_value !== (t1_value = /*n*/ ctx[5].anime.title + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*notifications*/ 1 && raw_value !== (raw_value = /*n*/ ctx[5].message + "")) span1.innerHTML = raw_value;			if (dirty & /*notifications*/ 1 && t4_value !== (t4_value = calcTimeFromDate(/*n*/ ctx[5].on) + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$8.name,
    		type: "each",
    		source: "(107:2) {#each notifications as n}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let main;
    	let each_value = /*notifications*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(main, "class", "svelte-cy0gmz");
    			add_location(main, file$g, 105, 0, 2031);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*calcTimeFromDate, notifications, openAnime*/ 3) {
    				each_value = /*notifications*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$8(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$8(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(main, null);
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
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function calcTimeFromDate(date) {
    	let d = new Date(date);
    	let now = new Date();
    	let diff = now - d;
    	diff /= 1000 * 60 * 60 * 24;
    	let days = Math.round(diff);

    	if (days === 0) {
    		return "Today";
    	}

    	return days + (days > 1 ? " days" : " day") + " ago";
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let notifications = [];
    	let user = get_store_value(currentUser);
    	let anilistIDs = [];

    	for (let anilistID in user.media) {
    		anilistIDs.push(anilistID);
    	}

    	getNotifications(anilistIDs.join(","), result => $$invalidate(0, notifications = result));

    	function openAnime(anime) {
    		currentAnime.set(anime);
    		currentPage.set("detail");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Notification> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Notification", $$slots, []);
    	const click_handler = n => openAnime(n.anime);

    	$$self.$capture_state = () => ({
    		get: get_store_value,
    		currentPage,
    		currentUser,
    		currentAnime,
    		getNotifications,
    		notifications,
    		user,
    		anilistIDs,
    		openAnime,
    		calcTimeFromDate
    	});

    	$$self.$inject_state = $$props => {
    		if ("notifications" in $$props) $$invalidate(0, notifications = $$props.notifications);
    		if ("user" in $$props) user = $$props.user;
    		if ("anilistIDs" in $$props) anilistIDs = $$props.anilistIDs;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [notifications, openAnime, user, anilistIDs, click_handler];
    }

    class Notification extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notification",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src\components\QueueItem.svelte generated by Svelte v3.23.0 */

    const file$h = "src\\components\\QueueItem.svelte";

    function create_fragment$i(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let span0;
    	let t1_value = /*data*/ ctx[0].anime.title + "";
    	let t1;
    	let t2;
    	let span1;
    	let t3;
    	let t4_value = getTimePassedFromDate(/*data*/ ctx[0].insertion_date) + "";
    	let t4;
    	let t5;
    	let span2;
    	let span2_class_value;
    	let div2_title_value;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			span1 = element("span");
    			t3 = text("Queued ");
    			t4 = text(t4_value);
    			t5 = space();
    			span2 = element("span");
    			attr_dev(div0, "class", "picture svelte-3f4g18");

    			set_style(div0, "background-image", "url('" + (/*data*/ ctx[0].anime.picture
    			? /*data*/ ctx[0].anime.picture
    			: "") + "')");

    			add_location(div0, file$h, 85, 2, 1725);
    			attr_dev(span0, "class", "title svelte-3f4g18");
    			add_location(span0, file$h, 89, 4, 1865);
    			attr_dev(span1, "class", "time svelte-3f4g18");
    			add_location(span1, file$h, 90, 4, 1916);
    			attr_dev(span2, "class", span2_class_value = "running " + (!/*data*/ ctx[0].running ? "not" : "") + " svelte-3f4g18");
    			add_location(span2, file$h, 93, 4, 2013);
    			attr_dev(div1, "class", "info svelte-3f4g18");
    			add_location(div1, file$h, 88, 2, 1841);
    			attr_dev(div2, "class", "queue-item svelte-3f4g18");
    			attr_dev(div2, "title", div2_title_value = "" + ((/*data*/ ctx[0].running ? "Currently" : "Not") + " running"));
    			add_location(div2, file$h, 84, 0, 1644);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, span0);
    			append_dev(span0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, span1);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			append_dev(div1, t5);
    			append_dev(div1, span2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data*/ 1) {
    				set_style(div0, "background-image", "url('" + (/*data*/ ctx[0].anime.picture
    				? /*data*/ ctx[0].anime.picture
    				: "") + "')");
    			}

    			if (dirty & /*data*/ 1 && t1_value !== (t1_value = /*data*/ ctx[0].anime.title + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*data*/ 1 && t4_value !== (t4_value = getTimePassedFromDate(/*data*/ ctx[0].insertion_date) + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*data*/ 1 && span2_class_value !== (span2_class_value = "running " + (!/*data*/ ctx[0].running ? "not" : "") + " svelte-3f4g18")) {
    				attr_dev(span2, "class", span2_class_value);
    			}

    			if (dirty & /*data*/ 1 && div2_title_value !== (div2_title_value = "" + ((/*data*/ ctx[0].running ? "Currently" : "Not") + " running"))) {
    				attr_dev(div2, "title", div2_title_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getTimePassedFromDate(date) {
    	let d = new Date(date);
    	let n = new Date();
    	let s = (n - d) / 1000;
    	let m = s / 60;

    	if (m >= 60) {
    		let h = parseInt(m / 60);
    		return h + " " + (h <= 1 ? "hour" : "hours") + " ago";
    	}

    	m = parseInt(m);

    	if (m === 0) {
    		return "a moment ago";
    	}

    	return m + " " + (m <= 1 ? "minute" : "minutes") + " ago";
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { data } = $$props;
    	const writable_props = ["data"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<QueueItem> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("QueueItem", $$slots, []);

    	$$self.$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({ data, getTimePassedFromDate });

    	$$self.$inject_state = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [data];
    }

    class QueueItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QueueItem",
    			options,
    			id: create_fragment$i.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*data*/ ctx[0] === undefined && !("data" in props)) {
    			console.warn("<QueueItem> was created without expected prop 'data'");
    		}
    	}

    	get data() {
    		throw new Error("<QueueItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<QueueItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\views\Status.svelte generated by Svelte v3.23.0 */
    const file$i = "src\\views\\Status.svelte";

    function get_each_context$9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (184:4) {#if animeScraping}
    function create_if_block$c(ctx) {
    	let div5;
    	let div3;
    	let div0;
    	let t0;
    	let div2;
    	let span0;
    	let t1_value = /*animeScraping*/ ctx[0].title + "";
    	let t1;
    	let t2;
    	let span1;
    	let t3_value = /*animeScraping*/ ctx[0].type + "";
    	let t3;
    	let t4;
    	let div1;
    	let t5;
    	let div4;
    	let span2;
    	let t7;
    	let t8_value = getTimePassedFromDate$1(/*animeScraping*/ ctx[0].start_time) + "";
    	let t8;
    	let div5_class_value;
    	let each_value_1 = /*animeScraping*/ ctx[0].genres;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			div4 = element("div");
    			span2 = element("span");
    			span2.textContent = "Run started";
    			t7 = space();
    			t8 = text(t8_value);
    			attr_dev(div0, "class", "picture svelte-ba2101");

    			set_style(div0, "background-image", "url('" + (/*animeScraping*/ ctx[0].picture
    			? /*animeScraping*/ ctx[0].picture
    			: "") + "')");

    			add_location(div0, file$i, 186, 10, 3351);
    			attr_dev(span0, "class", "title svelte-ba2101");
    			add_location(span0, file$i, 190, 12, 3529);
    			attr_dev(span1, "class", "type");
    			add_location(span1, file$i, 191, 12, 3591);
    			attr_dev(div1, "class", "genres svelte-ba2101");
    			add_location(div1, file$i, 192, 12, 3651);
    			attr_dev(div2, "class", "info svelte-ba2101");
    			add_location(div2, file$i, 189, 10, 3497);
    			attr_dev(div3, "class", "anime svelte-ba2101");
    			add_location(div3, file$i, 185, 8, 3320);
    			attr_dev(span2, "class", "svelte-ba2101");
    			add_location(span2, file$i, 200, 10, 3884);
    			attr_dev(div4, "class", "run svelte-ba2101");
    			add_location(div4, file$i, 199, 8, 3855);
    			attr_dev(div5, "class", div5_class_value = "scraper " + (/*idling*/ ctx[1] ? "idling" : "") + " svelte-ba2101");
    			add_location(div5, file$i, 184, 6, 3264);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, span0);
    			append_dev(span0, t1);
    			append_dev(div2, t2);
    			append_dev(div2, span1);
    			append_dev(span1, t3);
    			append_dev(div2, t4);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div4, span2);
    			append_dev(div4, t7);
    			append_dev(div4, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*animeScraping*/ 1) {
    				set_style(div0, "background-image", "url('" + (/*animeScraping*/ ctx[0].picture
    				? /*animeScraping*/ ctx[0].picture
    				: "") + "')");
    			}

    			if (dirty & /*animeScraping*/ 1 && t1_value !== (t1_value = /*animeScraping*/ ctx[0].title + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*animeScraping*/ 1 && t3_value !== (t3_value = /*animeScraping*/ ctx[0].type + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*animeScraping*/ 1) {
    				each_value_1 = /*animeScraping*/ ctx[0].genres;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty & /*animeScraping*/ 1 && t8_value !== (t8_value = getTimePassedFromDate$1(/*animeScraping*/ ctx[0].start_time) + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*idling*/ 2 && div5_class_value !== (div5_class_value = "scraper " + (/*idling*/ ctx[1] ? "idling" : "") + " svelte-ba2101")) {
    				attr_dev(div5, "class", div5_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$c.name,
    		type: "if",
    		source: "(184:4) {#if animeScraping}",
    		ctx
    	});

    	return block;
    }

    // (194:14) {#each animeScraping.genres as g}
    function create_each_block_1$1(ctx) {
    	let span;
    	let t_value = /*g*/ ctx[8] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "genre svelte-ba2101");
    			add_location(span, file$i, 194, 16, 3738);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*animeScraping*/ 1 && t_value !== (t_value = /*g*/ ctx[8] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(194:14) {#each animeScraping.genres as g}",
    		ctx
    	});

    	return block;
    }

    // (210:6) {#each queueItems as q}
    function create_each_block$9(ctx) {
    	let current;

    	const queueitem = new QueueItem({
    			props: { data: /*q*/ ctx[5] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(queueitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(queueitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const queueitem_changes = {};
    			if (dirty & /*queueItems*/ 4) queueitem_changes.data = /*q*/ ctx[5];
    			queueitem.$set(queueitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(queueitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(queueitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(queueitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$9.name,
    		type: "each",
    		source: "(210:6) {#each queueItems as q}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let main;
    	let div1;
    	let div0;
    	let t1;
    	let t2;
    	let div4;
    	let div2;
    	let t4;
    	let div3;
    	let current;
    	let if_block = /*animeScraping*/ ctx[0] && create_if_block$c(ctx);
    	let each_value = /*queueItems*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			main = element("main");
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Scraper Engine";
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			div4 = element("div");
    			div2 = element("div");
    			div2.textContent = "Queue Engine";
    			t4 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "section-title svelte-ba2101");
    			add_location(div0, file$i, 182, 4, 3184);
    			attr_dev(div1, "class", "section svelte-ba2101");
    			add_location(div1, file$i, 181, 2, 3157);
    			attr_dev(div2, "class", "section-title svelte-ba2101");
    			add_location(div2, file$i, 207, 4, 4051);
    			attr_dev(div3, "class", "queue svelte-ba2101");
    			add_location(div3, file$i, 208, 4, 4102);
    			attr_dev(div4, "class", "section svelte-ba2101");
    			add_location(div4, file$i, 206, 2, 4024);
    			attr_dev(main, "class", "svelte-ba2101");
    			add_location(main, file$i, 180, 0, 3147);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(main, t2);
    			append_dev(main, div4);
    			append_dev(div4, div2);
    			append_dev(div4, t4);
    			append_dev(div4, div3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*animeScraping*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$c(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*queueItems*/ 4) {
    				each_value = /*queueItems*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$9(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$9(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div3, null);
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

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getTimePassedFromDate$1(date) {
    	let d = new Date(date);
    	let n = new Date();
    	let s = (n - d) / 1000;
    	let m = s / 60;

    	if (m >= 60) {
    		let h = parseInt(m / 60);
    		return h + " " + (h <= 1 ? "hour" : "hours") + " ago";
    	}

    	m = parseInt(m);

    	if (m === 0) {
    		return "a moment ago";
    	}

    	return m + " " + (m <= 1 ? "minute" : "minutes") + " ago";
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let animeScraping;
    	let idling;
    	let queueItems = [];
    	getAnimeScraping();
    	setInterval(getAnimeScraping, 5000);
    	getQueueItems();
    	setInterval(getQueueItems, 30 * 1000);

    	function getAnimeScraping() {
    		getScraper(s => {
    			$$invalidate(1, idling = false);

    			if (s.anime_id === 0) {
    				return;
    			}

    			getAnime(s.anime_id, a => {
    				if (!a.genres) {
    					a.genres = [];
    				}

    				$$invalidate(0, animeScraping = a);
    				$$invalidate(0, animeScraping.start_time = s.start_time, animeScraping);
    				$$invalidate(1, idling = true);
    			});
    		});
    	}

    	function getQueueItems() {
    		getQueue(res => {
    			$$invalidate(2, queueItems = res);
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Status> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Status", $$slots, []);

    	$$self.$capture_state = () => ({
    		QueueItem,
    		getScraper,
    		getAnime,
    		getQueue,
    		animeScraping,
    		idling,
    		queueItems,
    		getAnimeScraping,
    		getQueueItems,
    		getTimePassedFromDate: getTimePassedFromDate$1
    	});

    	$$self.$inject_state = $$props => {
    		if ("animeScraping" in $$props) $$invalidate(0, animeScraping = $$props.animeScraping);
    		if ("idling" in $$props) $$invalidate(1, idling = $$props.idling);
    		if ("queueItems" in $$props) $$invalidate(2, queueItems = $$props.queueItems);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [animeScraping, idling, queueItems];
    }

    class Status extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Status",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.23.0 */
    const file$j = "src\\App.svelte";

    // (38:2) {#if page === 'home'}
    function create_if_block_3$1(ctx) {
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
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(38:2) {#if page === 'home'}",
    		ctx
    	});

    	return block;
    }

    // (42:2) {#if page === 'detail'}
    function create_if_block_2$6(ctx) {
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
    		id: create_if_block_2$6.name,
    		type: "if",
    		source: "(42:2) {#if page === 'detail'}",
    		ctx
    	});

    	return block;
    }

    // (46:2) {#if page === 'notification'}
    function create_if_block_1$7(ctx) {
    	let current;
    	const notification = new Notification({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(notification.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(notification, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(notification.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(notification.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(notification, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$7.name,
    		type: "if",
    		source: "(46:2) {#if page === 'notification'}",
    		ctx
    	});

    	return block;
    }

    // (50:2) {#if page === 'status'}
    function create_if_block$d(ctx) {
    	let current;
    	const status = new Status({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(status.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(status, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(status.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(status.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(status, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$d.name,
    		type: "if",
    		source: "(50:2) {#if page === 'status'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let t0;
    	let main;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let current;
    	const navbar = new Navbar({ $$inline: true });
    	let if_block0 = /*page*/ ctx[0] === "home" && create_if_block_3$1(ctx);
    	let if_block1 = /*page*/ ctx[0] === "detail" && create_if_block_2$6(ctx);
    	let if_block2 = /*page*/ ctx[0] === "notification" && create_if_block_1$7(ctx);
    	let if_block3 = /*page*/ ctx[0] === "status" && create_if_block$d(ctx);
    	const videoplayer = new VideoPlayer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			if (if_block2) if_block2.c();
    			t3 = space();
    			if (if_block3) if_block3.c();
    			t4 = space();
    			create_component(videoplayer.$$.fragment);
    			add_location(main, file$j, 36, 0, 914);
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
    			append_dev(main, t2);
    			if (if_block2) if_block2.m(main, null);
    			append_dev(main, t3);
    			if (if_block3) if_block3.m(main, null);
    			insert_dev(target, t4, anchor);
    			mount_component(videoplayer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*page*/ ctx[0] === "home") {
    				if (if_block0) {
    					if (dirty & /*page*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3$1(ctx);
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
    					if_block1 = create_if_block_2$6(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, t2);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*page*/ ctx[0] === "notification") {
    				if (if_block2) {
    					if (dirty & /*page*/ 1) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1$7(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(main, t3);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*page*/ ctx[0] === "status") {
    				if (if_block3) {
    					if (dirty & /*page*/ 1) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block$d(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(main, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(videoplayer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(videoplayer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navbar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (detaching) detach_dev(t4);
    			destroy_component(videoplayer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let page = get_store_value(currentPage);
    	currentPage.subscribe(newPage => $$invalidate(0, page = newPage));
    	let url = window.location.href;

    	if (url.includes("access_token")) {
    		let jwt = url.split("access_token=")[1].split("&token_type=")[0];

    		if (jwt) {
    			getUser(jwt);
    		}
    	}

    	let user = JSON.parse(localStorage.getItem("current_user"));

    	if (user) {
    		currentUser.set(user);
    		getUserLists(user);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Navbar,
    		VideoPlayer,
    		Home,
    		Detail,
    		Notification,
    		Status,
    		get: get_store_value,
    		currentPage,
    		currentUser,
    		getUser,
    		getUserLists,
    		page,
    		url,
    		user
    	});

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    		if ("url" in $$props) url = $$props.url;
    		if ("user" in $$props) user = $$props.user;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
