/**
 * Unreact Native library
 *
 * Copyright (c) 2024 Matias Moreno
 * Published under the MIT license 
 */

import React, { useState } from 'react';

function gen_random_uuid () : string {
	let buffer = [ ];
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
	get (target, prop) {
		// esto funciona y me devuelve el valor correcto (testeado con console.log (rect.style.backgroundColor) ✓)
		return target.getProps().style?.[prop];
	},
	set (target, prop, value) {
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

function Unreact (
	name : string,
	render : (props : any, children: any) => React.JSX.Element,
	propNames : string[] = [ ]
) {
	let helper = function (props : any = { }) {
		let key = gen_random_uuid ();
		let children = [ ];
		this.name = name;
		this.renderChildren = () => children.map (child => (typeof child == 'string') ? child : child.render ());
		this.render = () : React.JSX.Element => {
			return render ({ key, ...props }, this.renderChildren ());
		};
		this.getProps = () => props;
		this.setProps = newProps => {
			props = newProps;
			updateUI ();
		}
		this.appendChild = function (child) {
			let index = children.indexOf (child);
			if (index >= 0) {
				children.splice (index, 1);
			}
			children.push (child);
			child.parentElement = this;
			updateUI ();
		}
		this.removeChild = function (child) {
			let index = children.indexOf (child);
			if (index == -1) {
				return;
			}
			children.splice (index, 1);
			child.parentElement = null;
			updateUI ();
		}
		this.insertBefore = function (newChild, referenceChild) {
			let index = children.indexOf (referenceChild);
			if (index == -1) {
				return;
			}
			children.splice (index, 0, newChild);
			newChild.parentElement = this;
			updateUI ();
		};
		this.replaceChildren = function (...newChildren) {
			for (let child of children) {
				child.parentElement = null;
			}
			children = Array.from (newChildren);
			for (let child of children) {
				child.parentElement = this;
			}
			updateUI ();
		};
		for (let name of propNames) {
			if (name == 'style') {
				let styleProxy;
				styleProxy = new Proxy (this, UnreactStyleProxy);
				Object.defineProperty (this, name, {
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
			Object.defineProperty (this, name, {
				get () {
					return props[name];
				},
				set (value) {
					props[name] = value;
					updateUI ();
				}
			});
		}
	};
	helper.name = name;
	return helper;
}

function UnreactApp (root) {
	let [ x, setX ] = useState (0);
	updateUI = () => setX (x + 1);
	return root.render ();
}

export { Unreact, UnreactApp };
