
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
      url: {"env":{"API_URL":"http://localhost:8080/api/v1/","API_SOCKET":"ws://localhost:8080/api/v1/socket","ANILIST_CLIENTID":"3615"}}.env.API_URL,
      socket: {"env":{"API_URL":"http://localhost:8080/api/v1/","API_SOCKET":"ws://localhost:8080/api/v1/socket","ANILIST_CLIENTID":"3615"}}.env.API_SOCKET,
      endpoints: {
        anime: 'anime',
        episode: 'episode',
        matching: 'matching',
        notification: 'notification'
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

    // (132:6) {#if user}
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
    			attr_dev(img, "class", "svelte-1sv3tyy");
    			add_location(img, file$1, 133, 10, 2815);
    			attr_dev(li0, "class", "svelte-1sv3tyy");
    			add_location(li0, file$1, 132, 8, 2799);
    			attr_dev(li1, "id", "profile");
    			attr_dev(li1, "class", "svelte-1sv3tyy");
    			add_location(li1, file$1, 138, 8, 2991);
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
    		source: "(132:6) {#if user}",
    		ctx
    	});

    	return block;
    }

    // (144:8) {:else}
    function create_else_block(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "image-profile svelte-1sv3tyy");
    			attr_dev(div, "title", "Logout");
    			set_style(div, "background-image", "url('" + /*user*/ ctx[0].avatar + "')");
    			add_location(div, file$1, 144, 10, 3215);
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
    		source: "(144:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (142:8) {#if !user}
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
    		source: "(142:8) {#if !user}",
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
    			attr_dev(img0, "class", "brand svelte-1sv3tyy");
    			add_location(img0, file$1, 114, 4, 2259);
    			attr_dev(li0, "class", "svelte-1sv3tyy");
    			add_location(li0, file$1, 120, 6, 2410);
    			attr_dev(li1, "class", "svelte-1sv3tyy");
    			add_location(li1, file$1, 121, 6, 2469);
    			attr_dev(li2, "class", "svelte-1sv3tyy");
    			add_location(li2, file$1, 122, 6, 2524);
    			if (img1.src !== (img1_src_value = "/images/nav_github_icon.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Github");
    			attr_dev(img1, "class", "svelte-1sv3tyy");
    			add_location(img1, file$1, 124, 8, 2599);
    			attr_dev(li3, "class", "svelte-1sv3tyy");
    			add_location(li3, file$1, 123, 6, 2585);
    			attr_dev(ul0, "class", "svelte-1sv3tyy");
    			add_location(ul0, file$1, 119, 4, 2398);
    			attr_dev(li4, "class", "svelte-1sv3tyy");
    			add_location(li4, file$1, 140, 6, 3080);
    			attr_dev(ul1, "class", "side svelte-1sv3tyy");
    			add_location(ul1, file$1, 130, 4, 2754);
    			attr_dev(nav, "class", "svelte-1sv3tyy");
    			add_location(nav, file$1, 113, 2, 2248);
    			attr_dev(navbar, "class", "svelte-1sv3tyy");
    			add_location(navbar, file$1, 112, 0, 2236);
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
    	window.location.href = "https://anilist.co/api/v2/oauth/authorize?client_id=" + {"env":{"API_URL":"http://localhost:8080/api/v1/","API_SOCKET":"ws://localhost:8080/api/v1/socket","ANILIST_CLIENTID":"3615"}}.env.ANILIST_CLIENTID + "&response_type=token";
    }

    function tryLogout() {
    	if (confirm("Are you sure you want to logout?")) {
    		localStorage.removeItem("current_user");
    		window.location.reload();
    	}
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let user = get_store_value(currentUser);
    	currentUser.subscribe(newUser => $$invalidate(0, user = newUser));

    	function changePage(page) {
    		if (page === "github") {
    			window.open("https://github.com/AniAPI-Team/aniapi-svelte");
    		} else if (page === "profile") {
    			window.open(user.siteUrl);
    		} else if (page === "api") {
    			window.open("https://github.com/AniAPI-Team/aniapi-go/wiki");
    		} else {
    			currentPage.set(page);
    		}
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
    			attr_dev(i, "class", "fas fa-times fa-fw svelte-1jia0p5");
    			add_location(i, file$2, 90, 2, 1507);
    			if (video_1.src !== (video_1_src_value = /*src*/ ctx[0])) attr_dev(video_1, "src", video_1_src_value);
    			video_1.controls = true;
    			video_1.autoplay = true;
    			attr_dev(video_1, "disablepictureinpicture", "");
    			attr_dev(video_1, "class", "svelte-1jia0p5");
    			add_location(video_1, file$2, 91, 2, 1560);
    			attr_dev(div, "class", div_class_value = "video-player " + (/*src*/ ctx[0] ? "visible" : "") + " svelte-1jia0p5");
    			add_location(div, file$2, 89, 0, 1454);
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

    			if (dirty & /*src*/ 1 && div_class_value !== (div_class_value = "video-player " + (/*src*/ ctx[0] ? "visible" : "") + " svelte-1jia0p5")) {
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

    /* src\components\Footer.svelte generated by Svelte v3.23.0 */
    const file$3 = "src\\components\\Footer.svelte";

    function create_fragment$3(ctx) {
    	let footer;
    	let div2;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let div0;
    	let span;
    	let t2;
    	let t3;
    	let ul;
    	let li0;
    	let a0;
    	let t5;
    	let li1;
    	let a1;
    	let t7;
    	let li2;
    	let a2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div2 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "AniAPI";
    			t2 = text("\r\n        © 2020");
    			t3 = space();
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Terms & Privacy";
    			t5 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "API";
    			t7 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Github";
    			if (img.src !== (img_src_value = "/images/aniapi_logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "AniAPI Logo");
    			attr_dev(img, "class", "logo svelte-98ftxx");
    			add_location(img, file$3, 70, 4, 1093);
    			attr_dev(span, "class", "svelte-98ftxx");
    			add_location(span, file$3, 73, 8, 1228);
    			attr_dev(div0, "class", "copyright svelte-98ftxx");
    			add_location(div0, file$3, 72, 6, 1195);
    			attr_dev(a0, "class", "svelte-98ftxx");
    			add_location(a0, file$3, 78, 10, 1320);
    			attr_dev(li0, "class", "svelte-98ftxx");
    			add_location(li0, file$3, 77, 8, 1304);
    			attr_dev(a1, "href", "https://github.com/AniAPI-Team/aniapi-go/wiki");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "class", "svelte-98ftxx");
    			add_location(a1, file$3, 81, 10, 1427);
    			attr_dev(li1, "class", "svelte-98ftxx");
    			add_location(li1, file$3, 80, 8, 1411);
    			attr_dev(a2, "href", "https://github.com/AniAPI-Team/aniapi-svelte");
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "class", "svelte-98ftxx");
    			add_location(a2, file$3, 88, 10, 1599);
    			attr_dev(li2, "class", "svelte-98ftxx");
    			add_location(li2, file$3, 87, 8, 1583);
    			attr_dev(ul, "class", "svelte-98ftxx");
    			add_location(ul, file$3, 76, 6, 1290);
    			attr_dev(div1, "class", "footer svelte-98ftxx");
    			add_location(div1, file$3, 71, 4, 1167);
    			attr_dev(div2, "class", "main svelte-98ftxx");
    			add_location(div2, file$3, 69, 2, 1069);
    			attr_dev(footer, "class", "svelte-98ftxx");
    			add_location(footer, file$3, 68, 0, 1057);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div2);
    			append_dev(div2, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(div0, t2);
    			append_dev(div1, t3);
    			append_dev(div1, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t5);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(ul, t7);
    			append_dev(ul, li2);
    			append_dev(li2, a2);

    			if (!mounted) {
    				dispose = listen_dev(a0, "click", /*click_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
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
    	function changePage(page) {
    		currentPage.set(page);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Footer", $$slots, []);
    	const click_handler = () => changePage("termsprivacy");
    	$$self.$capture_state = () => ({ get: get_store_value, currentPage, changePage });
    	return [changePage, click_handler];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\TextBox.svelte generated by Svelte v3.23.0 */

    const file$4 = "src\\components\\TextBox.svelte";

    // (83:2) {:else}
    function create_else_block$1(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-times fa-fw svelte-15ux751");
    			set_style(i, "visibility", "hidden");
    			add_location(i, file$4, 83, 4, 1399);
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
    			add_location(i, file$4, 81, 4, 1333);
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

    function create_fragment$4(ctx) {
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
    			add_location(i, file$4, 78, 2, 1204);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", /*hint*/ ctx[1]);
    			input.value = /*text*/ ctx[0];
    			attr_dev(input, "class", "svelte-15ux751");
    			add_location(input, file$4, 79, 2, 1241);
    			attr_dev(div, "class", "textbox svelte-15ux751");
    			attr_dev(div, "style", /*css*/ ctx[3]);
    			add_location(div, file$4, 77, 0, 1167);
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
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
    			id: create_fragment$4.name
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

    const file$5 = "src\\components\\ComboBox.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    // (248:2) {:else}
    function create_else_block_1(ctx) {
    	let i;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-chevron-down fa-fw svelte-ge76ym");
    			add_location(i, file$5, 248, 4, 4467);
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
    		source: "(248:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (246:2) {#if !empty}
    function create_if_block_2$1(ctx) {
    	let i;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-times fa-fw svelte-ge76ym");
    			add_location(i, file$5, 246, 4, 4401);
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
    		source: "(246:2) {#if !empty}",
    		ctx
    	});

    	return block;
    }

    // (253:6) {#if item.value.toLowerCase().includes(text.toLowerCase())}
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
    			attr_dev(div, "class", "item svelte-ge76ym");
    			add_location(div, file$5, 253, 8, 4692);
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
    		source: "(253:6) {#if item.value.toLowerCase().includes(text.toLowerCase())}",
    		ctx
    	});

    	return block;
    }

    // (258:10) {:else}
    function create_else_block$2(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-check-circle fa-fw svelte-ge76ym");
    			set_style(i, "visibility", "hidden");
    			add_location(i, file$5, 258, 12, 4891);
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
    		source: "(258:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (256:10) {#if item.selected}
    function create_if_block_1$2(ctx) {
    	let i;

    	const block = {
    		c: function create() {
    			i = element("i");
    			attr_dev(i, "class", "fas fa-check-circle fa-fw svelte-ge76ym");
    			add_location(i, file$5, 256, 12, 4819);
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
    		source: "(256:10) {#if item.selected}",
    		ctx
    	});

    	return block;
    }

    // (252:4) {#each items as item}
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
    		source: "(252:4) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
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
    			attr_dev(input, "class", "svelte-ge76ym");
    			add_location(input, file$5, 239, 2, 4268);
    			attr_dev(div0, "class", div0_class_value = "dropdown " + (/*showDropdown*/ ctx[5] ? "active" : "") + " svelte-ge76ym");
    			add_location(div0, file$5, 250, 2, 4535);
    			attr_dev(div1, "class", "combobox svelte-ge76ym");
    			add_location(div1, file$5, 238, 0, 4222);
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

    			if (dirty & /*showDropdown*/ 32 && div0_class_value !== (div0_class_value = "dropdown " + (/*showDropdown*/ ctx[5] ? "active" : "") + " svelte-ge76ym")) {
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
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
    			id: create_fragment$5.name
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

    const file$6 = "src\\components\\CheckBox.svelte";

    function create_fragment$6(ctx) {
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
    			add_location(i, file$6, 51, 4, 966);
    			attr_dev(div0, "class", div0_class_value = "circle " + (/*checked*/ ctx[0] ? "checked" : "") + " svelte-aoi5n4");
    			add_location(div0, file$6, 50, 2, 913);
    			add_location(span, file$6, 53, 2, 1012);
    			attr_dev(div1, "class", "checkbox svelte-aoi5n4");
    			add_location(div1, file$6, 49, 0, 869);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { label: 1, checked: 0, callback: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CheckBox",
    			options,
    			id: create_fragment$6.name
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

    const file$7 = "src\\components\\SearchTag.svelte";

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
    			add_location(span, file$7, 28, 4, 451);
    			attr_dev(div, "class", "tags svelte-1oxf602");
    			add_location(div, file$7, 27, 2, 427);
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
    			add_location(span, file$7, 30, 6, 516);
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

    function create_fragment$7(ctx) {
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { name: 0, tags: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchTag",
    			options,
    			id: create_fragment$7.name
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
    const file$8 = "src\\components\\SearchResult.svelte";

    // (222:4) {#if status}
    function create_if_block_2$2(ctx) {
    	let div;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", div_class_value = "status " + /*status*/ ctx[1].toLowerCase() + " svelte-gk97gw");
    			attr_dev(div, "title", /*status*/ ctx[1]);
    			add_location(div, file$8, 222, 6, 4278);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*status*/ 2 && div_class_value !== (div_class_value = "status " + /*status*/ ctx[1].toLowerCase() + " svelte-gk97gw")) {
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
    		source: "(222:4) {#if status}",
    		ctx
    	});

    	return block;
    }

    // (225:4) {#if progress}
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
    			attr_dev(i, "class", "fas fa-clipboard-check fa-fw svelte-gk97gw");
    			add_location(i, file$8, 226, 8, 4442);
    			attr_dev(div, "class", "progress svelte-gk97gw");
    			attr_dev(div, "title", div_title_value = "" + (/*progress*/ ctx[2] + " episodes seen"));
    			add_location(div, file$8, 225, 6, 4377);
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
    		source: "(225:4) {#if progress}",
    		ctx
    	});

    	return block;
    }

    // (232:6) {#if data.score !== 0}
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
    			attr_dev(i, "class", "fas fa-heart fa-fw svelte-gk97gw");
    			add_location(i, file$8, 232, 8, 4594);
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
    		source: "(232:6) {#if data.score !== 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
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
    			attr_dev(div0, "class", "overlay svelte-gk97gw");
    			add_location(div0, file$8, 220, 4, 4229);
    			attr_dev(div1, "class", "score svelte-gk97gw");
    			add_location(div1, file$8, 230, 4, 4535);
    			attr_dev(div2, "class", "title svelte-gk97gw");
    			attr_dev(div2, "title", div2_title_value = /*data*/ ctx[0].title);
    			add_location(div2, file$8, 236, 4, 4679);
    			attr_dev(div3, "class", "picture svelte-gk97gw");
    			set_style(div3, "background-image", "url(" + /*data*/ ctx[0].picture + ")");
    			add_location(div3, file$8, 219, 2, 4157);
    			attr_dev(div4, "class", div4_class_value = "card " + (/*status*/ ctx[1] ? /*status*/ ctx[1].toLowerCase() : "") + " svelte-gk97gw");
    			add_location(div4, file$8, 216, 0, 4057);
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

    			if (dirty & /*status*/ 2 && div4_class_value !== (div4_class_value = "card " + (/*status*/ ctx[1] ? /*status*/ ctx[1].toLowerCase() : "") + " svelte-gk97gw")) {
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SearchResult",
    			options,
    			id: create_fragment$8.name
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

    function create_fragment$9(ctx) {
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
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { page: 0, callback: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pagination",
    			options,
    			id: create_fragment$9.name
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
    const file$9 = "src\\views\\Home.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (184:4) {#if search.title !== ''}
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
    		source: "(184:4) {#if search.title !== ''}",
    		ctx
    	});

    	return block;
    }

    // (189:4) {#if search.sort !== ''}
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
    		source: "(189:4) {#if search.sort !== ''}",
    		ctx
    	});

    	return block;
    }

    // (194:4) {#if search.results.length === 0}
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
    			add_location(img, file$9, 195, 8, 4498);
    			attr_dev(div, "class", "no-results");
    			add_location(div, file$9, 194, 6, 4464);
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
    		source: "(194:4) {#if search.results.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (199:4) {#each search.results as result}
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
    		source: "(199:4) {#each search.results as result}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
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
    			attr_dev(div0, "class", "search-filters svelte-2nk1e2");
    			add_location(div0, file$9, 153, 2, 3222);
    			attr_dev(div1, "class", "search-tags svelte-2nk1e2");
    			add_location(div1, file$9, 182, 2, 4006);
    			attr_dev(div2, "class", div2_class_value = "search-results " + (/*search*/ ctx[0].results.length === 0 ? "empty" : "") + " svelte-2nk1e2");
    			add_location(div2, file$9, 192, 2, 4344);
    			attr_dev(main, "class", "svelte-2nk1e2");
    			add_location(main, file$9, 152, 0, 3212);
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

    			if (!current || dirty & /*search*/ 1 && div2_class_value !== (div2_class_value = "search-results " + (/*search*/ ctx[0].results.length === 0 ? "empty" : "") + " svelte-2nk1e2")) {
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\components\SelectBox.svelte generated by Svelte v3.23.0 */

    const file$a = "src\\components\\SelectBox.svelte";

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
    			add_location(i, file$a, 201, 10, 3847);
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
    			add_location(i, file$a, 199, 10, 3779);
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
    			add_location(div, file$a, 196, 6, 3658);
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

    function create_fragment$b(ctx) {
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
    			add_location(input, file$a, 192, 2, 3444);
    			attr_dev(i, "class", "fas fa-chevron-down fa-fw svelte-ngfb6s");
    			add_location(i, file$a, 193, 2, 3511);
    			attr_dev(div0, "class", div0_class_value = "dropdown " + (/*showDropdown*/ ctx[3] ? "active" : "") + " svelte-ngfb6s");
    			add_location(div0, file$a, 194, 2, 3570);
    			attr_dev(div1, "class", "selectbox svelte-ngfb6s");
    			add_location(div1, file$a, 191, 0, 3397);
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { items: 0, selected: 1, callback: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelectBox",
    			options,
    			id: create_fragment$b.name
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

    const file$b = "src\\components\\NumericBox.svelte";

    function create_fragment$c(ctx) {
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
    			add_location(i0, file$b, 64, 2, 1075);
    			attr_dev(input, "type", "number");
    			attr_dev(input, "placeholder", /*hint*/ ctx[1]);
    			attr_dev(input, "class", "svelte-1cpww5");
    			add_location(input, file$b, 65, 2, 1136);
    			attr_dev(i1, "class", "fas fa-plus fa-fw svelte-1cpww5");
    			add_location(i1, file$b, 70, 2, 1247);
    			attr_dev(div, "class", "numericbox svelte-1cpww5");
    			attr_dev(div, "style", /*css*/ ctx[2]);
    			add_location(div, file$b, 63, 0, 1035);
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
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
    			id: create_fragment$c.name
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

    const file$c = "src\\components\\Tabs.svelte";

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
    			add_location(div, file$c, 79, 6, 1537);
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
    			add_location(div, file$c, 75, 6, 1415);
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

    function create_fragment$d(ctx) {
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
    			add_location(div, file$c, 72, 0, 1330);
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
    			items: 0,
    			callback: 4,
    			css: 1,
    			counter: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tabs",
    			options,
    			id: create_fragment$d.name
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
    const file$d = "src\\components\\Matchings.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (192:2) {:else}
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
    		source: "(192:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (190:2) {#if !foundMatchings || foundMatchings.length === 0}
    function create_if_block$9(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "No matchings to vote found";
    			add_location(div, file$d, 190, 4, 4171);
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
    		source: "(190:2) {#if !foundMatchings || foundMatchings.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (200:10) {:else}
    function create_else_block_1$1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "fas fa-vote-yea fa-fw");
    			set_style(span, "display", "none");
    			add_location(span, file$d, 200, 12, 4507);
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
    		source: "(200:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (196:10) {#if m.voted}
    function create_if_block_2$4(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "fas fa-vote-yea fa-fw");
    			attr_dev(span, "title", "You already voted this matching");
    			add_location(span, file$d, 196, 12, 4366);
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
    		source: "(196:10) {#if m.voted}",
    		ctx
    	});

    	return block;
    }

    // (213:10) {#if !m.voted}
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
    		source: "(213:10) {#if !m.voted}",
    		ctx
    	});

    	return block;
    }

    // (193:4) {#each foundMatchings as m}
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
    			attr_dev(span0, "class", "from svelte-w5n6sa");
    			add_location(span0, file$d, 202, 10, 4595);
    			attr_dev(span1, "class", span1_class_value = "ratio " + /*m*/ ctx[7].ratioClass + " svelte-w5n6sa");
    			add_location(span1, file$d, 203, 10, 4641);
    			attr_dev(span2, "class", "votes svelte-w5n6sa");
    			add_location(span2, file$d, 204, 10, 4716);
    			attr_dev(div0, "class", "region svelte-w5n6sa");
    			add_location(div0, file$d, 194, 8, 4307);
    			attr_dev(span3, "class", "title svelte-w5n6sa");
    			add_location(span3, file$d, 222, 8, 5311);
    			attr_dev(div1, "class", div1_class_value = "matching " + /*m*/ ctx[7].ratioClass + " svelte-w5n6sa");
    			add_location(div1, file$d, 193, 6, 4260);
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

    			if (!current || dirty & /*foundMatchings*/ 1 && span1_class_value !== (span1_class_value = "ratio " + /*m*/ ctx[7].ratioClass + " svelte-w5n6sa")) {
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

    			if (!current || dirty & /*foundMatchings*/ 1 && div1_class_value !== (div1_class_value = "matching " + /*m*/ ctx[7].ratioClass + " svelte-w5n6sa")) {
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
    		source: "(193:4) {#each foundMatchings as m}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
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
    			attr_dev(div, "class", "matchings svelte-w5n6sa");
    			add_location(div, file$d, 188, 0, 4086);
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
    		id: create_fragment$e.name,
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

    function instance$e($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { animeId: 3, from: 4, reload: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Matchings",
    			options,
    			id: create_fragment$e.name
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
    const file$e = "src\\components\\Episodes.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (125:2) {#if foundEpisodes.length === 0}
    function create_if_block$a(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "No episodes found";
    			add_location(div, file$e, 125, 4, 2175);
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
    		source: "(125:2) {#if foundEpisodes.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (128:2) {#each foundEpisodes as episode}
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
    			attr_dev(i, "class", "fas fa-play fa-fw svelte-7o1p2g");
    			add_location(i, file$e, 131, 8, 2368);
    			attr_dev(div0, "class", "overlay svelte-7o1p2g");
    			add_location(div0, file$e, 129, 6, 2322);
    			attr_dev(span0, "class", span0_class_value = "flag-icon flag-icon-" + /*episode*/ ctx[6].region + " svelte-7o1p2g");
    			add_location(span0, file$e, 134, 8, 2451);
    			attr_dev(span1, "class", "from svelte-7o1p2g");
    			add_location(span1, file$e, 135, 8, 2514);
    			attr_dev(div1, "class", "region svelte-7o1p2g");
    			add_location(div1, file$e, 133, 6, 2421);
    			attr_dev(span2, "class", "title svelte-7o1p2g");
    			add_location(span2, file$e, 137, 6, 2576);
    			attr_dev(div2, "class", "episode svelte-7o1p2g");
    			add_location(div2, file$e, 128, 4, 2254);
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

    			if (dirty & /*foundEpisodes*/ 1 && span0_class_value !== (span0_class_value = "flag-icon flag-icon-" + /*episode*/ ctx[6].region + " svelte-7o1p2g")) {
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
    		source: "(128:2) {#each foundEpisodes as episode}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
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

    			attr_dev(div, "class", "episodes svelte-7o1p2g");
    			add_location(div, file$e, 123, 0, 2111);
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
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { animeId: 2, number: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Episodes",
    			options,
    			id: create_fragment$f.name
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
    const file$f = "src\\components\\AddMatching.svelte";

    function create_fragment$g(ctx) {
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
    			add_location(br0, file$f, 152, 4, 3092);
    			attr_dev(div0, "class", "url svelte-17pok8d");
    			add_location(div0, file$f, 153, 4, 3104);
    			add_location(br1, file$f, 162, 4, 3413);
    			add_location(br2, file$f, 168, 4, 3557);
    			attr_dev(div1, "class", "body svelte-17pok8d");
    			add_location(div1, file$f, 147, 2, 2932);
    			attr_dev(div2, "class", div2_class_value = "addmatching " + (/*active*/ ctx[0] ? "active" : "") + " svelte-17pok8d");
    			add_location(div2, file$f, 146, 0, 2878);
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
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, { active: 0, callback: 8 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddMatching",
    			options,
    			id: create_fragment$g.name
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

    const file$g = "src\\views\\Detail.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    // (319:8) {#if anime.anilist_id}
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
    			attr_dev(img, "class", "svelte-1blfeex");
    			add_location(img, file$g, 320, 12, 6802);
    			attr_dev(a, "href", a_href_value = "https://anilist.co/anime/" + /*anime*/ ctx[0].anilist_id);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "class", "svelte-1blfeex");
    			add_location(a, file$g, 319, 10, 6718);
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
    		source: "(319:8) {#if anime.anilist_id}",
    		ctx
    	});

    	return block;
    }

    // (329:6) {#if anime.trailer}
    function create_if_block_3(ctx) {
    	let iframe;
    	let iframe_src_value;

    	const block = {
    		c: function create() {
    			iframe = element("iframe");
    			if (iframe.src !== (iframe_src_value = /*anime*/ ctx[0].trailer)) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "title", "Trailer");
    			attr_dev(iframe, "class", "trailer svelte-1blfeex");
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = true;
    			add_location(iframe, file$g, 329, 8, 6997);
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
    		source: "(329:6) {#if anime.trailer}",
    		ctx
    	});

    	return block;
    }

    // (338:8) {#if user}
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
    		source: "(338:8) {#if user}",
    		ctx
    	});

    	return block;
    }

    // (343:10) {#if status !== 'None'}
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
    		source: "(343:10) {#if status !== 'None'}",
    		ctx
    	});

    	return block;
    }

    // (355:12) {#each info.items as item}
    function create_each_block_1(ctx) {
    	let span;
    	let t_value = /*item*/ ctx[21] + "";
    	let t;
    	let span_title_value;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "chip svelte-1blfeex");
    			attr_dev(span, "title", span_title_value = /*item*/ ctx[21]);
    			add_location(span, file$g, 355, 14, 7787);
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
    		source: "(355:12) {#each info.items as item}",
    		ctx
    	});

    	return block;
    }

    // (352:8) {#each sideInfos as info}
    function create_each_block$7(ctx) {
    	let div1;
    	let div0;
    	let t0_value = /*info*/ ctx[18].title + "";
    	let t0;
    	let t1;
    	let t2;
    	let each_value_1 = /*info*/ ctx[18].items;
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
    			attr_dev(div0, "class", "subTitle svelte-1blfeex");
    			add_location(div0, file$g, 353, 12, 7691);
    			attr_dev(div1, "class", "info svelte-1blfeex");
    			add_location(div1, file$g, 352, 10, 7659);
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
    				each_value_1 = /*info*/ ctx[18].items;
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
    		source: "(352:8) {#each sideInfos as info}",
    		ctx
    	});

    	return block;
    }

    // (363:6) {#if anime.description}
    function create_if_block$b(ctx) {
    	let div;
    	let raw_value = /*anime*/ ctx[0].description + "";

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "desc svelte-1blfeex");
    			add_location(div, file$g, 363, 8, 7979);
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
    		source: "(363:6) {#if anime.description}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
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
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t7;
    	let a1;
    	let img1;
    	let img1_src_value;
    	let a1_href_value;
    	let t8;
    	let t9;
    	let main;
    	let div8;
    	let t10;
    	let div7;
    	let t11;
    	let t12;
    	let div11;
    	let t13;
    	let div10;
    	let div9;
    	let t14;
    	let t15;
    	let t16;
    	let t17;
    	let t18;
    	let current;
    	let mounted;
    	let dispose;
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
    			a0 = element("a");
    			img0 = element("img");
    			t7 = space();
    			a1 = element("a");
    			img1 = element("img");
    			t8 = space();
    			if (if_block0) if_block0.c();
    			t9 = space();
    			main = element("main");
    			div8 = element("div");
    			if (if_block1) if_block1.c();
    			t10 = space();
    			div7 = element("div");
    			if (if_block2) if_block2.c();
    			t11 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t12 = space();
    			div11 = element("div");
    			if (if_block3) if_block3.c();
    			t13 = space();
    			div10 = element("div");
    			div9 = element("div");
    			create_component(button.$$.fragment);
    			t14 = space();
    			create_component(tabs0.$$.fragment);
    			t15 = space();
    			create_component(matchings.$$.fragment);
    			t16 = space();
    			create_component(tabs1.$$.fragment);
    			t17 = space();
    			create_component(episodes_1.$$.fragment);
    			t18 = space();
    			create_component(addmatching.$$.fragment);
    			attr_dev(div0, "class", "overlay svelte-1blfeex");
    			add_location(div0, file$g, 303, 4, 6099);
    			attr_dev(i, "class", "fas fa-heart fa-fw svelte-1blfeex");
    			add_location(i, file$g, 305, 6, 6155);
    			attr_dev(div1, "class", "score svelte-1blfeex");
    			add_location(div1, file$g, 304, 4, 6128);
    			attr_dev(div2, "class", "picture svelte-1blfeex");
    			set_style(div2, "background-image", "url(" + /*anime*/ ctx[0].picture + ")");
    			add_location(div2, file$g, 309, 6, 6252);
    			attr_dev(div3, "class", "title svelte-1blfeex");
    			add_location(div3, file$g, 310, 6, 6329);
    			if (img0.src !== (img0_src_value = "/images/detail_share_icon.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Share Icon");
    			attr_dev(img0, "class", "svelte-1blfeex");
    			add_location(img0, file$g, 313, 10, 6436);
    			attr_dev(a0, "class", "svelte-1blfeex");
    			add_location(a0, file$g, 312, 8, 6404);
    			if (img1.src !== (img1_src_value = "/images/mal_logo.jpg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "MyAnimeList Logo");
    			attr_dev(img1, "class", "svelte-1blfeex");
    			add_location(img1, file$g, 316, 10, 6603);
    			attr_dev(a1, "href", a1_href_value = "https://myanimelist.net/anime/" + /*anime*/ ctx[0].mal_id);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "class", "svelte-1blfeex");
    			add_location(a1, file$g, 315, 8, 6520);
    			attr_dev(div4, "class", "links svelte-1blfeex");
    			add_location(div4, file$g, 311, 6, 6375);
    			attr_dev(div5, "class", "head svelte-1blfeex");
    			add_location(div5, file$g, 308, 4, 6226);
    			attr_dev(div6, "class", "banner svelte-1blfeex");
    			set_style(div6, "background-image", "url(" + (/*anime*/ ctx[0].banner ? /*anime*/ ctx[0].banner : "") + ")");
    			add_location(div6, file$g, 300, 2, 5998);
    			attr_dev(div7, "class", "content svelte-1blfeex");
    			add_location(div7, file$g, 336, 6, 7167);
    			attr_dev(div8, "class", "side svelte-1blfeex");
    			add_location(div8, file$g, 327, 4, 6942);
    			set_style(div9, "display", "flex");
    			set_style(div9, "align-items", "center");
    			add_location(div9, file$g, 368, 8, 8103);
    			attr_dev(div10, "class", "episodes svelte-1blfeex");
    			add_location(div10, file$g, 367, 6, 8071);
    			attr_dev(div11, "class", "main svelte-1blfeex");
    			add_location(div11, file$g, 361, 4, 7920);
    			attr_dev(main, "class", "svelte-1blfeex");
    			add_location(main, file$g, 326, 2, 6930);
    			attr_dev(div12, "class", "detail");
    			add_location(div12, file$g, 299, 0, 5974);
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
    			append_dev(div4, a0);
    			append_dev(a0, img0);
    			append_dev(div4, t7);
    			append_dev(div4, a1);
    			append_dev(a1, img1);
    			append_dev(div4, t8);
    			if (if_block0) if_block0.m(div4, null);
    			append_dev(div12, t9);
    			append_dev(div12, main);
    			append_dev(main, div8);
    			if (if_block1) if_block1.m(div8, null);
    			append_dev(div8, t10);
    			append_dev(div8, div7);
    			if (if_block2) if_block2.m(div7, null);
    			append_dev(div7, t11);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div7, null);
    			}

    			append_dev(main, t12);
    			append_dev(main, div11);
    			if (if_block3) if_block3.m(div11, null);
    			append_dev(div11, t13);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			mount_component(button, div9, null);
    			append_dev(div9, t14);
    			mount_component(tabs0, div9, null);
    			append_dev(div10, t15);
    			mount_component(matchings, div10, null);
    			append_dev(div10, t16);
    			mount_component(tabs1, div10, null);
    			append_dev(div10, t17);
    			mount_component(episodes_1, div10, null);
    			insert_dev(target, t18, anchor);
    			mount_component(addmatching, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a0, "click", /*share*/ ctx[16], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*anime*/ 1) && t2_value !== (t2_value = /*anime*/ ctx[0].score + "")) set_data_dev(t2, t2_value);

    			if (!current || dirty & /*anime*/ 1) {
    				set_style(div2, "background-image", "url(" + /*anime*/ ctx[0].picture + ")");
    			}

    			if ((!current || dirty & /*anime*/ 1) && t5_value !== (t5_value = /*anime*/ ctx[0].title + "")) set_data_dev(t5, t5_value);

    			if (!current || dirty & /*anime*/ 1 && a1_href_value !== (a1_href_value = "https://myanimelist.net/anime/" + /*anime*/ ctx[0].mal_id)) {
    				attr_dev(a1, "href", a1_href_value);
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
    					if_block1.m(div8, t10);
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
    					if_block3.m(div11, t13);
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
    			if (detaching) detach_dev(t18);
    			destroy_component(addmatching, detaching);
    			mounted = false;
    			dispose();
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

    function instance$h($$self, $$props, $$invalidate) {
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

    	function share() {
    		let url = new URL(window.location.href);
    		url = url.origin + "?anime=" + anime.id;
    		window.prompt("Copy to clipboard: Ctlr+C, Enter", url);
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
    		onMatchingAdded,
    		share
    	});

    	$$self.$inject_state = $$props => {
    		if ("user" in $$props) $$invalidate(8, user = $$props.user);
    		if ("loaded" in $$props) $$invalidate(17, loaded = $$props.loaded);
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
    		if ($$self.$$.dirty & /*loaded, anime*/ 131073) {
    			 {
    				if (!loaded) {
    					getAnimeInfos(anime.anilist_id).then(data => {
    						$$invalidate(0, anime.description = data.description, anime);
    						$$invalidate(0, anime.banner = data.banner, anime);
    						$$invalidate(0, anime.trailer = data.trailer, anime);
    						$$invalidate(1, episodes = new Array(data.episodes));
    						$$invalidate(1, episodes[0] = true, episodes);
    						onEpisodeTabChange(1);
    						$$invalidate(17, loaded = true);
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
    		onMatchingAdded,
    		share
    	];
    }

    class Detail extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Detail",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src\views\Notification.svelte generated by Svelte v3.23.0 */
    const file$h = "src\\views\\Notification.svelte";

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (119:2) {#if notifications.length === 0}
    function create_if_block$c(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let span0;
    	let t2;
    	let span1;
    	let t4;
    	let span2;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			span0 = element("span");
    			span0.textContent = "All is ok";
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "Seems like you have no new notifications to read";
    			t4 = space();
    			span2 = element("span");
    			attr_dev(div0, "class", "picture svelte-nikyja");
    			set_style(div0, "background-image", "('/images/aniapi_icon.png')");
    			add_location(div0, file$h, 120, 6, 2327);
    			attr_dev(span0, "class", "anime svelte-nikyja");
    			add_location(span0, file$h, 124, 8, 2457);
    			attr_dev(span1, "class", "message svelte-nikyja");
    			add_location(span1, file$h, 125, 8, 2503);
    			attr_dev(div1, "class", "info svelte-nikyja");
    			add_location(div1, file$h, 123, 6, 2429);
    			attr_dev(span2, "class", "time svelte-nikyja");
    			add_location(span2, file$h, 129, 6, 2624);
    			attr_dev(div2, "class", "notification svelte-nikyja");
    			set_style(div2, "width", "100%");
    			add_location(div2, file$h, 119, 4, 2274);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, span0);
    			append_dev(div1, t2);
    			append_dev(div1, span1);
    			append_dev(div2, t4);
    			append_dev(div2, span2);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$c.name,
    		type: "if",
    		source: "(119:2) {#if notifications.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (133:2) {#each notifications as n}
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
    			attr_dev(div0, "class", "picture svelte-nikyja");

    			set_style(div0, "background-image", "url('" + (/*n*/ ctx[5].anime.picture
    			? /*n*/ ctx[5].anime.picture
    			: "") + "')");

    			add_location(div0, file$h, 134, 6, 2736);
    			attr_dev(span0, "class", "anime svelte-nikyja");
    			add_location(span0, file$h, 138, 8, 2886);
    			attr_dev(span1, "class", "message svelte-nikyja");
    			add_location(span1, file$h, 141, 8, 2996);
    			attr_dev(div1, "class", "info svelte-nikyja");
    			add_location(div1, file$h, 137, 6, 2858);
    			attr_dev(span2, "class", "time svelte-nikyja");
    			add_location(span2, file$h, 145, 6, 3086);
    			attr_dev(div2, "class", "notification svelte-nikyja");
    			add_location(div2, file$h, 133, 4, 2702);
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
    		source: "(133:2) {#each notifications as n}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let main;
    	let t;
    	let if_block = /*notifications*/ ctx[0].length === 0 && create_if_block$c(ctx);
    	let each_value = /*notifications*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$8(get_each_context$8(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block) if_block.c();
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(main, "class", "svelte-nikyja");
    			add_location(main, file$h, 117, 0, 2226);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block) if_block.m(main, null);
    			append_dev(main, t);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*notifications*/ ctx[0].length === 0) {
    				if (if_block) ; else {
    					if_block = create_if_block$c(ctx);
    					if_block.c();
    					if_block.m(main, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

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
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
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

    function instance$i($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notification",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    /* src\components\QueueItem.svelte generated by Svelte v3.23.0 */

    const file$i = "src\\components\\QueueItem.svelte";

    function create_fragment$j(ctx) {
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

    			add_location(div0, file$i, 85, 2, 1725);
    			attr_dev(span0, "class", "title svelte-3f4g18");
    			add_location(span0, file$i, 89, 4, 1865);
    			attr_dev(span1, "class", "time svelte-3f4g18");
    			add_location(span1, file$i, 90, 4, 1916);
    			attr_dev(span2, "class", span2_class_value = "running " + (!/*data*/ ctx[0].running ? "not" : "") + " svelte-3f4g18");
    			add_location(span2, file$i, 93, 4, 2013);
    			attr_dev(div1, "class", "info svelte-3f4g18");
    			add_location(div1, file$i, 88, 2, 1841);
    			attr_dev(div2, "class", "queue-item svelte-3f4g18");
    			attr_dev(div2, "title", div2_title_value = "" + ((/*data*/ ctx[0].running ? "Currently" : "Not") + " running"));
    			add_location(div2, file$i, 84, 0, 1644);
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
    		id: create_fragment$j.name,
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

    function instance$j($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "QueueItem",
    			options,
    			id: create_fragment$j.name
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
    const file$j = "src\\views\\Status.svelte";

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

    // (261:4) {:else}
    function create_else_block$6(ctx) {
    	let div5;
    	let div3;
    	let div0;
    	let t0;
    	let div2;
    	let span0;
    	let t2;
    	let span1;
    	let t4;
    	let div1;
    	let t5;
    	let div4;
    	let span2;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			span0 = element("span");
    			span0.textContent = "Idle state";
    			t2 = space();
    			span1 = element("span");
    			span1.textContent = "Actually not running";
    			t4 = space();
    			div1 = element("div");
    			t5 = space();
    			div4 = element("div");
    			span2 = element("span");
    			span2.textContent = "Waiting for next run...";
    			attr_dev(div0, "class", "picture svelte-llfh3a");
    			set_style(div0, "background-image", "url('/images/aniapi_icon.png')");
    			add_location(div0, file$j, 263, 10, 5250);
    			attr_dev(span0, "class", "title svelte-llfh3a");
    			add_location(span0, file$j, 267, 12, 5399);
    			attr_dev(span1, "class", "type");
    			add_location(span1, file$j, 268, 12, 5450);
    			attr_dev(div1, "class", "genres svelte-llfh3a");
    			add_location(div1, file$j, 269, 12, 5510);
    			attr_dev(div2, "class", "info svelte-llfh3a");
    			add_location(div2, file$j, 266, 10, 5367);
    			attr_dev(div3, "class", "anime svelte-llfh3a");
    			add_location(div3, file$j, 262, 8, 5219);
    			attr_dev(span2, "class", "svelte-llfh3a");
    			add_location(span2, file$j, 273, 10, 5605);
    			attr_dev(div4, "class", "run svelte-llfh3a");
    			add_location(div4, file$j, 272, 8, 5576);
    			attr_dev(div5, "class", "scraper svelte-llfh3a");
    			add_location(div5, file$j, 261, 6, 5188);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, span0);
    			append_dev(div2, t2);
    			append_dev(div2, span1);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div4, span2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$6.name,
    		type: "else",
    		source: "(261:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (240:4) {#if animeScraping && !stopped}
    function create_if_block$d(ctx) {
    	let div5;
    	let div3;
    	let div0;
    	let t0;
    	let div2;
    	let span0;
    	let t1_value = /*animeScraping*/ ctx[1].title + "";
    	let t1;
    	let t2;
    	let span1;
    	let t3_value = /*animeScraping*/ ctx[1].type + "";
    	let t3;
    	let t4;
    	let div1;
    	let t5;
    	let div4;
    	let span2;
    	let t7;
    	let t8_value = getTimePassedFromDate$1(/*animeScraping*/ ctx[1].start_time) + "";
    	let t8;
    	let each_value_1 = /*animeScraping*/ ctx[1].genres;
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
    			attr_dev(div0, "class", "picture svelte-llfh3a");

    			set_style(div0, "background-image", "url('" + (/*animeScraping*/ ctx[1].picture
    			? /*animeScraping*/ ctx[1].picture
    			: "") + "')");

    			add_location(div0, file$j, 242, 10, 4519);
    			attr_dev(span0, "class", "title svelte-llfh3a");
    			add_location(span0, file$j, 246, 12, 4697);
    			attr_dev(span1, "class", "type");
    			add_location(span1, file$j, 247, 12, 4759);
    			attr_dev(div1, "class", "genres svelte-llfh3a");
    			add_location(div1, file$j, 248, 12, 4819);
    			attr_dev(div2, "class", "info svelte-llfh3a");
    			add_location(div2, file$j, 245, 10, 4665);
    			attr_dev(div3, "class", "anime svelte-llfh3a");
    			add_location(div3, file$j, 241, 8, 4488);
    			attr_dev(span2, "class", "svelte-llfh3a");
    			add_location(span2, file$j, 256, 10, 5052);
    			attr_dev(div4, "class", "run svelte-llfh3a");
    			add_location(div4, file$j, 255, 8, 5023);
    			attr_dev(div5, "class", "scraper svelte-llfh3a");
    			add_location(div5, file$j, 240, 6, 4457);
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
    			if (dirty & /*animeScraping*/ 2) {
    				set_style(div0, "background-image", "url('" + (/*animeScraping*/ ctx[1].picture
    				? /*animeScraping*/ ctx[1].picture
    				: "") + "')");
    			}

    			if (dirty & /*animeScraping*/ 2 && t1_value !== (t1_value = /*animeScraping*/ ctx[1].title + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*animeScraping*/ 2 && t3_value !== (t3_value = /*animeScraping*/ ctx[1].type + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*animeScraping*/ 2) {
    				each_value_1 = /*animeScraping*/ ctx[1].genres;
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

    			if (dirty & /*animeScraping*/ 2 && t8_value !== (t8_value = getTimePassedFromDate$1(/*animeScraping*/ ctx[1].start_time) + "")) set_data_dev(t8, t8_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$d.name,
    		type: "if",
    		source: "(240:4) {#if animeScraping && !stopped}",
    		ctx
    	});

    	return block;
    }

    // (250:14) {#each animeScraping.genres as g}
    function create_each_block_1$1(ctx) {
    	let span;
    	let t_value = /*g*/ ctx[8] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "genre svelte-llfh3a");
    			add_location(span, file$j, 250, 16, 4906);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*animeScraping*/ 2 && t_value !== (t_value = /*g*/ ctx[8] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(250:14) {#each animeScraping.genres as g}",
    		ctx
    	});

    	return block;
    }

    // (282:6) {#each queueItems as q}
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
    		source: "(282:6) {#each queueItems as q}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
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

    	function select_block_type(ctx, dirty) {
    		if (/*animeScraping*/ ctx[1] && !/*stopped*/ ctx[0]) return create_if_block$d;
    		return create_else_block$6;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);
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
    			if_block.c();
    			t2 = space();
    			div4 = element("div");
    			div2 = element("div");
    			div2.textContent = "Queue Engine";
    			t4 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "section-title svelte-llfh3a");
    			add_location(div0, file$j, 238, 4, 4365);
    			attr_dev(div1, "class", "section svelte-llfh3a");
    			add_location(div1, file$j, 237, 2, 4338);
    			attr_dev(div2, "class", "section-title svelte-llfh3a");
    			add_location(div2, file$j, 279, 4, 5723);
    			attr_dev(div3, "class", "queue svelte-llfh3a");
    			add_location(div3, file$j, 280, 4, 5774);
    			attr_dev(div4, "class", "section svelte-llfh3a");
    			add_location(div4, file$j, 278, 2, 5696);
    			attr_dev(main, "class", "svelte-llfh3a");
    			add_location(main, file$j, 236, 0, 4328);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			if_block.m(div1, null);
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
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
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
    			if_block.d();
    			destroy_each(each_blocks, detaching);
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

    function instance$k($$self, $$props, $$invalidate) {
    	const api = get_store_value(API);
    	let stopped = true;
    	let animeScraping;
    	let queueItems = [];
    	let socket = new WebSocket(api.socket);

    	socket.onmessage = e => {
    		let message = JSON.parse(e.data);

    		switch (message.channel) {
    			case "scraper":
    				$$invalidate(0, stopped = !message.data.anime);
    				if (stopped) {
    					$$invalidate(1, animeScraping = { start_time: message.data.start_time });
    					return;
    				}
    				if (!message.data.anime.genres) {
    					message.data.anime.genres = [];
    				}
    				$$invalidate(1, animeScraping = message.data.anime);
    				$$invalidate(1, animeScraping.start_time = message.data.start_time, animeScraping);
    				return;
    			case "queue":
    				if (!message.data) {
    					return;
    				}
    				if (Array.isArray(message.data)) {
    					$$invalidate(2, queueItems = message.data);
    					return;
    				}
    				if (message.data.completed) {
    					let index = queueItems.map(x => {
    						return x.anime.id;
    					}).indexOf(message.data.anime.id);

    					queueItems.splice(index, 1);
    				} else if (message.data.running) {
    					let index = queueItems.map(x => {
    						return x.anime.id;
    					}).indexOf(message.data.anime.id);

    					$$invalidate(2, queueItems[index].running = true, queueItems);
    				} else {
    					queueItems.push(message.data);
    				}
    				$$invalidate(2, queueItems);
    				return;
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Status> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Status", $$slots, []);

    	$$self.$capture_state = () => ({
    		QueueItem,
    		API,
    		get: get_store_value,
    		getScraper,
    		getAnime,
    		getQueue,
    		api,
    		stopped,
    		animeScraping,
    		queueItems,
    		socket,
    		getTimePassedFromDate: getTimePassedFromDate$1
    	});

    	$$self.$inject_state = $$props => {
    		if ("stopped" in $$props) $$invalidate(0, stopped = $$props.stopped);
    		if ("animeScraping" in $$props) $$invalidate(1, animeScraping = $$props.animeScraping);
    		if ("queueItems" in $$props) $$invalidate(2, queueItems = $$props.queueItems);
    		if ("socket" in $$props) socket = $$props.socket;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [stopped, animeScraping, queueItems];
    }

    class Status extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Status",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* src\views\About.svelte generated by Svelte v3.23.0 */
    const file$k = "src\\views\\About.svelte";

    function get_each_context$a(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (252:4) {#each points as p}
    function create_each_block_1$2(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div0;
    	let h3;
    	let t1_value = /*p*/ ctx[5].title + "";
    	let t1;
    	let t2;
    	let p;
    	let t3_value = /*p*/ ctx[5].text + "";
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			if (img.src !== (img_src_value = "/images/" + /*p*/ ctx[5].image + ".png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = "" + (/*p*/ ctx[5].title + " Icon"));
    			attr_dev(img, "class", "svelte-p94qt9");
    			add_location(img, file$k, 253, 8, 5650);
    			attr_dev(h3, "class", "svelte-p94qt9");
    			add_location(h3, file$k, 255, 10, 5746);
    			attr_dev(p, "class", "svelte-p94qt9");
    			add_location(p, file$k, 256, 10, 5776);
    			attr_dev(div0, "class", "info svelte-p94qt9");
    			add_location(div0, file$k, 254, 8, 5716);
    			attr_dev(div1, "class", "point svelte-p94qt9");
    			add_location(div1, file$k, 252, 6, 5621);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, h3);
    			append_dev(h3, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p);
    			append_dev(p, t3);
    			append_dev(div1, t4);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(252:4) {#each points as p}",
    		ctx
    	});

    	return block;
    }

    // (263:4) {#each features as f}
    function create_each_block$a(ctx) {
    	let current;

    	const button = new Button({
    			props: {
    				icon: /*f*/ ctx[2].icon,
    				tooltip: /*f*/ ctx[2].tooltip,
    				circle: true,
    				tooltipDirection: "center"
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
    		id: create_each_block$a.name,
    		type: "each",
    		source: "(263:4) {#each features as f}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let main;
    	let div3;
    	let h1;
    	let t0;
    	let span;
    	let t1;
    	let br;
    	let t2;
    	let t3;
    	let div2;
    	let div0;
    	let b0;
    	let t5;
    	let t6;
    	let img0;
    	let img0_src_value;
    	let t7;
    	let div1;
    	let b1;
    	let t9;
    	let img1;
    	let img1_src_value;
    	let t10;
    	let b2;
    	let t12;
    	let img2;
    	let img2_src_value;
    	let t13;
    	let t14;
    	let div4;
    	let t15;
    	let div5;
    	let current;
    	let each_value_1 = /*points*/ ctx[0];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	let each_value = /*features*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$a(get_each_context$a(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			main = element("main");
    			div3 = element("div");
    			h1 = element("h1");
    			t0 = text("The biggest anime streaming API\r\n      ");
    			span = element("span");
    			t1 = text("Watch, share and develop\r\n        ");
    			br = element("br");
    			t2 = text("\r\n        applications with AniAPI");
    			t3 = space();
    			div2 = element("div");
    			div0 = element("div");
    			b0 = element("b");
    			b0.textContent = "AniAPI";
    			t5 = text("\r\n        is a REST API meant to expose a collection of anime's streaming videos\r\n        available across the web.");
    			t6 = space();
    			img0 = element("img");
    			t7 = space();
    			div1 = element("div");
    			b1 = element("b");
    			b1.textContent = "AniAPI";
    			t9 = text("\r\n        embeds\r\n        ");
    			img1 = element("img");
    			t10 = text("\r\n        as profile system, so you can synchronize the anime you love. Also,\r\n        ");
    			b2 = element("b");
    			b2.textContent = "it";
    			t12 = text("\r\n        uses\r\n        ");
    			img2 = element("img");
    			t13 = text("\r\n        as resource validator.");
    			t14 = space();
    			div4 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t15 = space();
    			div5 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(br, file$k, 227, 8, 4811);
    			attr_dev(span, "class", "sub svelte-p94qt9");
    			add_location(span, file$k, 225, 6, 4749);
    			attr_dev(h1, "class", "svelte-p94qt9");
    			add_location(h1, file$k, 223, 4, 4698);
    			add_location(b0, file$k, 233, 8, 4942);
    			attr_dev(div0, "class", "left svelte-p94qt9");
    			add_location(div0, file$k, 232, 6, 4914);
    			attr_dev(img0, "class", "logo svelte-p94qt9");
    			if (img0.src !== (img0_src_value = "/images/aniapi_icon.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "AniAPI Logo");
    			add_location(img0, file$k, 237, 6, 5092);
    			add_location(b1, file$k, 239, 8, 5197);
    			attr_dev(img1, "class", "mini svelte-p94qt9");
    			if (img1.src !== (img1_src_value = "/images/anilist_logo.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "AniList Logo");
    			add_location(img1, file$k, 241, 8, 5236);
    			add_location(b2, file$k, 243, 8, 5393);
    			attr_dev(img2, "class", "mini svelte-p94qt9");
    			if (img2.src !== (img2_src_value = "/images/mal_logo.jpg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "MyAnimeList Logo");
    			add_location(img2, file$k, 245, 8, 5426);
    			attr_dev(div1, "class", "right svelte-p94qt9");
    			add_location(div1, file$k, 238, 6, 5168);
    			attr_dev(div2, "class", "resources svelte-p94qt9");
    			add_location(div2, file$k, 231, 4, 4883);
    			attr_dev(div3, "class", "jumbo svelte-p94qt9");
    			add_location(div3, file$k, 222, 2, 4673);
    			attr_dev(div4, "class", "points svelte-p94qt9");
    			add_location(div4, file$k, 250, 2, 5568);
    			attr_dev(div5, "class", "features svelte-p94qt9");
    			add_location(div5, file$k, 261, 2, 5848);
    			attr_dev(main, "class", "svelte-p94qt9");
    			add_location(main, file$k, 221, 0, 4663);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div3);
    			append_dev(div3, h1);
    			append_dev(h1, t0);
    			append_dev(h1, span);
    			append_dev(span, t1);
    			append_dev(span, br);
    			append_dev(span, t2);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, b0);
    			append_dev(div0, t5);
    			append_dev(div2, t6);
    			append_dev(div2, img0);
    			append_dev(div2, t7);
    			append_dev(div2, div1);
    			append_dev(div1, b1);
    			append_dev(div1, t9);
    			append_dev(div1, img1);
    			append_dev(div1, t10);
    			append_dev(div1, b2);
    			append_dev(div1, t12);
    			append_dev(div1, img2);
    			append_dev(div1, t13);
    			append_dev(main, t14);
    			append_dev(main, div4);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div4, null);
    			}

    			append_dev(main, t15);
    			append_dev(main, div5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div5, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*points*/ 1) {
    				each_value_1 = /*points*/ ctx[0];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div4, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*features*/ 2) {
    				each_value = /*features*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$a(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$a(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div5, null);
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
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	const points = [
    		{
    			image: "ai_icon",
    			title: "A clever brain",
    			text: "Our system works in complete autonomy. Sometimes it needs some hammering, but it never stops working. Moreover, thanks to its modularity, it is made to expand and find more and more episodes!"
    		},
    		{
    			image: "watch_icon",
    			title: "Get comfortable",
    			text: "Guess? Everything is ready. You just have to sit down, find a new anime to watch and lose yourself in its plot. In the meantime, AniAPI will take care of the most boring things."
    		},
    		{
    			image: "queue_icon",
    			title: "No waste of time",
    			text: "Do you hate waiting for those long and boring processes? No problem! Our system has a manual processing queue, which allows users to update any anime at any time. It also allows you to see at what point in the queue it has arrived."
    		},
    		{
    			image: "contribution_icon",
    			title: "Count on community",
    			text: "An important aspect of our system is the high integration with the community! In fact, anyone can add new episode sources on a particular site or vote for a specific source. In this way it is possible to help the system improve its work!"
    		}
    	];

    	const features = [
    		{ icon: "tv", tooltip: "Watch episodes" },
    		{
    			icon: "download",
    			tooltip: "Download episodes"
    		},
    		{ icon: "search", tooltip: "Search anime" },
    		{
    			icon: "sync-alt",
    			tooltip: "Synchronize AniList"
    		},
    		{
    			icon: "share-alt",
    			tooltip: "Share anime"
    		},
    		{
    			icon: "poll",
    			tooltip: "Vote for matchings"
    		},
    		{ icon: "plus", tooltip: "Add matchings" },
    		{
    			icon: "sign-in-alt",
    			tooltip: "Login with AniList"
    		},
    		{
    			icon: "bell",
    			tooltip: "Track your anime"
    		},
    		{ icon: "eye", tooltip: "Monitor status" }
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("About", $$slots, []);
    	$$self.$capture_state = () => ({ Button, points, features });
    	return [points, features];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    /* src\views\TermsPrivacy.svelte generated by Svelte v3.23.0 */

    const file$l = "src\\views\\TermsPrivacy.svelte";

    function create_fragment$m(ctx) {
    	let main;
    	let h10;
    	let t1;
    	let div0;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let p2;
    	let t7;
    	let p3;
    	let t9;
    	let h20;
    	let t11;
    	let div1;
    	let p4;
    	let strong0;
    	let t13;
    	let t14;
    	let p5;
    	let strong1;
    	let t16;
    	let t17;
    	let p6;
    	let t19;
    	let p7;
    	let strong2;
    	let t21;
    	let t22;
    	let p8;
    	let t24;
    	let h21;
    	let t26;
    	let div2;
    	let p9;
    	let strong3;
    	let t28;
    	let t29;
    	let p10;
    	let strong4;
    	let t31;
    	let t32;
    	let p11;
    	let t34;
    	let p12;
    	let strong5;
    	let t36;
    	let t37;
    	let p13;
    	let strong6;
    	let t39;
    	let a0;
    	let t41;
    	let h22;
    	let t43;
    	let div3;
    	let p14;
    	let t45;
    	let p15;
    	let t47;
    	let h23;
    	let t49;
    	let div4;
    	let p16;
    	let t51;
    	let p17;
    	let t53;
    	let p18;
    	let t55;
    	let p19;
    	let strong7;
    	let t57;
    	let t58;
    	let h24;
    	let t60;
    	let div5;
    	let p20;
    	let t62;
    	let ul0;
    	let li0;
    	let t64;
    	let li1;
    	let t66;
    	let li2;
    	let t68;
    	let li3;
    	let t70;
    	let li4;
    	let t72;
    	let li5;
    	let t74;
    	let li6;
    	let t76;
    	let p21;
    	let t78;
    	let h25;
    	let t80;
    	let div6;
    	let p22;
    	let t82;
    	let p23;
    	let strong8;
    	let t84;
    	let t85;
    	let p24;
    	let strong9;
    	let t87;
    	let t88;
    	let p25;
    	let strong10;
    	let t90;
    	let t91;
    	let p26;
    	let strong11;
    	let t93;
    	let t94;
    	let p27;
    	let strong12;
    	let t96;
    	let t97;
    	let p28;
    	let strong13;
    	let t99;
    	let t100;
    	let p29;
    	let strong14;
    	let t102;
    	let t103;
    	let p30;
    	let strong15;
    	let t105;
    	let t106;
    	let p31;
    	let strong16;
    	let t108;
    	let t109;
    	let p32;
    	let strong17;
    	let t111;
    	let t112;
    	let p33;
    	let strong18;
    	let t114;
    	let t115;
    	let p34;
    	let strong19;
    	let t117;
    	let t118;
    	let p35;
    	let strong20;
    	let t120;
    	let t121;
    	let p36;
    	let strong21;
    	let t123;
    	let t124;
    	let p37;
    	let strong22;
    	let t126;
    	let t127;
    	let p38;
    	let t129;
    	let p39;
    	let t131;
    	let p40;
    	let t133;
    	let p41;
    	let strong23;
    	let t135;
    	let t136;
    	let p42;
    	let strong24;
    	let t138;
    	let t139;
    	let p43;
    	let strong25;
    	let t141;
    	let t142;
    	let h26;
    	let t144;
    	let div7;
    	let p44;
    	let strong26;
    	let t146;
    	let br;
    	let t147;
    	let strong27;
    	let t149;
    	let t150;
    	let h11;
    	let t152;
    	let div8;
    	let p45;
    	let t154;
    	let p46;
    	let t156;
    	let p47;
    	let t158;
    	let h27;
    	let t160;
    	let div9;
    	let p48;
    	let t162;
    	let h28;
    	let t164;
    	let div10;
    	let p49;
    	let t166;
    	let p50;
    	let t168;
    	let p51;
    	let t170;
    	let h29;
    	let t172;
    	let div11;
    	let p52;
    	let t174;
    	let ul1;
    	let li7;
    	let t176;
    	let li8;
    	let t178;
    	let li9;
    	let t180;
    	let li10;
    	let t182;
    	let li11;
    	let t184;
    	let li12;
    	let t186;
    	let li13;
    	let t188;
    	let h210;
    	let t190;
    	let div12;
    	let p53;
    	let t192;
    	let h211;
    	let t194;
    	let div13;
    	let p54;
    	let t196;
    	let p55;
    	let t197;
    	let a1;
    	let t199;
    	let t200;
    	let h212;
    	let t202;
    	let div14;
    	let p56;
    	let t203;
    	let a2;
    	let t205;
    	let h213;
    	let t207;
    	let div15;
    	let p57;
    	let t209;
    	let p58;
    	let t211;
    	let p59;
    	let t213;
    	let h214;
    	let t215;
    	let div16;
    	let p60;
    	let t217;
    	let p61;
    	let t219;
    	let h215;
    	let t221;
    	let div17;
    	let p62;
    	let t223;
    	let p63;
    	let t225;
    	let p64;
    	let t227;
    	let p65;
    	let t229;
    	let p66;
    	let t231;
    	let h216;
    	let t233;
    	let div18;
    	let p67;
    	let t235;
    	let p68;
    	let t237;
    	let p69;
    	let t239;
    	let p70;
    	let t241;
    	let p71;
    	let t243;
    	let p72;
    	let t245;
    	let p73;
    	let t247;
    	let p74;
    	let t249;
    	let h217;
    	let t251;
    	let div19;
    	let p75;
    	let t253;
    	let p76;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h10 = element("h1");
    			h10.textContent = "Terms of Use";
    			t1 = space();
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "The AniApi website located at www.aniapi.com is a copyrighted work\r\n      belonging to www.aniapi.com. Certain features of the Site may be subject\r\n      to additional guidelines, terms, or rules, which will be posted on the\r\n      Site in connection with such features.";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "All such additional terms, guidelines, and rules are incorporated by\r\n      reference into these Terms.";
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "These Terms of Use described the legally binding terms and conditions that\r\n      oversee your use of the Site. BY LOGGING INTO THE SITE, YOU ARE BEING\r\n      COMPLIANT THAT THESE TERMS and you represent that you have the authority\r\n      and capacity to enter into these Terms. YOU SHOULD BE AT LEAST 18 YEARS OF\r\n      AGE TO ACCESS THE SITE. IF YOU DISAGREE WITH ALL OF THE PROVISION OF THESE\r\n      TERMS, DO NOT LOG INTO AND/OR USE THE SITE.";
    			t7 = space();
    			p3 = element("p");
    			p3.textContent = "These terms require the use of arbitration Section 10.2 on an individual\r\n      basis to resolve disputes and also limit the remedies available to you in\r\n      the event of a dispute.";
    			t9 = space();
    			h20 = element("h2");
    			h20.textContent = "Access to the Site";
    			t11 = space();
    			div1 = element("div");
    			p4 = element("p");
    			strong0 = element("strong");
    			strong0.textContent = "Subject to these Terms.";
    			t13 = text("\r\n      Company grants you a non-transferable, non-exclusive, revocable, limited\r\n      license to access the Site solely for your own personal, noncommercial\r\n      use.");
    			t14 = space();
    			p5 = element("p");
    			strong1 = element("strong");
    			strong1.textContent = "Certain Restrictions.";
    			t16 = text("\r\n      The rights approved to you in these Terms are subject to the following\r\n      restrictions: (a) you shall not sell, rent, lease, transfer, assign,\r\n      distribute, host, or otherwise commercially exploit the Site; (b) you\r\n      shall not change, make derivative works of, disassemble, reverse compile\r\n      or reverse engineer any part of the Site; (c) you shall not access the\r\n      Site in order to build a similar or competitive website; and (d) except as\r\n      expressly stated herein, no part of the Site may be copied, reproduced,\r\n      distributed, republished, downloaded, displayed, posted or transmitted in\r\n      any form or by any means unless otherwise indicated, any future release,\r\n      update, or other addition to functionality of the Site shall be subject to\r\n      these Terms.  All copyright and other proprietary notices on the Site must\r\n      be retained on all copies thereof.");
    			t17 = space();
    			p6 = element("p");
    			p6.textContent = "Company reserves the right to change, suspend, or cease the Site with or\r\n      without notice to you.  You approved that Company will not be held liable\r\n      to you or any third-party for any change, interruption, or termination of\r\n      the Site or any part.";
    			t19 = space();
    			p7 = element("p");
    			strong2 = element("strong");
    			strong2.textContent = "No Support or Maintenance.";
    			t21 = text("\r\n      You agree that Company will have no obligation to provide you with any\r\n      support in connection with the Site.");
    			t22 = space();
    			p8 = element("p");
    			p8.textContent = "Excluding any User Content that you may provide, you are aware that all\r\n      the intellectual property rights, including copyrights, patents,\r\n      trademarks, and trade secrets, in the Site and its content are owned by\r\n      Company or Company’s suppliers. Note that these Terms and access to the\r\n      Site do not give you any rights, title or interest in or to any\r\n      intellectual property rights, except for the limited access rights\r\n      expressed in Section 2.1. Company and its suppliers reserve all rights not\r\n      granted in these Terms.";
    			t24 = space();
    			h21 = element("h2");
    			h21.textContent = "Third-Party Links & Ads; Other Users";
    			t26 = space();
    			div2 = element("div");
    			p9 = element("p");
    			strong3 = element("strong");
    			strong3.textContent = "Third-Party Links & Ads.";
    			t28 = text("\r\n      The Site may contain links to third-party websites and services, and/or\r\n      display advertisements for third-parties.  Such Third-Party Links & Ads\r\n      are not under the control of Company, and Company is not responsible for\r\n      any Third-Party Links & Ads.  Company provides access to these Third-Party\r\n      Links & Ads only as a convenience to you, and does not review, approve,\r\n      monitor, endorse, warrant, or make any representations with respect to\r\n      Third-Party Links & Ads.  You use all Third-Party Links & Ads at your own\r\n      risk, and should apply a suitable level of caution and discretion in doing\r\n      so. When you click on any of the Third-Party Links & Ads, the applicable\r\n      third party’s terms and policies apply, including the third party’s\r\n      privacy and data gathering practices.");
    			t29 = space();
    			p10 = element("p");
    			strong4 = element("strong");
    			strong4.textContent = "Other Users.";
    			t31 = text("\r\n      Each Site user is solely responsible for any and all of its own User\r\n      Content.  Because we do not control User Content, you acknowledge and\r\n      agree that we are not responsible for any User Content, whether provided\r\n      by you or by others.  You agree that Company will not be responsible for\r\n      any loss or damage incurred as the result of any such interactions.  If\r\n      there is a dispute between you and any Site user, we are under no\r\n      obligation to become involved.");
    			t32 = space();
    			p11 = element("p");
    			p11.textContent = "You hereby release and forever discharge the Company and our officers,\r\n      employees, agents, successors, and assigns from, and hereby waive and\r\n      relinquish, each and every past, present and future dispute, claim,\r\n      controversy, demand, right, obligation, liability, action and cause of\r\n      action of every kind and nature, that has arisen or arises directly or\r\n      indirectly out of, or that relates directly or indirectly to, the Site. If\r\n      you are a California resident, you hereby waive California civil code\r\n      section 1542 in connection with the foregoing, which states: \"a general\r\n      release does not extend to claims which the creditor does not know or\r\n      suspect to exist in his or her favor at the time of executing the release,\r\n      which if known by him or her must have materially affected his or her\r\n      settlement with the debtor.\"";
    			t34 = space();
    			p12 = element("p");
    			strong5 = element("strong");
    			strong5.textContent = "Cookies and Web Beacons.";
    			t36 = text("\r\n      Like any other website, AniApi uses ‘cookies’. These cookies are used to\r\n      store information including visitors’ preferences, and the pages on the\r\n      website that the visitor accessed or visited. The information is used to\r\n      optimize the users’ experience by customizing our web page content based\r\n      on visitors’ browser type and/or other information.");
    			t37 = space();
    			p13 = element("p");
    			strong6 = element("strong");
    			strong6.textContent = "Google DoubleClick DART Cookie.";
    			t39 = text("\r\n      Google is one of a third-party vendor on our site. It also uses cookies,\r\n      known as DART cookies, to serve ads to our site visitors based upon their\r\n      visit to www.website.com and other sites on the internet. However,\r\n      visitors may choose to decline the use of DART cookies by visiting the\r\n      Google ad and content network Privacy Policy at the following URL –\r\n      ");
    			a0 = element("a");
    			a0.textContent = "https://policies.google.com/technologies/ads";
    			t41 = space();
    			h22 = element("h2");
    			h22.textContent = "Disclaimers";
    			t43 = space();
    			div3 = element("div");
    			p14 = element("p");
    			p14.textContent = "The site is provided on an \"as-is\" and \"as available\" basis, and company\r\n      and our suppliers expressly disclaim any and all warranties and conditions\r\n      of any kind, whether express, implied, or statutory, including all\r\n      warranties or conditions of merchantability, fitness for a particular\r\n      purpose, title, quiet enjoyment, accuracy, or non-infringement.  We and\r\n      our suppliers make not guarantee that the site will meet your\r\n      requirements, will be available on an uninterrupted, timely, secure, or\r\n      error-free basis, or will be accurate, reliable, free of viruses or other\r\n      harmful code, complete, legal, or safe.  If applicable law requires any\r\n      warranties with respect to the site, all such warranties are limited in\r\n      duration to ninety (90) days from the date of first use.";
    			t45 = space();
    			p15 = element("p");
    			p15.textContent = "Some jurisdictions do not allow the exclusion of implied warranties, so\r\n      the above exclusion may not apply to you.  Some jurisdictions do not allow\r\n      limitations on how long an implied warranty lasts, so the above limitation\r\n      may not apply to you.";
    			t47 = space();
    			h23 = element("h2");
    			h23.textContent = "Limitation on Liability";
    			t49 = space();
    			div4 = element("div");
    			p16 = element("p");
    			p16.textContent = "To the maximum extent permitted by law, in no event shall company or our\r\n      suppliers be liable to you or any third-party for any lost profits, lost\r\n      data, costs of procurement of substitute products, or any indirect,\r\n      consequential, exemplary, incidental, special or punitive damages arising\r\n      from or relating to these terms or your use of, or incapability to use the\r\n      site even if company has been advised of the possibility of such damages. \r\n      Access to and use of the site is at your own discretion and risk, and you\r\n      will be solely responsible for any damage to your device or computer\r\n      system, or loss of data resulting therefrom.";
    			t51 = space();
    			p17 = element("p");
    			p17.textContent = "To the maximum extent permitted by law, notwithstanding anything to the\r\n      contrary contained herein, our liability to you for any damages arising\r\n      from or related to this agreement, will at all times be limited to a\r\n      maximum of fifty U.S. dollars (u.s. $50). The existence of more than one\r\n      claim will not enlarge this limit.  You agree that our suppliers will have\r\n      no liability of any kind arising from or relating to this agreement.";
    			t53 = space();
    			p18 = element("p");
    			p18.textContent = "Some jurisdictions do not allow the limitation or exclusion of liability\r\n      for incidental or consequential damages, so the above limitation or\r\n      exclusion may not apply to you.";
    			t55 = space();
    			p19 = element("p");
    			strong7 = element("strong");
    			strong7.textContent = "Term and Termination.";
    			t57 = text("\r\n      Subject to this Section, these Terms will remain in full force and effect\r\n      while you use the Site.  We may suspend or terminate your rights to use\r\n      the Site at any time for any reason at our sole discretion, including for\r\n      any use of the Site in violation of these Terms.  Upon termination of your\r\n      rights under these Terms, your Account and right to access and use the\r\n      Site will terminate immediately.  You understand that any termination of\r\n      your Account may involve deletion of your User Content associated with\r\n      your Account from our live databases.  Company will not have any liability\r\n      whatsoever to you for any termination of your rights under these Terms. \r\n      Even after your rights under these Terms are terminated, the following\r\n      provisions of these Terms will remain in effect: Sections 2 through 2.5,\r\n      Section 3 and Sections 4 through 10.");
    			t58 = space();
    			h24 = element("h2");
    			h24.textContent = "Copyright Policy";
    			t60 = space();
    			div5 = element("div");
    			p20 = element("p");
    			p20.textContent = "Company respects the intellectual property of others and asks that users\r\n      of our Site do the same.  In connection with our Site, we have adopted and\r\n      implemented a policy respecting copyright law that provides for the\r\n      removal of any infringing materials and for the termination of users of\r\n      our online Site who are repeated infringers of intellectual property\r\n      rights, including copyrights.  If you believe that one of our users is,\r\n      through the use of our Site, unlawfully infringing the copyright(s) in a\r\n      work, and wish to have the allegedly infringing material removed, the\r\n      following information in the form of a written notification (pursuant to\r\n      17 U.S.C. § 512(c)) must be provided to our designated Copyright Agent:";
    			t62 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			li0.textContent = "your physical or electronic signature;";
    			t64 = space();
    			li1 = element("li");
    			li1.textContent = "identification of the copyrighted work(s) that you claim to have been\r\n        infringed;";
    			t66 = space();
    			li2 = element("li");
    			li2.textContent = "identification of the material on our services that you claim is\r\n        infringing and that you request us to remove;";
    			t68 = space();
    			li3 = element("li");
    			li3.textContent = "sufficient information to permit us to locate such material;";
    			t70 = space();
    			li4 = element("li");
    			li4.textContent = "your address, telephone number, and e-mail address;";
    			t72 = space();
    			li5 = element("li");
    			li5.textContent = "a statement that you have a good faith belief that use of the\r\n        objectionable material is not authorized by the copyright owner, its\r\n        agent, or under the law; and";
    			t74 = space();
    			li6 = element("li");
    			li6.textContent = "a statement that the information in the notification is accurate, and\r\n        under penalty of perjury, that you are either the owner of the copyright\r\n        that has allegedly been infringed or that you are authorized to act on\r\n        behalf of the copyright owner.";
    			t76 = space();
    			p21 = element("p");
    			p21.textContent = "Please note that, pursuant to 17 U.S.C. § 512(f), any misrepresentation of\r\n      material fact in a written notification automatically subjects the\r\n      complaining party to liability for any damages, costs and attorney’s fees\r\n      incurred by us in connection with the written notification and allegation\r\n      of copyright infringement.";
    			t78 = space();
    			h25 = element("h2");
    			h25.textContent = "General";
    			t80 = space();
    			div6 = element("div");
    			p22 = element("p");
    			p22.textContent = "These Terms are subject to occasional revision, and if we make any\r\n      substantial changes, we may notify you by sending you an e-mail to the\r\n      last e-mail address you provided to us and/or by prominently posting\r\n      notice of the changes on our Site.  You are responsible for providing us\r\n      with your most current e-mail address.  In the event that the last e-mail\r\n      address that you have provided us is not valid our dispatch of the e-mail\r\n      containing such notice will nonetheless constitute effective notice of the\r\n      changes described in the notice.  Any changes to these Terms will be\r\n      effective upon the earliest of thirty (30) calendar days following our\r\n      dispatch of an e-mail notice to you or thirty (30) calendar days following\r\n      our posting of notice of the changes on our Site.  These changes will be\r\n      effective immediately for new users of our Site.  Continued use of our\r\n      Site following notice of such changes shall indicate your acknowledgement\r\n      of such changes and agreement to be bound by the terms and conditions of\r\n      such changes. Dispute Resolution. Please read this Arbitration Agreement\r\n      carefully. It is part of your contract with Company and affects your\r\n      rights.  It contains procedures for MANDATORY BINDING ARBITRATION AND A\r\n      CLASS ACTION WAIVER.";
    			t82 = space();
    			p23 = element("p");
    			strong8 = element("strong");
    			strong8.textContent = "Applicability of Arbitration Agreement.";
    			t84 = text("\r\n      All claims and disputes in connection with the Terms or the use of any\r\n      product or service provided by the Company that cannot be resolved\r\n      informally or in small claims court shall be resolved by binding\r\n      arbitration on an individual basis under the terms of this Arbitration\r\n      Agreement.  Unless otherwise agreed to, all arbitration proceedings shall\r\n      be held in English.  This Arbitration Agreement applies to you and the\r\n      Company, and to any subsidiaries, affiliates, agents, employees,\r\n      predecessors in interest, successors, and assigns, as well as all\r\n      authorized or unauthorized users or beneficiaries of services or goods\r\n      provided under the Terms.");
    			t85 = space();
    			p24 = element("p");
    			strong9 = element("strong");
    			strong9.textContent = "Notice Requirement and Informal Dispute Resolution.";
    			t87 = text("\r\n      Before either party may seek arbitration, the party must first send to the\r\n      other party a written Notice of Dispute describing the nature and basis of\r\n      the claim or dispute, and the requested relief.  A Notice to the Company\r\n      should be sent to: Italy. After the Notice is received, you and the\r\n      Company may attempt to resolve the claim or dispute informally.  If you\r\n      and the Company do not resolve the claim or dispute within thirty (30)\r\n      days after the Notice is received, either party may begin an arbitration\r\n      proceeding.  The amount of any settlement offer made by any party may not\r\n      be disclosed to the arbitrator until after the arbitrator has determined\r\n      the amount of the award to which either party is entitled.");
    			t88 = space();
    			p25 = element("p");
    			strong10 = element("strong");
    			strong10.textContent = "Arbitration Rules.";
    			t90 = text("\r\n      Arbitration shall be initiated through the American Arbitration\r\n      Association, an established alternative dispute resolution provider that\r\n      offers arbitration as set forth in this section.  If AAA is not available\r\n      to arbitrate, the parties shall agree to select an alternative ADR\r\n      Provider.  The rules of the ADR Provider shall govern all aspects of the\r\n      arbitration except to the extent such rules are in conflict with the\r\n      Terms.  The AAA Consumer Arbitration Rules governing the arbitration are\r\n      available online at adr.org or by calling the AAA at 1-800-778-7879.  The\r\n      arbitration shall be conducted by a single, neutral arbitrator.  Any\r\n      claims or disputes where the total amount of the award sought is less than\r\n      Ten Thousand U.S. Dollars (US $10,000.00) may be resolved through binding\r\n      non-appearance-based arbitration, at the option of the party seeking\r\n      relief.  For claims or disputes where the total amount of the award sought\r\n      is Ten Thousand U.S. Dollars (US $10,000.00) or more, the right to a\r\n      hearing will be determined by the Arbitration Rules.  Any hearing will be\r\n      held in a location within 100 miles of your residence, unless you reside\r\n      outside of the United States, and unless the parties agree otherwise.  If\r\n      you reside outside of the U.S., the arbitrator shall give the parties\r\n      reasonable notice of the date, time and place of any oral hearings. Any\r\n      judgment on the award rendered by the arbitrator may be entered in any\r\n      court of competent jurisdiction.  If the arbitrator grants you an award\r\n      that is greater than the last settlement offer that the Company made to\r\n      you prior to the initiation of arbitration, the Company will pay you the\r\n      greater of the award or $2,500.00.  Each party shall bear its own costs\r\n      and disbursements arising out of the arbitration and shall pay an equal\r\n      share of the fees and costs of the ADR Provider.");
    			t91 = space();
    			p26 = element("p");
    			strong11 = element("strong");
    			strong11.textContent = "Additional Rules for Non-Appearance Based Arbitration.";
    			t93 = text("\r\n      If non-appearance based arbitration is elected, the arbitration shall be\r\n      conducted by telephone, online and/or based solely on written submissions;\r\n      the specific manner shall be chosen by the party initiating the\r\n      arbitration.  The arbitration shall not involve any personal appearance by\r\n      the parties or witnesses unless otherwise agreed by the parties.");
    			t94 = space();
    			p27 = element("p");
    			strong12 = element("strong");
    			strong12.textContent = "Time Limits.";
    			t96 = text("\r\n      If you or the Company pursues arbitration, the arbitration action must be\r\n      initiated and/or demanded within the statute of limitations and within any\r\n      deadline imposed under the AAA Rules for the pertinent claim.");
    			t97 = space();
    			p28 = element("p");
    			strong13 = element("strong");
    			strong13.textContent = "Authority of Arbitrator.";
    			t99 = text("\r\n      If arbitration is initiated, the arbitrator will decide the rights and\r\n      liabilities of you and the Company, and the dispute will not be\r\n      consolidated with any other matters or joined with any other cases or\r\n      parties.  The arbitrator shall have the authority to grant motions\r\n      dispositive of all or part of any claim.  The arbitrator shall have the\r\n      authority to award monetary damages, and to grant any non-monetary remedy\r\n      or relief available to an individual under applicable law, the AAA Rules,\r\n      and the Terms.  The arbitrator shall issue a written award and statement\r\n      of decision describing the essential findings and conclusions on which the\r\n      award is based.  The arbitrator has the same authority to award relief on\r\n      an individual basis that a judge in a court of law would have.  The award\r\n      of the arbitrator is final and binding upon you and the Company.");
    			t100 = space();
    			p29 = element("p");
    			strong14 = element("strong");
    			strong14.textContent = "Waiver of Jury Trial.";
    			t102 = text("\r\n      THE PARTIES HEREBY WAIVE THEIR CONSTITUTIONAL AND STATUTORY RIGHTS TO GO\r\n      TO COURT AND HAVE A TRIAL IN FRONT OF A JUDGE OR A JURY, instead electing\r\n      that all claims and disputes shall be resolved by arbitration under this\r\n      Arbitration Agreement.  Arbitration procedures are typically more limited,\r\n      more efficient and less expensive than rules applicable in a court and are\r\n      subject to very limited review by a court.  In the event any litigation\r\n      should arise between you and the Company in any state or federal court in\r\n      a suit to vacate or enforce an arbitration award or otherwise, YOU AND THE\r\n      COMPANY WAIVE ALL RIGHTS TO A JURY TRIAL, instead electing that the\r\n      dispute be resolved by a judge.");
    			t103 = space();
    			p30 = element("p");
    			strong15 = element("strong");
    			strong15.textContent = "Waiver of Class or Consolidated Actions.";
    			t105 = text("\r\n      All claims and disputes within the scope of this arbitration agreement\r\n      must be arbitrated or litigated on an individual basis and not on a class\r\n      basis, and claims of more than one customer or user cannot be arbitrated\r\n      or litigated jointly or consolidated with those of any other customer or\r\n      user.");
    			t106 = space();
    			p31 = element("p");
    			strong16 = element("strong");
    			strong16.textContent = "Confidentiality.";
    			t108 = text("\r\n      All aspects of the arbitration proceeding shall be strictly confidential. \r\n      The parties agree to maintain confidentiality unless otherwise required by\r\n      law.  This paragraph shall not prevent a party from submitting to a court\r\n      of law any information necessary to enforce this Agreement, to enforce an\r\n      arbitration award, or to seek injunctive or equitable relief.");
    			t109 = space();
    			p32 = element("p");
    			strong17 = element("strong");
    			strong17.textContent = "Severability.";
    			t111 = text("\r\n      If any part or parts of this Arbitration Agreement are found under the law\r\n      to be invalid or unenforceable by a court of competent jurisdiction, then\r\n      such specific part or parts shall be of no force and effect and shall be\r\n      severed and the remainder of the Agreement shall continue in full force\r\n      and effect.");
    			t112 = space();
    			p33 = element("p");
    			strong18 = element("strong");
    			strong18.textContent = "Right to Waive.";
    			t114 = text("\r\n      Any or all of the rights and limitations set forth in this Arbitration\r\n      Agreement may be waived by the party against whom the claim is asserted. \r\n      Such waiver shall not waive or affect any other portion of this\r\n      Arbitration Agreement.");
    			t115 = space();
    			p34 = element("p");
    			strong19 = element("strong");
    			strong19.textContent = "Survival of Agreement.";
    			t117 = text("\r\n      This Arbitration Agreement will survive the termination of your\r\n      relationship with Company.");
    			t118 = space();
    			p35 = element("p");
    			strong20 = element("strong");
    			strong20.textContent = "Small Claims Court.";
    			t120 = text("\r\n      Nonetheless the foregoing, either you or the Company may bring an\r\n      individual action in small claims court.");
    			t121 = space();
    			p36 = element("p");
    			strong21 = element("strong");
    			strong21.textContent = "Emergency Equitable Relief.";
    			t123 = text("\r\n      Anyhow the foregoing, either party may seek emergency equitable relief\r\n      before a state or federal court in order to maintain the status quo\r\n      pending arbitration.  A request for interim measures shall not be deemed a\r\n      waiver of any other rights or obligations under this Arbitration\r\n      Agreement.");
    			t124 = space();
    			p37 = element("p");
    			strong22 = element("strong");
    			strong22.textContent = "Claims Not Subject to Arbitration.";
    			t126 = text("\r\n      Notwithstanding the foregoing, claims of defamation, violation of the\r\n      Computer Fraud and Abuse Act, and infringement or misappropriation of the\r\n      other party’s patent, copyright, trademark or trade secrets shall not be\r\n      subject to this Arbitration Agreement.");
    			t127 = space();
    			p38 = element("p");
    			p38.textContent = "In any circumstances where the foregoing Arbitration Agreement permits the\r\n      parties to litigate in court, the parties hereby agree to submit to the\r\n      personal jurisdiction of the courts located within Netherlands County,\r\n      California, for such purposes.";
    			t129 = space();
    			p39 = element("p");
    			p39.textContent = "The Site may be subject to U.S. export control laws and may be subject to\r\n      export or import regulations in other countries. You agree not to export,\r\n      re-export, or transfer, directly or indirectly, any U.S. technical data\r\n      acquired from Company, or any products utilizing such data, in violation\r\n      of the United States export laws or regulations.";
    			t131 = space();
    			p40 = element("p");
    			p40.textContent = "Company is located at the address in Section 10.8. If you are a California\r\n      resident, you may report complaints to the Complaint Assistance Unit of\r\n      the Division of Consumer Product of the California Department of Consumer\r\n      Affairs by contacting them in writing at 400 R Street, Sacramento, CA\r\n      95814, or by telephone at (800) 952-5210.";
    			t133 = space();
    			p41 = element("p");
    			strong23 = element("strong");
    			strong23.textContent = "Electronic Communications.";
    			t135 = text("\r\n      The communications between you and Company use electronic means, whether\r\n      you use the Site or send us emails, or whether Company posts notices on\r\n      the Site or communicates with you via email. For contractual purposes, you\r\n      (a) consent to receive communications from Company in an electronic form;\r\n      and (b) agree that all terms and conditions, agreements, notices,\r\n      disclosures, and other communications that Company provides to you\r\n      electronically satisfy any legal obligation that such communications would\r\n      satisfy if it were be in a hard copy writing.");
    			t136 = space();
    			p42 = element("p");
    			strong24 = element("strong");
    			strong24.textContent = "Entire Terms.";
    			t138 = text("\r\n      These Terms constitute the entire agreement between you and us regarding\r\n      the use of the Site. Our failure to exercise or enforce any right or\r\n      provision of these Terms shall not operate as a waiver of such right or\r\n      provision. The section titles in these Terms are for convenience only and\r\n      have no legal or contractual effect. The word \"including\" means \"including\r\n      without limitation\". If any provision of these Terms is held to be invalid\r\n      or unenforceable, the other provisions of these Terms will be unimpaired\r\n      and the invalid or unenforceable provision will be deemed modified so that\r\n      it is valid and enforceable to the maximum extent permitted by law.  Your\r\n      relationship to Company is that of an independent contractor, and neither\r\n      party is an agent or partner of the other.  These Terms, and your rights\r\n      and obligations herein, may not be assigned, subcontracted, delegated, or\r\n      otherwise transferred by you without Company’s prior written consent, and\r\n      any attempted assignment, subcontract, delegation, or transfer in\r\n      violation of the foregoing will be null and void.  Company may freely\r\n      assign these Terms.  The terms and conditions set forth in these Terms\r\n      shall be binding upon assignees.");
    			t139 = space();
    			p43 = element("p");
    			strong25 = element("strong");
    			strong25.textContent = "Copyright/Trademark Information.";
    			t141 = text("\r\n      Copyright ©. All rights reserved.  All trademarks, logos and service marks\r\n      displayed on the Site are our property or the property of other\r\n      third-parties. You are not permitted to use these Marks without our prior\r\n      written consent or the consent of such third party which may own the\r\n      Marks.");
    			t142 = space();
    			h26 = element("h2");
    			h26.textContent = "Contact Information";
    			t144 = space();
    			div7 = element("div");
    			p44 = element("p");
    			strong26 = element("strong");
    			strong26.textContent = "Address:";
    			t146 = text("\r\n      Italy\r\n      ");
    			br = element("br");
    			t147 = space();
    			strong27 = element("strong");
    			strong27.textContent = "Email:";
    			t149 = text("\r\n      marcodz554@gmail.com");
    			t150 = space();
    			h11 = element("h1");
    			h11.textContent = "Privacy Policy";
    			t152 = space();
    			div8 = element("div");
    			p45 = element("p");
    			p45.textContent = "At AniAPI, accessible from www.aniapi.com, one of our main priorities is\r\n      the privacy of our visitors. This Privacy Policy document contains types\r\n      of information that is collected and recorded by AniAPI and how we use it.";
    			t154 = space();
    			p46 = element("p");
    			p46.textContent = "If you have additional questions or require more information about our\r\n      Privacy Policy, do not hesitate to contact us.";
    			t156 = space();
    			p47 = element("p");
    			p47.textContent = "This Privacy Policy applies only to our online activities and is valid for\r\n      visitors to our website with regards to the information that they shared\r\n      and/or collect in AniAPI. This policy is not applicable to any information\r\n      collected offline or via channels other than this website.";
    			t158 = space();
    			h27 = element("h2");
    			h27.textContent = "Consent";
    			t160 = space();
    			div9 = element("div");
    			p48 = element("p");
    			p48.textContent = "By using our website, you hereby consent to our Privacy Policy and agree\r\n      to its terms.";
    			t162 = space();
    			h28 = element("h2");
    			h28.textContent = "Information we collect";
    			t164 = space();
    			div10 = element("div");
    			p49 = element("p");
    			p49.textContent = "The personal information that you are asked to provide, and the reasons\r\n      why you are asked to provide it, will be made clear to you at the point we\r\n      ask you to provide your personal information.";
    			t166 = space();
    			p50 = element("p");
    			p50.textContent = "If you contact us directly, we may receive additional information about\r\n      you such as your name, email address, phone number, the contents of the\r\n      message and/or attachments you may send us, and any other information you\r\n      may choose to provide.";
    			t168 = space();
    			p51 = element("p");
    			p51.textContent = "When you register for an Account, we may ask for your contact information,\r\n      including items such as name, company name, address, email address, and\r\n      telephone number.";
    			t170 = space();
    			h29 = element("h2");
    			h29.textContent = "How we use your information";
    			t172 = space();
    			div11 = element("div");
    			p52 = element("p");
    			p52.textContent = "We use the information we collect in various ways, including to:";
    			t174 = space();
    			ul1 = element("ul");
    			li7 = element("li");
    			li7.textContent = "Provide, operate, and maintain our webste";
    			t176 = space();
    			li8 = element("li");
    			li8.textContent = "Improve, personalize, and expand our webste";
    			t178 = space();
    			li9 = element("li");
    			li9.textContent = "Understand and analyze how you use our webste";
    			t180 = space();
    			li10 = element("li");
    			li10.textContent = "Develop new products, services, features, and functionality";
    			t182 = space();
    			li11 = element("li");
    			li11.textContent = "Communicate with you, either directly or through one of our partners,\r\n        including for customer service, to provide you with updates and other\r\n        information relating to the webste, and for marketing and promotional\r\n        purposes";
    			t184 = space();
    			li12 = element("li");
    			li12.textContent = "Send you emails";
    			t186 = space();
    			li13 = element("li");
    			li13.textContent = "Find and prevent fraud";
    			t188 = space();
    			h210 = element("h2");
    			h210.textContent = "Log Files";
    			t190 = space();
    			div12 = element("div");
    			p53 = element("p");
    			p53.textContent = "AniAPI follows a standard procedure of using log files. These files log\r\n      visitors when they visit websites. All hosting companies do this and a\r\n      part of hosting services' analytics. The information collected by log\r\n      files include internet protocol (IP) addresses, browser type, Internet\r\n      Service Provider (ISP), date and time stamp, referring/exit pages, and\r\n      possibly the number of clicks. These are not linked to any information\r\n      that is personally identifiable. The purpose of the information is for\r\n      analyzing trends, administering the site, tracking users' movement on the\r\n      website, and gathering demographic information.";
    			t192 = space();
    			h211 = element("h2");
    			h211.textContent = "Cookies and Web Beacons";
    			t194 = space();
    			div13 = element("div");
    			p54 = element("p");
    			p54.textContent = "Like any other website, AniAPI uses 'cookies'. These cookies are used to\r\n      store information including visitors' preferences, and the pages on the\r\n      website that the visitor accessed or visited. The information is used to\r\n      optimize the users' experience by customizing our web page content based\r\n      on visitors' browser type and/or other information.";
    			t196 = space();
    			p55 = element("p");
    			t197 = text("For more general information on cookies, please read\r\n      ");
    			a1 = element("a");
    			a1.textContent = "\"What Are Cookies\"";
    			t199 = text("\r\n      .");
    			t200 = space();
    			h212 = element("h2");
    			h212.textContent = "Google DoubleClick DART Cookie";
    			t202 = space();
    			div14 = element("div");
    			p56 = element("p");
    			t203 = text("Google is one of a third-party vendor on our site. It also uses cookies,\r\n      known as DART cookies, to serve ads to our site visitors based upon their\r\n      visit to www.website.com and other sites on the internet. However,\r\n      visitors may choose to decline the use of DART cookies by visiting the\r\n      Google ad and content network Privacy Policy at the following URL –\r\n      ");
    			a2 = element("a");
    			a2.textContent = "https://policies.google.com/technologies/ads";
    			t205 = space();
    			h213 = element("h2");
    			h213.textContent = "Advertising Partners Privacy Policies";
    			t207 = space();
    			div15 = element("div");
    			p57 = element("p");
    			p57.textContent = "You may consult this list to find the Privacy Policy for each of the\r\n      advertising partners of AniAPI.";
    			t209 = space();
    			p58 = element("p");
    			p58.textContent = "Third-party ad servers or ad networks uses technologies like cookies,\r\n      JavaScript, or Web Beacons that are used in their respective\r\n      advertisements and links that appear on AniAPI, which are sent directly to\r\n      users' browser. They automatically receive your IP address when this\r\n      occurs. These technologies are used to measure the effectiveness of their\r\n      advertising campaigns and/or to personalize the advertising content that\r\n      you see on websites that you visit.";
    			t211 = space();
    			p59 = element("p");
    			p59.textContent = "Note that AniAPI has no access to or control over these cookies that are\r\n      used by third-party advertisers.";
    			t213 = space();
    			h214 = element("h2");
    			h214.textContent = "Third Party Privacy Policies";
    			t215 = space();
    			div16 = element("div");
    			p60 = element("p");
    			p60.textContent = "AniAPI's Privacy Policy does not apply to other advertisers or websites.\r\n      Thus, we are advising you to consult the respective Privacy Policies of\r\n      these third-party ad servers for more detailed information. It may include\r\n      their practices and instructions about how to opt-out of certain options.";
    			t217 = space();
    			p61 = element("p");
    			p61.textContent = "You can choose to disable cookies through your individual browser options.\r\n      To know more detailed information about cookie management with specific\r\n      web browsers, it can be found at the browsers' respective websites.";
    			t219 = space();
    			h215 = element("h2");
    			h215.textContent = "CCPA Privacy Rights (Do Not Sell My Personal Information)";
    			t221 = space();
    			div17 = element("div");
    			p62 = element("p");
    			p62.textContent = "Under the CCPA, among other rights, California consumers have the right\r\n      to:";
    			t223 = space();
    			p63 = element("p");
    			p63.textContent = "Request that a business that collects a consumer's personal data disclose\r\n      the categories and specific pieces of personal data that a business has\r\n      collected about consumers.";
    			t225 = space();
    			p64 = element("p");
    			p64.textContent = "Request that a business delete any personal data about the consumer that a\r\n      business has collected.";
    			t227 = space();
    			p65 = element("p");
    			p65.textContent = "Request that a business that sells a consumer's personal data, not sell\r\n      the consumer's personal data.";
    			t229 = space();
    			p66 = element("p");
    			p66.textContent = "If you make a request, we have one month to respond to you. If you would\r\n      like to exercise any of these rights, please contact us.";
    			t231 = space();
    			h216 = element("h2");
    			h216.textContent = "GDPR Data Protection Rights";
    			t233 = space();
    			div18 = element("div");
    			p67 = element("p");
    			p67.textContent = "We would like to make sure you are fully aware of all of your data\r\n      protection rights. Every user is entitled to the following:";
    			t235 = space();
    			p68 = element("p");
    			p68.textContent = "The right to access – You have the right to request copies of your\r\n      personal data. We may charge you a small fee for this service.";
    			t237 = space();
    			p69 = element("p");
    			p69.textContent = "The right to rectification – You have the right to request that we correct\r\n      any information you believe is inaccurate. You also have the right to\r\n      request that we complete the information you believe is incomplete.";
    			t239 = space();
    			p70 = element("p");
    			p70.textContent = "The right to erasure – You have the right to request that we erase your\r\n      personal data, under certain conditions.";
    			t241 = space();
    			p71 = element("p");
    			p71.textContent = "The right to restrict processing – You have the right to request that we\r\n      restrict the processing of your personal data, under certain conditions.";
    			t243 = space();
    			p72 = element("p");
    			p72.textContent = "The right to object to processing – You have the right to object to our\r\n      processing of your personal data, under certain conditions.";
    			t245 = space();
    			p73 = element("p");
    			p73.textContent = "The right to data portability – You have the right to request that we\r\n      transfer the data that we have collected to another organization, or\r\n      directly to you, under certain conditions.";
    			t247 = space();
    			p74 = element("p");
    			p74.textContent = "If you make a request, we have one month to respond to you. If you would\r\n      like to exercise any of these rights, please contact us.";
    			t249 = space();
    			h217 = element("h2");
    			h217.textContent = "Children's Information";
    			t251 = space();
    			div19 = element("div");
    			p75 = element("p");
    			p75.textContent = "Another part of our priority is adding protection for children while using\r\n      the internet. We encourage parents and guardians to observe, participate\r\n      in, and/or monitor and guide their online activity.";
    			t253 = space();
    			p76 = element("p");
    			p76.textContent = "AniAPI does not knowingly collect any Personal Identifiable Information\r\n      from children under the age of 13. If you think that your child provided\r\n      this kind of information on our website, we strongly encourage you to\r\n      contact us immediately and we will do our best efforts to promptly remove\r\n      such information from our records.";
    			attr_dev(h10, "class", "svelte-3qinq9");
    			add_location(h10, file$l, 47, 2, 674);
    			attr_dev(p0, "class", "svelte-3qinq9");
    			add_location(p0, file$l, 49, 4, 726);
    			attr_dev(p1, "class", "svelte-3qinq9");
    			add_location(p1, file$l, 55, 4, 1023);
    			attr_dev(p2, "class", "svelte-3qinq9");
    			add_location(p2, file$l, 59, 4, 1153);
    			attr_dev(p3, "class", "svelte-3qinq9");
    			add_location(p3, file$l, 67, 4, 1626);
    			attr_dev(div0, "class", "section svelte-3qinq9");
    			add_location(div0, file$l, 48, 2, 699);
    			attr_dev(h20, "class", "svelte-3qinq9");
    			add_location(h20, file$l, 73, 2, 1845);
    			add_location(strong0, file$l, 76, 6, 1914);
    			attr_dev(p4, "class", "svelte-3qinq9");
    			add_location(p4, file$l, 75, 4, 1903);
    			add_location(strong1, file$l, 82, 6, 2151);
    			attr_dev(p5, "class", "svelte-3qinq9");
    			add_location(p5, file$l, 81, 4, 2140);
    			attr_dev(p6, "class", "svelte-3qinq9");
    			add_location(p6, file$l, 96, 4, 3122);
    			add_location(strong2, file$l, 103, 6, 3423);
    			attr_dev(p7, "class", "svelte-3qinq9");
    			add_location(p7, file$l, 102, 4, 3412);
    			attr_dev(p8, "class", "svelte-3qinq9");
    			add_location(p8, file$l, 107, 4, 3604);
    			attr_dev(div1, "class", "section svelte-3qinq9");
    			add_location(div1, file$l, 74, 2, 1876);
    			attr_dev(h21, "class", "svelte-3qinq9");
    			add_location(h21, file$l, 118, 2, 4198);
    			add_location(strong3, file$l, 121, 6, 4285);
    			attr_dev(p9, "class", "svelte-3qinq9");
    			add_location(p9, file$l, 120, 4, 4274);
    			add_location(strong4, file$l, 135, 6, 5193);
    			attr_dev(p10, "class", "svelte-3qinq9");
    			add_location(p10, file$l, 134, 4, 5182);
    			attr_dev(p11, "class", "svelte-3qinq9");
    			add_location(p11, file$l, 144, 4, 5741);
    			add_location(strong5, file$l, 159, 6, 6667);
    			attr_dev(p12, "class", "svelte-3qinq9");
    			add_location(p12, file$l, 158, 4, 6656);
    			add_location(strong6, file$l, 167, 6, 7113);
    			attr_dev(a0, "href", "https://policies.google.com/technologies/ads");
    			attr_dev(a0, "class", "svelte-3qinq9");
    			add_location(a0, file$l, 173, 6, 7557);
    			attr_dev(p13, "class", "svelte-3qinq9");
    			add_location(p13, file$l, 166, 4, 7102);
    			attr_dev(div2, "class", "section svelte-3qinq9");
    			add_location(div2, file$l, 119, 2, 4247);
    			attr_dev(h22, "class", "svelte-3qinq9");
    			add_location(h22, file$l, 178, 2, 7702);
    			attr_dev(p14, "class", "svelte-3qinq9");
    			add_location(p14, file$l, 180, 4, 7753);
    			attr_dev(p15, "class", "svelte-3qinq9");
    			add_location(p15, file$l, 193, 4, 8615);
    			attr_dev(div3, "class", "section svelte-3qinq9");
    			add_location(div3, file$l, 179, 2, 7726);
    			attr_dev(h23, "class", "svelte-3qinq9");
    			add_location(h23, file$l, 200, 2, 8914);
    			attr_dev(p16, "class", "svelte-3qinq9");
    			add_location(p16, file$l, 202, 4, 8977);
    			attr_dev(p17, "class", "svelte-3qinq9");
    			add_location(p17, file$l, 213, 4, 9685);
    			attr_dev(p18, "class", "svelte-3qinq9");
    			add_location(p18, file$l, 221, 4, 10176);
    			add_location(strong7, file$l, 227, 6, 10400);
    			attr_dev(p19, "class", "svelte-3qinq9");
    			add_location(p19, file$l, 226, 4, 10389);
    			attr_dev(div4, "class", "section svelte-3qinq9");
    			add_location(div4, file$l, 201, 2, 8950);
    			attr_dev(h24, "class", "svelte-3qinq9");
    			add_location(h24, file$l, 242, 2, 11385);
    			attr_dev(p20, "class", "svelte-3qinq9");
    			add_location(p20, file$l, 244, 4, 11441);
    			add_location(li0, file$l, 257, 6, 12259);
    			add_location(li1, file$l, 258, 6, 12314);
    			add_location(li2, file$l, 262, 6, 12438);
    			add_location(li3, file$l, 266, 6, 12592);
    			add_location(li4, file$l, 267, 6, 12669);
    			add_location(li5, file$l, 268, 6, 12737);
    			add_location(li6, file$l, 273, 6, 12949);
    			add_location(ul0, file$l, 256, 4, 12247);
    			attr_dev(p21, "class", "svelte-3qinq9");
    			add_location(p21, file$l, 280, 4, 13264);
    			attr_dev(div5, "class", "section svelte-3qinq9");
    			add_location(div5, file$l, 243, 2, 11414);
    			attr_dev(h25, "class", "svelte-3qinq9");
    			add_location(h25, file$l, 288, 2, 13643);
    			attr_dev(p22, "class", "svelte-3qinq9");
    			add_location(p22, file$l, 290, 4, 13690);
    			add_location(strong8, file$l, 311, 6, 15090);
    			attr_dev(p23, "class", "svelte-3qinq9");
    			add_location(p23, file$l, 310, 4, 15079);
    			add_location(strong9, file$l, 324, 6, 15890);
    			attr_dev(p24, "class", "svelte-3qinq9");
    			add_location(p24, file$l, 323, 4, 15879);
    			add_location(strong10, file$l, 337, 6, 16768);
    			attr_dev(p25, "class", "svelte-3qinq9");
    			add_location(p25, file$l, 336, 4, 16757);
    			add_location(strong11, file$l, 366, 6, 18854);
    			attr_dev(p26, "class", "svelte-3qinq9");
    			add_location(p26, file$l, 365, 4, 18843);
    			add_location(strong12, file$l, 374, 6, 19339);
    			attr_dev(p27, "class", "svelte-3qinq9");
    			add_location(p27, file$l, 373, 4, 19328);
    			add_location(strong13, file$l, 380, 6, 19627);
    			attr_dev(p28, "class", "svelte-3qinq9");
    			add_location(p28, file$l, 379, 4, 19616);
    			add_location(strong14, file$l, 395, 6, 20632);
    			attr_dev(p29, "class", "svelte-3qinq9");
    			add_location(p29, file$l, 394, 4, 20621);
    			add_location(strong15, file$l, 408, 6, 21458);
    			attr_dev(p30, "class", "svelte-3qinq9");
    			add_location(p30, file$l, 407, 4, 21447);
    			add_location(strong16, file$l, 416, 6, 21874);
    			attr_dev(p31, "class", "svelte-3qinq9");
    			add_location(p31, file$l, 415, 4, 21863);
    			add_location(strong17, file$l, 424, 6, 22329);
    			attr_dev(p32, "class", "svelte-3qinq9");
    			add_location(p32, file$l, 423, 4, 22318);
    			add_location(strong18, file$l, 432, 6, 22727);
    			attr_dev(p33, "class", "svelte-3qinq9");
    			add_location(p33, file$l, 431, 4, 22716);
    			add_location(strong19, file$l, 439, 6, 23046);
    			attr_dev(p34, "class", "svelte-3qinq9");
    			add_location(p34, file$l, 438, 4, 23035);
    			add_location(strong20, file$l, 444, 6, 23217);
    			attr_dev(p35, "class", "svelte-3qinq9");
    			add_location(p35, file$l, 443, 4, 23206);
    			add_location(strong21, file$l, 449, 6, 23401);
    			attr_dev(p36, "class", "svelte-3qinq9");
    			add_location(p36, file$l, 448, 4, 23390);
    			add_location(strong22, file$l, 457, 6, 23797);
    			attr_dev(p37, "class", "svelte-3qinq9");
    			add_location(p37, file$l, 456, 4, 23786);
    			attr_dev(p38, "class", "svelte-3qinq9");
    			add_location(p38, file$l, 463, 4, 24148);
    			attr_dev(p39, "class", "svelte-3qinq9");
    			add_location(p39, file$l, 469, 4, 24444);
    			attr_dev(p40, "class", "svelte-3qinq9");
    			add_location(p40, file$l, 476, 4, 24840);
    			add_location(strong23, file$l, 484, 6, 25238);
    			attr_dev(p41, "class", "svelte-3qinq9");
    			add_location(p41, file$l, 483, 4, 25227);
    			add_location(strong24, file$l, 495, 6, 25912);
    			attr_dev(p42, "class", "svelte-3qinq9");
    			add_location(p42, file$l, 494, 4, 25901);
    			add_location(strong25, file$l, 515, 6, 27283);
    			attr_dev(p43, "class", "svelte-3qinq9");
    			add_location(p43, file$l, 514, 4, 27272);
    			attr_dev(div6, "class", "section svelte-3qinq9");
    			add_location(div6, file$l, 289, 2, 13663);
    			attr_dev(h26, "class", "svelte-3qinq9");
    			add_location(h26, file$l, 523, 2, 27680);
    			add_location(strong26, file$l, 526, 6, 27750);
    			add_location(br, file$l, 528, 6, 27796);
    			add_location(strong27, file$l, 529, 6, 27810);
    			attr_dev(p44, "class", "svelte-3qinq9");
    			add_location(p44, file$l, 525, 4, 27739);
    			attr_dev(div7, "class", "section svelte-3qinq9");
    			add_location(div7, file$l, 524, 2, 27712);
    			set_style(h11, "margin-top", "48px");
    			attr_dev(h11, "class", "svelte-3qinq9");
    			add_location(h11, file$l, 533, 2, 27885);
    			attr_dev(p45, "class", "svelte-3qinq9");
    			add_location(p45, file$l, 535, 4, 27963);
    			attr_dev(p46, "class", "svelte-3qinq9");
    			add_location(p46, file$l, 540, 4, 28224);
    			attr_dev(p47, "class", "svelte-3qinq9");
    			add_location(p47, file$l, 544, 4, 28375);
    			attr_dev(div8, "class", "section svelte-3qinq9");
    			add_location(div8, file$l, 534, 2, 27936);
    			attr_dev(h27, "class", "svelte-3qinq9");
    			add_location(h27, file$l, 551, 2, 28712);
    			attr_dev(p48, "class", "svelte-3qinq9");
    			add_location(p48, file$l, 553, 4, 28759);
    			attr_dev(div9, "class", "section svelte-3qinq9");
    			add_location(div9, file$l, 552, 2, 28732);
    			attr_dev(h28, "class", "svelte-3qinq9");
    			add_location(h28, file$l, 558, 2, 28887);
    			attr_dev(p49, "class", "svelte-3qinq9");
    			add_location(p49, file$l, 560, 4, 28949);
    			attr_dev(p50, "class", "svelte-3qinq9");
    			add_location(p50, file$l, 565, 4, 29182);
    			attr_dev(p51, "class", "svelte-3qinq9");
    			add_location(p51, file$l, 571, 4, 29470);
    			attr_dev(div10, "class", "section svelte-3qinq9");
    			add_location(div10, file$l, 559, 2, 28922);
    			attr_dev(h29, "class", "svelte-3qinq9");
    			add_location(h29, file$l, 577, 2, 29683);
    			attr_dev(p52, "class", "svelte-3qinq9");
    			add_location(p52, file$l, 579, 4, 29750);
    			add_location(li7, file$l, 581, 6, 29839);
    			add_location(li8, file$l, 582, 6, 29897);
    			add_location(li9, file$l, 583, 6, 29957);
    			add_location(li10, file$l, 584, 6, 30019);
    			add_location(li11, file$l, 585, 6, 30095);
    			add_location(li12, file$l, 591, 6, 30375);
    			add_location(li13, file$l, 592, 6, 30407);
    			add_location(ul1, file$l, 580, 4, 29827);
    			attr_dev(div11, "class", "section svelte-3qinq9");
    			add_location(div11, file$l, 578, 2, 29723);
    			attr_dev(h210, "class", "svelte-3qinq9");
    			add_location(h210, file$l, 595, 2, 30463);
    			attr_dev(p53, "class", "svelte-3qinq9");
    			add_location(p53, file$l, 597, 4, 30512);
    			attr_dev(div12, "class", "section svelte-3qinq9");
    			add_location(div12, file$l, 596, 2, 30485);
    			attr_dev(h211, "class", "svelte-3qinq9");
    			add_location(h211, file$l, 609, 2, 31221);
    			attr_dev(p54, "class", "svelte-3qinq9");
    			add_location(p54, file$l, 611, 4, 31284);
    			attr_dev(a1, "href", "https://www.cookieconsent.com/what-are-cookies/");
    			attr_dev(a1, "class", "svelte-3qinq9");
    			add_location(a1, file$l, 620, 6, 31752);
    			attr_dev(p55, "class", "svelte-3qinq9");
    			add_location(p55, file$l, 618, 4, 31681);
    			attr_dev(div13, "class", "section svelte-3qinq9");
    			add_location(div13, file$l, 610, 2, 31257);
    			attr_dev(h212, "class", "svelte-3qinq9");
    			add_location(h212, file$l, 626, 2, 31883);
    			attr_dev(a2, "href", "https://policies.google.com/technologies/ads");
    			attr_dev(a2, "class", "svelte-3qinq9");
    			add_location(a2, file$l, 634, 6, 32352);
    			attr_dev(p56, "class", "svelte-3qinq9");
    			add_location(p56, file$l, 628, 4, 31953);
    			attr_dev(div14, "class", "section svelte-3qinq9");
    			add_location(div14, file$l, 627, 2, 31926);
    			attr_dev(h213, "class", "svelte-3qinq9");
    			add_location(h213, file$l, 639, 2, 32497);
    			attr_dev(p57, "class", "svelte-3qinq9");
    			add_location(p57, file$l, 641, 4, 32574);
    			attr_dev(p58, "class", "svelte-3qinq9");
    			add_location(p58, file$l, 645, 4, 32708);
    			attr_dev(p59, "class", "svelte-3qinq9");
    			add_location(p59, file$l, 654, 4, 33234);
    			attr_dev(div15, "class", "section svelte-3qinq9");
    			add_location(div15, file$l, 640, 2, 32547);
    			attr_dev(h214, "class", "svelte-3qinq9");
    			add_location(h214, file$l, 659, 2, 33381);
    			attr_dev(p60, "class", "svelte-3qinq9");
    			add_location(p60, file$l, 661, 4, 33449);
    			attr_dev(p61, "class", "svelte-3qinq9");
    			add_location(p61, file$l, 667, 4, 33790);
    			attr_dev(div16, "class", "section svelte-3qinq9");
    			add_location(div16, file$l, 660, 2, 33422);
    			attr_dev(h215, "class", "svelte-3qinq9");
    			add_location(h215, file$l, 673, 2, 34053);
    			attr_dev(p62, "class", "svelte-3qinq9");
    			add_location(p62, file$l, 675, 4, 34150);
    			attr_dev(p63, "class", "svelte-3qinq9");
    			add_location(p63, file$l, 679, 4, 34259);
    			attr_dev(p64, "class", "svelte-3qinq9");
    			add_location(p64, file$l, 684, 4, 34472);
    			attr_dev(p65, "class", "svelte-3qinq9");
    			add_location(p65, file$l, 688, 4, 34604);
    			attr_dev(p66, "class", "svelte-3qinq9");
    			add_location(p66, file$l, 692, 4, 34739);
    			attr_dev(div17, "class", "section svelte-3qinq9");
    			add_location(div17, file$l, 674, 2, 34123);
    			attr_dev(h216, "class", "svelte-3qinq9");
    			add_location(h216, file$l, 697, 2, 34910);
    			attr_dev(p67, "class", "svelte-3qinq9");
    			add_location(p67, file$l, 699, 4, 34977);
    			attr_dev(p68, "class", "svelte-3qinq9");
    			add_location(p68, file$l, 703, 4, 35137);
    			attr_dev(p69, "class", "svelte-3qinq9");
    			add_location(p69, file$l, 707, 4, 35300);
    			attr_dev(p70, "class", "svelte-3qinq9");
    			add_location(p70, file$l, 712, 4, 35553);
    			attr_dev(p71, "class", "svelte-3qinq9");
    			add_location(p71, file$l, 716, 4, 35699);
    			attr_dev(p72, "class", "svelte-3qinq9");
    			add_location(p72, file$l, 720, 4, 35878);
    			attr_dev(p73, "class", "svelte-3qinq9");
    			add_location(p73, file$l, 724, 4, 36043);
    			attr_dev(p74, "class", "svelte-3qinq9");
    			add_location(p74, file$l, 729, 4, 36265);
    			attr_dev(div18, "class", "section svelte-3qinq9");
    			add_location(div18, file$l, 698, 2, 34950);
    			attr_dev(h217, "class", "svelte-3qinq9");
    			add_location(h217, file$l, 734, 2, 36436);
    			attr_dev(p75, "class", "svelte-3qinq9");
    			add_location(p75, file$l, 736, 4, 36498);
    			attr_dev(p76, "class", "svelte-3qinq9");
    			add_location(p76, file$l, 741, 4, 36738);
    			attr_dev(div19, "class", "section svelte-3qinq9");
    			add_location(div19, file$l, 735, 2, 36471);
    			attr_dev(main, "class", "svelte-3qinq9");
    			add_location(main, file$l, 46, 0, 664);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h10);
    			append_dev(main, t1);
    			append_dev(main, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t3);
    			append_dev(div0, p1);
    			append_dev(div0, t5);
    			append_dev(div0, p2);
    			append_dev(div0, t7);
    			append_dev(div0, p3);
    			append_dev(main, t9);
    			append_dev(main, h20);
    			append_dev(main, t11);
    			append_dev(main, div1);
    			append_dev(div1, p4);
    			append_dev(p4, strong0);
    			append_dev(p4, t13);
    			append_dev(div1, t14);
    			append_dev(div1, p5);
    			append_dev(p5, strong1);
    			append_dev(p5, t16);
    			append_dev(div1, t17);
    			append_dev(div1, p6);
    			append_dev(div1, t19);
    			append_dev(div1, p7);
    			append_dev(p7, strong2);
    			append_dev(p7, t21);
    			append_dev(div1, t22);
    			append_dev(div1, p8);
    			append_dev(main, t24);
    			append_dev(main, h21);
    			append_dev(main, t26);
    			append_dev(main, div2);
    			append_dev(div2, p9);
    			append_dev(p9, strong3);
    			append_dev(p9, t28);
    			append_dev(div2, t29);
    			append_dev(div2, p10);
    			append_dev(p10, strong4);
    			append_dev(p10, t31);
    			append_dev(div2, t32);
    			append_dev(div2, p11);
    			append_dev(div2, t34);
    			append_dev(div2, p12);
    			append_dev(p12, strong5);
    			append_dev(p12, t36);
    			append_dev(div2, t37);
    			append_dev(div2, p13);
    			append_dev(p13, strong6);
    			append_dev(p13, t39);
    			append_dev(p13, a0);
    			append_dev(main, t41);
    			append_dev(main, h22);
    			append_dev(main, t43);
    			append_dev(main, div3);
    			append_dev(div3, p14);
    			append_dev(div3, t45);
    			append_dev(div3, p15);
    			append_dev(main, t47);
    			append_dev(main, h23);
    			append_dev(main, t49);
    			append_dev(main, div4);
    			append_dev(div4, p16);
    			append_dev(div4, t51);
    			append_dev(div4, p17);
    			append_dev(div4, t53);
    			append_dev(div4, p18);
    			append_dev(div4, t55);
    			append_dev(div4, p19);
    			append_dev(p19, strong7);
    			append_dev(p19, t57);
    			append_dev(main, t58);
    			append_dev(main, h24);
    			append_dev(main, t60);
    			append_dev(main, div5);
    			append_dev(div5, p20);
    			append_dev(div5, t62);
    			append_dev(div5, ul0);
    			append_dev(ul0, li0);
    			append_dev(ul0, t64);
    			append_dev(ul0, li1);
    			append_dev(ul0, t66);
    			append_dev(ul0, li2);
    			append_dev(ul0, t68);
    			append_dev(ul0, li3);
    			append_dev(ul0, t70);
    			append_dev(ul0, li4);
    			append_dev(ul0, t72);
    			append_dev(ul0, li5);
    			append_dev(ul0, t74);
    			append_dev(ul0, li6);
    			append_dev(div5, t76);
    			append_dev(div5, p21);
    			append_dev(main, t78);
    			append_dev(main, h25);
    			append_dev(main, t80);
    			append_dev(main, div6);
    			append_dev(div6, p22);
    			append_dev(div6, t82);
    			append_dev(div6, p23);
    			append_dev(p23, strong8);
    			append_dev(p23, t84);
    			append_dev(div6, t85);
    			append_dev(div6, p24);
    			append_dev(p24, strong9);
    			append_dev(p24, t87);
    			append_dev(div6, t88);
    			append_dev(div6, p25);
    			append_dev(p25, strong10);
    			append_dev(p25, t90);
    			append_dev(div6, t91);
    			append_dev(div6, p26);
    			append_dev(p26, strong11);
    			append_dev(p26, t93);
    			append_dev(div6, t94);
    			append_dev(div6, p27);
    			append_dev(p27, strong12);
    			append_dev(p27, t96);
    			append_dev(div6, t97);
    			append_dev(div6, p28);
    			append_dev(p28, strong13);
    			append_dev(p28, t99);
    			append_dev(div6, t100);
    			append_dev(div6, p29);
    			append_dev(p29, strong14);
    			append_dev(p29, t102);
    			append_dev(div6, t103);
    			append_dev(div6, p30);
    			append_dev(p30, strong15);
    			append_dev(p30, t105);
    			append_dev(div6, t106);
    			append_dev(div6, p31);
    			append_dev(p31, strong16);
    			append_dev(p31, t108);
    			append_dev(div6, t109);
    			append_dev(div6, p32);
    			append_dev(p32, strong17);
    			append_dev(p32, t111);
    			append_dev(div6, t112);
    			append_dev(div6, p33);
    			append_dev(p33, strong18);
    			append_dev(p33, t114);
    			append_dev(div6, t115);
    			append_dev(div6, p34);
    			append_dev(p34, strong19);
    			append_dev(p34, t117);
    			append_dev(div6, t118);
    			append_dev(div6, p35);
    			append_dev(p35, strong20);
    			append_dev(p35, t120);
    			append_dev(div6, t121);
    			append_dev(div6, p36);
    			append_dev(p36, strong21);
    			append_dev(p36, t123);
    			append_dev(div6, t124);
    			append_dev(div6, p37);
    			append_dev(p37, strong22);
    			append_dev(p37, t126);
    			append_dev(div6, t127);
    			append_dev(div6, p38);
    			append_dev(div6, t129);
    			append_dev(div6, p39);
    			append_dev(div6, t131);
    			append_dev(div6, p40);
    			append_dev(div6, t133);
    			append_dev(div6, p41);
    			append_dev(p41, strong23);
    			append_dev(p41, t135);
    			append_dev(div6, t136);
    			append_dev(div6, p42);
    			append_dev(p42, strong24);
    			append_dev(p42, t138);
    			append_dev(div6, t139);
    			append_dev(div6, p43);
    			append_dev(p43, strong25);
    			append_dev(p43, t141);
    			append_dev(main, t142);
    			append_dev(main, h26);
    			append_dev(main, t144);
    			append_dev(main, div7);
    			append_dev(div7, p44);
    			append_dev(p44, strong26);
    			append_dev(p44, t146);
    			append_dev(p44, br);
    			append_dev(p44, t147);
    			append_dev(p44, strong27);
    			append_dev(p44, t149);
    			append_dev(main, t150);
    			append_dev(main, h11);
    			append_dev(main, t152);
    			append_dev(main, div8);
    			append_dev(div8, p45);
    			append_dev(div8, t154);
    			append_dev(div8, p46);
    			append_dev(div8, t156);
    			append_dev(div8, p47);
    			append_dev(main, t158);
    			append_dev(main, h27);
    			append_dev(main, t160);
    			append_dev(main, div9);
    			append_dev(div9, p48);
    			append_dev(main, t162);
    			append_dev(main, h28);
    			append_dev(main, t164);
    			append_dev(main, div10);
    			append_dev(div10, p49);
    			append_dev(div10, t166);
    			append_dev(div10, p50);
    			append_dev(div10, t168);
    			append_dev(div10, p51);
    			append_dev(main, t170);
    			append_dev(main, h29);
    			append_dev(main, t172);
    			append_dev(main, div11);
    			append_dev(div11, p52);
    			append_dev(div11, t174);
    			append_dev(div11, ul1);
    			append_dev(ul1, li7);
    			append_dev(ul1, t176);
    			append_dev(ul1, li8);
    			append_dev(ul1, t178);
    			append_dev(ul1, li9);
    			append_dev(ul1, t180);
    			append_dev(ul1, li10);
    			append_dev(ul1, t182);
    			append_dev(ul1, li11);
    			append_dev(ul1, t184);
    			append_dev(ul1, li12);
    			append_dev(ul1, t186);
    			append_dev(ul1, li13);
    			append_dev(main, t188);
    			append_dev(main, h210);
    			append_dev(main, t190);
    			append_dev(main, div12);
    			append_dev(div12, p53);
    			append_dev(main, t192);
    			append_dev(main, h211);
    			append_dev(main, t194);
    			append_dev(main, div13);
    			append_dev(div13, p54);
    			append_dev(div13, t196);
    			append_dev(div13, p55);
    			append_dev(p55, t197);
    			append_dev(p55, a1);
    			append_dev(p55, t199);
    			append_dev(main, t200);
    			append_dev(main, h212);
    			append_dev(main, t202);
    			append_dev(main, div14);
    			append_dev(div14, p56);
    			append_dev(p56, t203);
    			append_dev(p56, a2);
    			append_dev(main, t205);
    			append_dev(main, h213);
    			append_dev(main, t207);
    			append_dev(main, div15);
    			append_dev(div15, p57);
    			append_dev(div15, t209);
    			append_dev(div15, p58);
    			append_dev(div15, t211);
    			append_dev(div15, p59);
    			append_dev(main, t213);
    			append_dev(main, h214);
    			append_dev(main, t215);
    			append_dev(main, div16);
    			append_dev(div16, p60);
    			append_dev(div16, t217);
    			append_dev(div16, p61);
    			append_dev(main, t219);
    			append_dev(main, h215);
    			append_dev(main, t221);
    			append_dev(main, div17);
    			append_dev(div17, p62);
    			append_dev(div17, t223);
    			append_dev(div17, p63);
    			append_dev(div17, t225);
    			append_dev(div17, p64);
    			append_dev(div17, t227);
    			append_dev(div17, p65);
    			append_dev(div17, t229);
    			append_dev(div17, p66);
    			append_dev(main, t231);
    			append_dev(main, h216);
    			append_dev(main, t233);
    			append_dev(main, div18);
    			append_dev(div18, p67);
    			append_dev(div18, t235);
    			append_dev(div18, p68);
    			append_dev(div18, t237);
    			append_dev(div18, p69);
    			append_dev(div18, t239);
    			append_dev(div18, p70);
    			append_dev(div18, t241);
    			append_dev(div18, p71);
    			append_dev(div18, t243);
    			append_dev(div18, p72);
    			append_dev(div18, t245);
    			append_dev(div18, p73);
    			append_dev(div18, t247);
    			append_dev(div18, p74);
    			append_dev(main, t249);
    			append_dev(main, h217);
    			append_dev(main, t251);
    			append_dev(main, div19);
    			append_dev(div19, p75);
    			append_dev(div19, t253);
    			append_dev(div19, p76);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TermsPrivacy> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TermsPrivacy", $$slots, []);
    	return [];
    }

    class TermsPrivacy extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TermsPrivacy",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.23.0 */
    const file$m = "src\\App.svelte";

    // (53:2) {#if page === 'home'}
    function create_if_block_5(ctx) {
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
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(53:2) {#if page === 'home'}",
    		ctx
    	});

    	return block;
    }

    // (57:2) {#if page === 'detail'}
    function create_if_block_4$1(ctx) {
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
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(57:2) {#if page === 'detail'}",
    		ctx
    	});

    	return block;
    }

    // (61:2) {#if page === 'about'}
    function create_if_block_3$1(ctx) {
    	let current;
    	const about = new About({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(about.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(about, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(about.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(about.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(about, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(61:2) {#if page === 'about'}",
    		ctx
    	});

    	return block;
    }

    // (65:2) {#if page === 'status'}
    function create_if_block_2$6(ctx) {
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
    		id: create_if_block_2$6.name,
    		type: "if",
    		source: "(65:2) {#if page === 'status'}",
    		ctx
    	});

    	return block;
    }

    // (69:2) {#if page === 'notification'}
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
    		source: "(69:2) {#if page === 'notification'}",
    		ctx
    	});

    	return block;
    }

    // (73:2) {#if page === 'termsprivacy'}
    function create_if_block$e(ctx) {
    	let current;
    	const termsprivacy = new TermsPrivacy({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(termsprivacy.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(termsprivacy, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(termsprivacy.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(termsprivacy.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(termsprivacy, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$e.name,
    		type: "if",
    		source: "(73:2) {#if page === 'termsprivacy'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$n(ctx) {
    	let t0;
    	let main;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let current;
    	const navbar = new Navbar({ $$inline: true });
    	let if_block0 = /*page*/ ctx[0] === "home" && create_if_block_5(ctx);
    	let if_block1 = /*page*/ ctx[0] === "detail" && create_if_block_4$1(ctx);
    	let if_block2 = /*page*/ ctx[0] === "about" && create_if_block_3$1(ctx);
    	let if_block3 = /*page*/ ctx[0] === "status" && create_if_block_2$6(ctx);
    	let if_block4 = /*page*/ ctx[0] === "notification" && create_if_block_1$7(ctx);
    	let if_block5 = /*page*/ ctx[0] === "termsprivacy" && create_if_block$e(ctx);
    	const footer = new Footer({ $$inline: true });
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
    			if (if_block4) if_block4.c();
    			t5 = space();
    			if (if_block5) if_block5.c();
    			t6 = space();
    			create_component(footer.$$.fragment);
    			t7 = space();
    			create_component(videoplayer.$$.fragment);
    			add_location(main, file$m, 51, 0, 1341);
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
    			append_dev(main, t4);
    			if (if_block4) if_block4.m(main, null);
    			append_dev(main, t5);
    			if (if_block5) if_block5.m(main, null);
    			insert_dev(target, t6, anchor);
    			mount_component(footer, target, anchor);
    			insert_dev(target, t7, anchor);
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
    					if_block0 = create_if_block_5(ctx);
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
    					if_block1 = create_if_block_4$1(ctx);
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

    			if (/*page*/ ctx[0] === "about") {
    				if (if_block2) {
    					if (dirty & /*page*/ 1) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_3$1(ctx);
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
    					if_block3 = create_if_block_2$6(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(main, t4);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*page*/ ctx[0] === "notification") {
    				if (if_block4) {
    					if (dirty & /*page*/ 1) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_1$7(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(main, t5);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (/*page*/ ctx[0] === "termsprivacy") {
    				if (if_block5) {
    					if (dirty & /*page*/ 1) {
    						transition_in(if_block5, 1);
    					}
    				} else {
    					if_block5 = create_if_block$e(ctx);
    					if_block5.c();
    					transition_in(if_block5, 1);
    					if_block5.m(main, null);
    				}
    			} else if (if_block5) {
    				group_outros();

    				transition_out(if_block5, 1, 1, () => {
    					if_block5 = null;
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
    			transition_in(if_block4);
    			transition_in(if_block5);
    			transition_in(footer.$$.fragment, local);
    			transition_in(videoplayer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			transition_out(if_block5);
    			transition_out(footer.$$.fragment, local);
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
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (detaching) detach_dev(t6);
    			destroy_component(footer, detaching);
    			if (detaching) detach_dev(t7);
    			destroy_component(videoplayer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let page = get_store_value(currentPage);

    	currentPage.subscribe(newPage => {
    		$$invalidate(0, page = newPage);
    		window.scrollTo(0, 0);
    	});

    	let url = new URL(window.location.href);

    	if (url.hash !== "") {
    		let jwt = url.hash.split("access_token=")[1].split("&token_type=")[0];

    		if (jwt) {
    			getUser(jwt);
    		}
    	}

    	let user = JSON.parse(localStorage.getItem("current_user"));

    	if (user) {
    		currentUser.set(user);
    		getUserLists(user);
    	}

    	let animeId = url.searchParams.get("anime");

    	if (animeId) {
    		getAnime(parseInt(animeId), anime => {
    			currentAnime.set(anime);
    			currentPage.set("detail");
    		});
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
    		Footer,
    		Home,
    		Detail,
    		Notification,
    		Status,
    		About,
    		TermsPrivacy,
    		get: get_store_value,
    		currentPage,
    		currentUser,
    		currentAnime,
    		getUser,
    		getUserLists,
    		getAnime,
    		page,
    		url,
    		user,
    		animeId
    	});

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    		if ("url" in $$props) url = $$props.url;
    		if ("user" in $$props) user = $$props.user;
    		if ("animeId" in $$props) animeId = $$props.animeId;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
