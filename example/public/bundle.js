
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
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
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
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
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
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
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
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
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
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
        if (component.$$.fragment) {
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
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
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
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
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

    var unsplash1 = {
                placeholder: 'data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAANABQDASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAQFB//EACYQAAEDAwMDBQEAAAAAAAAAAAECAxEEBSEABgcSFDETFTJBcbH/xAAWAQEBAQAAAAAAAAAAAAAAAAABAwT/xAAZEQACAwEAAAAAAAAAAAAAAAAAEgECUTH/2gAMAwEAAhEDEQA/AMPkJldU4xdb+u+0VPKktIftqUomSrz6vkCBMap4i2udx3LvLddKGicQwlwrWgl5SVKygpxAgZIJGRrpVx2AN07at9nut6rVU7BCm3EIQHIIiFGM41LtnjWg2lUprKS4VrzjK1ON9RSkgqb6cqAkiJxMZJ1mSMLPPCWu4Sqn6px332hPWoqywoeT+6aK5GqC++0aR2WXC1Pc/KPvKT/dNCUwGsf/2Q==',
                src: 'example/public/unsplash-1.e7946b7d64b33565.jpg',
                width: 6720,
                height: 4480
            };

    var unsplash2 = {
                placeholder: 'data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAZABQDASIAAhEBAxEB/8QAGgAAAgMBAQAAAAAAAAAAAAAAAAQDBwgCBv/EACgQAAIBAwIEBgMAAAAAAAAAAAECAwAEEQUxEjJBgQYhUXGRwRMVYf/EABYBAQEBAAAAAAAAAAAAAAAAAAMBAv/EAB0RAAICAgMBAAAAAAAAAAAAAAABAhEDIRITYYH/2gAMAwEAAhEDEQA/ALsm8QSTWQdrKRj1WVSrDtikbfWonmWG70kxLjLOVx8DFUFY6/qU1mbm+1SZPPCIk539WYnyA/mfuvJ6l471G2huIP3NxeTTZVyHLKF9ATt2pMjxR1F2SEcktyVfTRmr63Yx3rrHEIV6LInCffBorHc95LcSGSUcbHrISx+TRR9ngnA6uJp51AuHfA2Vj9VABxA/iTbdtzTeo8opVOQ+1CnasR6YsykscsQaKkn5+1FaIf/Z',
                src: 'example/public/unsplash-2.4f59456198c9aaa3.jpg',
                width: 2765,
                height: 3456
            };

    let observer;
    const elements = new Map();

    const initObserver = () => {
      return new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const lazy = entry.target;
            observer.unobserve(lazy);
            if (elements.has(lazy)) {
              elements.get(lazy)();
              elements.delete(lazy);
            }
          }
        });
      })
    };

    const getObserver = () => {
      if (!'IntersectionObserver' in window) {
        throw 'IntersectionObserver not supported'
      }
      if (!observer) {
        observer = initObserver();
      }
      return observer
    };

    const observe = (element) => {
      try {
        const obs = getObserver();
        return new Promise((resolve) => {
          elements.set(element, resolve);
          obs.observe(element);
        })
      } catch (err) {
        console.warn(err);
        return true
      }
    };

    /* src\Image.svelte generated by Svelte v3.9.1 */

    const file = "src\\Image.svelte";

    function create_fragment(ctx) {
    	var div1, div0, t, img;

    	return {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = space();
    			img = element("img");
    			attr(div0, "style", ctx.tagStyle);
    			add_location(div0, file, 42, 2, 944);
    			attr(img, "src", ctx.source);
    			attr(img, "alt", ctx.alt);
    			attr(img, "class", "svelte-1bacand");
    			add_location(img, file, 43, 2, 976);
    			attr(div1, "class", "" + null_to_empty(ctx.containerClass) + " svelte-1bacand");
    			attr(div1, "style", ctx.style);
    			add_location(div1, file, 41, 0, 904);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			append(div1, t);
    			append(div1, img);
    			ctx.img_binding(img);
    		},

    		p: function update(changed, ctx) {
    			if (changed.tagStyle) {
    				attr(div0, "style", ctx.tagStyle);
    			}

    			if (changed.source) {
    				attr(img, "src", ctx.source);
    			}

    			if (changed.alt) {
    				attr(img, "alt", ctx.alt);
    			}

    			if (changed.containerClass) {
    				attr(div1, "class", "" + null_to_empty(ctx.containerClass) + " svelte-1bacand");
    			}

    			if (changed.style) {
    				attr(div1, "style", ctx.style);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div1);
    			}

    			ctx.img_binding(null);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	

      let style,
        source,
        imageEl;

      onMount(async () => {
        $$invalidate('source', source = image.placeholder);
        await observe(imageEl);
        $$invalidate('source', source = image.src);
      });

      let { image, alt, width, height } = $$props;

    	function img_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('imageEl', imageEl = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate('$$props', $$props = assign(assign({}, $$props), $$new_props));
    		if ('image' in $$new_props) $$invalidate('image', image = $$new_props.image);
    		if ('alt' in $$new_props) $$invalidate('alt', alt = $$new_props.alt);
    		if ('width' in $$new_props) $$invalidate('width', width = $$new_props.width);
    		if ('height' in $$new_props) $$invalidate('height', height = $$new_props.height);
    	};

    	let containerClass, aspectRatio, tagStyle;

    	$$self.$$.update = ($$dirty = { width: 1, height: 1, $$props: 1, image: 1, aspectRatio: 1 }) => {
    		if ($$dirty.width || $$dirty.height) { $$invalidate('style', style = `width: ${width || 'auto'}; height: ${height || 'auto'}`); }
    		$$invalidate('containerClass', containerClass = `image-container ${$$props.class || ''}`);
    		if ($$dirty.image) { $$invalidate('aspectRatio', aspectRatio = image.width / image.height); }
    		if ($$dirty.aspectRatio) { $$invalidate('tagStyle', tagStyle = `width: 100%; padding-bottom: ${100 / aspectRatio}%`); }
    	};

    	return {
    		style,
    		source,
    		imageEl,
    		image,
    		alt,
    		width,
    		height,
    		containerClass,
    		tagStyle,
    		img_binding,
    		$$props: $$props = exclude_internal_props($$props)
    	};
    }

    class Image extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["image", "alt", "width", "height"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.image === undefined && !('image' in props)) {
    			console.warn("<Image> was created without expected prop 'image'");
    		}
    		if (ctx.alt === undefined && !('alt' in props)) {
    			console.warn("<Image> was created without expected prop 'alt'");
    		}
    		if (ctx.width === undefined && !('width' in props)) {
    			console.warn("<Image> was created without expected prop 'width'");
    		}
    		if (ctx.height === undefined && !('height' in props)) {
    			console.warn("<Image> was created without expected prop 'height'");
    		}
    	}

    	get image() {
    		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get alt() {
    		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set alt(value) {
    		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Image>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Image>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* example\App.svelte generated by Svelte v3.9.1 */

    const file$1 = "example\\App.svelte";

    function create_fragment$1(ctx) {
    	var div2, h10, t1, t2, h11, t4, div1, t5, t6, div0, current;

    	var image0 = new Image({
    		props: { image: unsplash1 },
    		$$inline: true
    	});

    	var image1 = new Image({
    		props: { image: unsplash1 },
    		$$inline: true
    	});

    	var image2 = new Image({
    		props: { image: unsplash1 },
    		$$inline: true
    	});

    	var image3 = new Image({
    		props: { height: "100%", image: unsplash2 },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div2 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Example 1:";
    			t1 = space();
    			image0.$$.fragment.c();
    			t2 = space();
    			h11 = element("h1");
    			h11.textContent = "Example 2:";
    			t4 = space();
    			div1 = element("div");
    			image1.$$.fragment.c();
    			t5 = space();
    			image2.$$.fragment.c();
    			t6 = space();
    			div0 = element("div");
    			image3.$$.fragment.c();
    			add_location(h10, file$1, 31, 1, 600);
    			add_location(h11, file$1, 33, 1, 652);
    			attr(div0, "class", "bigImage svelte-1s4fr4c");
    			add_location(div0, file$1, 37, 2, 758);
    			attr(div1, "class", "grid svelte-1s4fr4c");
    			add_location(div1, file$1, 34, 1, 674);
    			attr(div2, "class", "container svelte-1s4fr4c");
    			add_location(div2, file$1, 30, 0, 574);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, h10);
    			append(div2, t1);
    			mount_component(image0, div2, null);
    			append(div2, t2);
    			append(div2, h11);
    			append(div2, t4);
    			append(div2, div1);
    			mount_component(image1, div1, null);
    			append(div1, t5);
    			mount_component(image2, div1, null);
    			append(div1, t6);
    			append(div1, div0);
    			mount_component(image3, div0, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var image0_changes = {};
    			if (changed.unsplash1) image0_changes.image = unsplash1;
    			image0.$set(image0_changes);

    			var image1_changes = {};
    			if (changed.unsplash1) image1_changes.image = unsplash1;
    			image1.$set(image1_changes);

    			var image2_changes = {};
    			if (changed.unsplash1) image2_changes.image = unsplash1;
    			image2.$set(image2_changes);

    			var image3_changes = {};
    			if (changed.unsplash2) image3_changes.image = unsplash2;
    			image3.$set(image3_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(image0.$$.fragment, local);

    			transition_in(image1.$$.fragment, local);

    			transition_in(image2.$$.fragment, local);

    			transition_in(image3.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(image0.$$.fragment, local);
    			transition_out(image1.$$.fragment, local);
    			transition_out(image2.$$.fragment, local);
    			transition_out(image3.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div2);
    			}

    			destroy_component(image0);

    			destroy_component(image1);

    			destroy_component(image2);

    			destroy_component(image3);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	

    	let { name } = $$props;

    	const writable_props = ['name'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    	};

    	return { name };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["name"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.name === undefined && !('name' in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
