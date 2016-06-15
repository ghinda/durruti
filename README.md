<p align="center"><a href="https://github.com/ghinda/durruti" target="_blank"><img width="300" src="artwork/durruti-logo.png"></a></p>

<p align="center">
  <a href="https://travis-ci.org/ghinda/durruti"><img src="https://api.travis-ci.org/ghinda/durruti.svg" alt="Build Status"></a>
</p>

# Durruti

Micro isomorphic JavaScript library for building user interfaces.

## Why?

Durruti aims to make isomorphic component-based JavaScript web apps easier to develop. It's focused on simplicity rather than performance.

It doesn't do view model binding or event listeners on it's own. It takes a DIY approach and gives you have full control on when to re-render components, or how to handle events.

## Features

* **Lightweight:** No dependencies, the client-side libraries are just `~4KB`.
* **Simple Components:** Components are basic JavaScript classes/functions with three methods.
* **Store:** Optional store library with change events and shared state between server and browser.
* **Static Site Generator:** Generate a static website from an isomorphic app.

## How to use

### Quick use

```html
<script src="durruti.js"></script>

<div id="app"></div>
<script>
  function Main () {
    this.render = function () {
      return '<div>Main Component</div>'
    }
  }

  durruti.render(Main, document.querySelector('#app'))
</script>
```

### Durruti

The main Durruti library (`durruti.js`) handles component rendering and mounting/mounting.

It exposes a main `render` method that takes two parameters:

* The first is a JavaScript class/function or object representing a Durruti component
* The second is an optional DOM node where the rendered component will be inserted. If you don't specify the DOM node, the render method will return the rendered component as a string.

Durruti components are basic JavaScript classes or objects that can expose three methods.

* `render`: The render method is mandatory and must return the component template as a string. The template must contain a top level DOM node.
* `mount`: The optional mount method is called after the component is added to the DOM. The mount method receives the current DOM node as a parameter.
* `unmount`: The optional mount method is called before the component is removed from the DOM.

#### Example

Render the `Main` component to an `#app` DOM node.

```javascript
function Main () {
  // mount and unmount are optional
  this.mount = function () {
    console.log('Mount was added to the DOM')
  }

  this.unmount = function () {
    console.log('Mount is about to be removed from the DOM')
  }

  this.render = function () {
    return '<div>Main Component</div>'
  }
}

durruti.render(Main, document.querySelector('#app'))
```

#### Re-rendering view model example

Clicking the button will increase the counter, and re-render the component.

```javascript
function Main () {
  var self = this
  self.counter = 0

  function increaseCount () {
    self.counter++

    // re-render the component
    durruti.render(self, self.$container)
  }

  // mount and unmount are optional
  self.mount = function ($container) {
    // expose the container to the other methods
    self.$container = $container

    $container.querySelector('button').addEventListener(increaseCount)
  }

  self.render = function () {
    return '<div>\Main Component <p>Counter: ' + self.counter + '</p><button>Increase count</button></div>'
  }
}

durruti.render(Main, document.querySelector('#app'))
```

#### Server render

When rendering on the server, you must use the `renderStatic` method when rendering pages.

The example bellow uses Express, but can be adapted to any Node.js framework.

```javascript
var express = require('express')
var app = express()
app.get('/:route', function (req, res) {
  res.send(durruti.renderStatic('<html><body><div id="app">' + durruti.render(Main) + '</div></body></html>'))
})
```


### Store

The store library can be used to store data, with change history, shared state between client and server and change events.

To use it, include the `store.js` file.

Initialize a new store with `new durruti.Store(storeName, options)`. Both parameters are optional.

* `storeName`: The first parameter is required only when sharing state between client and server, and must be a unique key.
* `options`: The second parameter is an options hash.

The available options are:

* `history`: By default, history is enabled in browsers, and disabled on the server. You can manually disable or enable it.


#### Methods

Stores have four methods:

* `set`: Set the store value.
* `get`: Get the current store value.
* `list`: List all values that the store had. History must be enabled.
* `on`: Attach callback to events. The only event available right now is `change`. It triggers when the store value has changed.

#### Example

```javascript
var model = new durruti.Store()
model.on('change', function () {
  console.log('The new store value is ' + model.get())
})

model.set('New Model Value')
```

### State

The state library is used for sharing Store data between client and server. The library itself has to be used only on the server, and exposes a single `render` method.

```javascript
var express = require('express')
var app = express()
var state = require('durruti/state')

app.get('/:route', function (req, res) {
  res.send(durruti.renderStatic('<html><body><div id="app">' + durruti.render(Main) + '</div>' + state.render() + '</body></html>'))
})
```


## License

Durruti is licensed under the [MIT license](LICENSE).

