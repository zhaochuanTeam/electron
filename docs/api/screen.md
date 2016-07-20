# screen

> Retrieve information about screen size, displays, cursor position, etc.

You cannot use this module until the `ready` event of the `app` module is
emitted (by invoking or requiring it).

`screen` is an [EventEmitter](http://nodejs.org/api/events.html#events_class_events_eventemitter).

**Note:** In the renderer / DevTools, `window.screen` is a reserved DOM
property, so writing `let {screen} = require('electron')` will not work.

An example of creating a window that fills the whole screen:

```javascript
const electron = require('electron')
const {app, BrowserWindow} = electron

let win

app.on('ready', () => {
  const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize
  win = new BrowserWindow({width, height})
});
```

Another example of creating a window in the external display:

```javascript
const electron = require('electron')
const {app, BrowserWindow} = require('electron')

let win

app.on('ready', () => {
  let displays = electron.screen.getAllDisplays()
  let externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0
  })

  if (externalDisplay) {
    win = new BrowserWindow({
      x: externalDisplay.bounds.x + 50,
      y: externalDisplay.bounds.y + 50
    })
  }
})
```

## The `Display` object

The `Display` object represents a physical display connected to the system. A
fake `Display` may exist on a headless system, or a `Display` may correspond to
a remote, virtual display.

* `display` object
  * `id` Integer - Unique identifier associated with the display.
  * `rotation` Integer - Can be 0, 90, 180, 270, represents screen rotation in
    clock-wise degrees.
  * `scaleFactor` Number - Output device's pixel scale factor.
  * `touchSupport` String - Can be `available`, `unavailable`, `unknown`.
  * `bounds` Object
  * `size` Object
  * `workArea` Object
  * `workAreaSize` Object

## Events

The `screen` module emits the following events:

### Event: 'display-added'

Returns:

* `event` Event
* `newDisplay` Object

Emitted when `newDisplay` has been added.

### Event: 'display-removed'

Returns:

* `event` Event
* `oldDisplay` Object

Emitted when `oldDisplay` has been removed.

### Event: 'display-metrics-changed'

Returns:

* `event` Event
* `display` Object
* `changedMetrics` Array

Emitted when one or more metrics change in a `display`. The `changedMetrics` is
an array of strings that describe the changes. Possible changes are `bounds`,
`workArea`, `scaleFactor` and `rotation`.

## Methods

The `screen` module has the following methods:

### `screen.getCursorScreenPoint()`

Returns the current absolute position of the mouse pointer.

### `screen.getPrimaryDisplay()`

Returns the primary display.

### `screen.getAllDisplays()`

Returns an array of displays that are currently available.

### `screen.getDisplayNearestPoint(point)`

* `point` Object
  * `x` Integer
  * `y` Integer

Returns the display nearest the specified point.

### `screen.getDisplayMatching(rect)`

* `rect` Object
  * `x` Integer
  * `y` Integer
  * `width` Integer
  * `height` Integer

Returns the display that most closely intersects the provided bounds.
