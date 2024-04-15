/**
 * Unreact Native library
 *
 * Copyright (c) 2024 Matias Moreno
 * Published under the MIT license 
 */

import React, { useState } from 'react';

function gen_random_uuid () : string {
	let buffer : (string | (number[])) = [ ];
	for (let i=0; i<16; i++) {
		buffer.push ((Math.random()*256) | 0);
	}
	buffer[6] &= 0x0F;
	buffer[6] |= 0x40;
	buffer[8] &= 0x3F;
	buffer[8] |= 0x80;
	buffer = buffer.map (x => x.toString (16).padStart (2, '0')).join ('');
	return buffer.replace (/^(........)(....)(....)(....)(............)$/, '$1-$2-$3-$4-$5');
}

let updateUI = () => { };

const UnreactStyleProxy = {
	get (target : any, prop : string) {
		// esto funciona y me devuelve el valor correcto (testeado con console.log (rect.style.backgroundColor) ✓)
		return target.getProps().style?.[prop];
	},
	set (target : any, prop : string, value : any) {
		// esto rompe la app, se cierra inmediatamente, buscando bug...
		let props = target.getProps();
		let style = props.style || { };
		props.style = Object.assign ({ }, style, { [prop]: value });
		//target.setProps (props);	// si comento esta línea, no sólo no se rompe, además se actualiza el color de fondo mientras vamos apretando el botón... acá hay otro problema... ¿?
		// ah ya sé qué hacer
		updateUI ();	// increible, con esto anda 10 puntos, ahora me preocupa que explota con setProps... ¿?
		return value;
	}
};

interface UnreactComponent {
	appendChild (child : UnreactComponent | string) : void;
	removeChild (child : UnreactComponent | string) : void;
	insertBefore (newChild : UnreactComponent | string, referenceChild : UnreactComponent | string) : void;
	replaceChildren (...newChildren : (UnreactComponent | string)[]) : void;
}

const isUnreactComponent = Symbol();

interface UnreactComponentInternals extends UnreactComponent {
	[isUnreactComponent] : boolean;
	name : string;
	parentElement : UnreactComponent | null;
	render () : React.JSX.Element;
	renderChildren () : (string | React.JSX.Element)[];
	getProps () : any;
	setProps (newProps : any) : void;
}

function Unreact<PropsType> (
	name : string,
	render : (props : any, children: any) => React.JSX.Element,
	propNames : string[] = [ ]
) {
	let helper = function (props : any = { }) : (UnreactComponent & PropsType) {
		let key = gen_random_uuid ();
		let children : (UnreactComponent | string)[] = [ ];
		let self : UnreactComponentInternals = {
			[isUnreactComponent] : true,
			name,
			parentElement : null,
			renderChildren: () => children.map (child => (typeof child == 'string') ? child : (child as UnreactComponentInternals).render ()),
			render: () : React.JSX.Element => {
				let newProps : any = { };
				for (let key in props) {
					if (props[key][isUnreactComponent]) {
						newProps[key] = props[key].render ();
					} else {
						newProps[key] = props[key];
					}
				}
				return render ({ key, ...newProps }, self.renderChildren ());
			},
			getProps: () : any => props,
			setProps: (newProps : any) : void => {
				props = newProps;
				updateUI ();
			},
			appendChild: function (child : UnreactComponent) {
				let index = children.indexOf (child);
				if (index >= 0) {
					children.splice (index, 1);
				}
				children.push (child);
				(child as UnreactComponentInternals).parentElement = self;
				updateUI ();
			},
			removeChild: function (child : UnreactComponent) {
				let index = children.indexOf (child);
				if (index == -1) {
					return;
				}
				children.splice (index, 1);
				(child as UnreactComponentInternals).parentElement = null;
				updateUI ();
			},
			insertBefore: function (newChild : UnreactComponent, referenceChild : UnreactComponent) {
				let index = children.indexOf (referenceChild);
				if (index == -1) {
					return;
				}
				let check = children.indexOf (newChild);
				if (check >= 0) {
					children.splice (check, 1);
				}
				children.splice (index, 0, newChild);
				(newChild as UnreactComponentInternals).parentElement = self;
				updateUI ();
			},
			replaceChildren: function (...newChildren : UnreactComponent[]) {
				for (let child of children) {
					(child as UnreactComponentInternals).parentElement = null;
				}
				children = Array.from (newChildren);
				for (let child of children) {
					(child as UnreactComponentInternals).parentElement = self;
				}
				updateUI ();
			}
		};
		for (let name of propNames) {
			if (name == 'style') {
				let styleProxy = new Proxy (self, UnreactStyleProxy);
				Object.defineProperty (self, name, {
					get () {
						return styleProxy;
					},
					set (value) {
						props[name] = value;
						updateUI ();
					}
				});
				continue;
			}
			Object.defineProperty (self, name, {
				get () {
					return props[name];
				},
				set (value) {
					props[name] = value;
					updateUI ();
				}
			});
		}
		return self;
	};
	helper.name = name;
	return helper;
}

function UnreactApp (root : UnreactComponent) {
	let [ x, setX ] = useState (0);
	updateUI = () => setX (x + 1);
	return (root as UnreactComponentInternals).render ();
}

export type { UnreactComponent };
export { Unreact, UnreactApp };
