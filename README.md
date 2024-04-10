# unreact-native
React Native minus the React part

## Usage

Import the library:

```tsx
import { Unreact, UnreactApp } from './Unreact';
```

Make "unreact" components from React Native ones:

```tsx
import React from 'react';
import ReactNative from 'react-native';
const View = Unreact<{ style: any }> ('View', (props, children) => <ReactNative.View {...props}>{children}</ReactNative.View>, [ 'style' ]);
const Text = Unreact<{ style : any }> ('Text', (props, children) => <ReactNative.Text {...props}>{children}</ReactNative.Text>, [ 'style' ]);
const Pressable = Unreact<{ style : any, onPress : any }> ('Pressable', (props, children) => <ReactNative.Pressable {...props}>{children}</ReactNative.Pressable>, [ 'style', 'onPress' ]);
// etc...
```

The stuff inside Unreact<...> is optional, but helps a lot with Visual Studio Code's Intellisense.

The last parameter is a list of "props" to expose. Maybe the list could be autogenerated from the corresponding .d.ts files.

Designate a main node and add all children there, for example:

```tsx
const app = View ();
const button = Pressable ();
const buttonText = Text ();
buttonText.appendChild ('Test button');
button.appendChild (buttonText);
app.appendChild (button);
button.onPress = () => {
  let time = Text ();
  time.appendChild (new Date ().toString ());
  app.appendChild (time);
};
```

You don't need to add all children at initialization, you can add them later, as demonstrated by button.onPress.

Last declare your app as usual, and use UnreactApp like this:

```tsx
function App () {
  return UnreactApp (app);
}

export default App;
```

That's everything you need. You can use any React Native component as long as you pass it through Unreact.

## API

### Unreact<PropsType> (name, render, propNames)

Returns an Unreact Component factory function.

Parameter | Type | Description
--- | --- | ---
name | string | Descriptive name
render | (props : any[], children : React.JSX.Element[]) => React.JSX.Element | Must return the React Native component
propNames | string[] | a list of props to expose

### Unreact Component factory function returned by Unreact

The returned factory function can be called with an initial set of props, for example:

```tsx
view = View ({ style: { backgroundColor: 'silver' } });
```

The factory function returns an instance of an Unreact Component with getter and setter for each prop in propNames, in addition to these methods:

Method | Parameters | Description
--- | --- | ---
appendChild | child : UnreactComponent | Append child to this component, after all other children. If it was already a child it is removed first then added after all other children.
removeChild | child : UnreactComponent | Remove child from this component. If child is not a child nothing happens.
insertBefore | newChild : UnreactComponent, referenceChild : UnreactComponent | Insert newChild before referenceChild. If newChild is already a child it is removed first then added before referenceChild. If referenceChild is not a child nothing happens.
replaceChildren | child1 : UnreactComponent, child2 : UnreactComponent, ... | Removes all current children, then adds new children. You can supply 0 parameters then all existing childs are removed.

The style prop will be handled specially, by means of a Proxy instance. Styles are immutable, but the Proxy instance allows code such as:

```tsx
button.style.backgroundColor = 'silver';
```

Any other methods are considered reserved / undocumented and may change in a future release.

### UnreactApp

Receives an UnreactComponent and returns a React Native component.

## Pending

* Make a tool to generate propNames list from .d.ts files / autgenerate .tsx files to import components.
* Test with Fabric.
* Test with Xcode (only tested with Android up to now)

## Not pending

* HTML5 compatibility
* HTML5 DOM rendering
* ...anything related to HTML

This is not a WebView or HTML browser. If you need to write an HTML + CSS + JS app please use [CapacitorJS](https://capacitorjs.com/).

If you love React Native but hate React, then this library is for you.
