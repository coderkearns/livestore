# Live Store

Control a shared and subscribable store between frontend and backend Javascript! Based on the principles behind frontend reactivity: subscriptions.

## Getting Started

Live Store doesn't have an npm package yet, so install it directly from this repo:

```shell
$ npm install -s git+git+https://git@github.com/coderkearns/livestore
```

## Usage

Live Store has three parts: the shared reactivity code, the frontend code, and the backend code.

### Shared

There are two reactivity primitives: `atom`s and `observable`s.

#### Atoms

An `atom` is a value with an array of subscriber functions attached.

```javascript
const name = atom("John Doe") // Create an atom and set its starting value

const unsubscribe = name.subscribe(newValue => {
    console.log(`Name is now ${newValue}`)
})

console.log(name.get()) // => John Doe

name.set("Jane Doe") // => Name is now Jane Doe
console.log(name.get()) // => Jane Doe

unsubscribe() // Stop listening

name.set("George Doe") // nothing logged, but the internal value changes
console.log(name.get()) // => George Doe
```

#### Observables

An `observable` is similar to an `atom` with an array of subscribers, but it mimics the behavior of an object. All values in the object are converted to `atom`s, and it recursively turns sub-objects into other `observable`s.

It should be noted that `observable`s are technically Javascript `Proxy` objects so you can use keys like `get` and `subscribers` without overriding.

```javascript
const settings = observable({
    name: "John Doe",
    values: {
        a: 1,
        b: 2
    }
})

settings.get() // returns a non-reactive copy of the observable

const unsubscribe = settings.subscribe((newValue, path) => {
    console.log(`Value at path '${path}' changed to ${newValue}`)
})

console.log(settings.name.get()) // => John Doe

settings.name.set("Jane Doe") // => Value at path 'name' changed to Jane Doe

settings.values.a.set(3) // => Value at path 'values.a' changed to 3

console.log(settings.values.a.get()) // => 3
```

**As a caveat, arrays are not yet supported in `observable`s and will cause problems.**

### Frontend

1. Load the script [index.js](client/index.js) from the client directory

```html
<script src="livestore/client/index.js"></script>
```

2. Initialize the socket anywhere in your javascript

```javascript
const settings = new ListStoreClient("ws://localhost:3000")
```

3. Wait for the store to connect to the server

```javascript
await settings.ready
```

4. Use the `store.store` as any other observable

```javascript
settings.store.name.set("Jane Doe")
// Not only will this notify all subscribers, it also modifies the
// backend copy automatically and runs any of their subscriptions
```

### Backend

```javascript
const LiveStoreServer = require("livestore/server")

const initialObject = {
// You can get your initial object however you want (JSON, dynamically fetched, whatever) so long as it is `JSON.stringify()`able
    name: "John Doe",
    values: {
        a: 1,
        b: 2
    }
}
const settings = new LiveStoreServer(initialObject, { port: 3000 })

settings.store.name.set("Jane Doe")
// Not only will this notify all subscribers, it also modifies the
// frontend copy automatically and runs any of their subscriptions
```

## License

[MIT License](https://choosealicense.com/licenses/mit/)

## Todo List

- [ ] Handle arrays in `observable`
- [ ] Simple example usage
- [ ] Example usage with Express.js
