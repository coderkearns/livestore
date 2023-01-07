//Generated automatically. Do not edit
//shared
const _ATOM_PROTO = {
    $subscribable: "atom",
    data: {},
    subscribers: [],
    subscribe(fn, skippable = false) {
        if (skippable) {
            fn.skip = true
        }
        this.subscribers.push(fn)
        return () => { this.subscribers = this.subscribers.filter(subscriber => subscriber !== fn) }
    },
    notify(value, skip = false) {
        const subscribers = skip ? this.subscribers.filter(fn => !fn.skip) : this.subscribers

        subscribers.forEach(subscriber => {
            subscriber(value)
        })
    },
    set(v) {
        this.value = v
        this.notify(v)
    },
    get() {
        return this.value
    }
}

function atom(value) {
    const _atom = Object.create(_ATOM_PROTO)

    _atom.value = value
    _atom.subscribers = []

    return _atom
}

const _STORE_PROTO = {
    $subscribable: "store",
    data: {},
    subscribers: [],
    subscribe(fn) {
        this.subscribers.push(fn)
        return () => { this.subscribers = this.subscribers.filter(subscriber => subscriber !== fn) }
    },
    notify(value, path, skip = false) {
        const subscribers = skip ? this.subscribers.filter(fn => !fn.skip) : this.subscribers

        subscribers.forEach(subscriber => {
            subscriber(value, path)
        })
    },
    get() {
        const data = {}
        for (let key in this.data) {
            data[key] = this.data[key].get()
        }
        return data
    }
}

function store(object) {
    const _store = Object.create(_STORE_PROTO)

    _store.subscribers = []
    _store.data = {}
    for (let key in object) {
        let value = _makeSubscribable(object[key])
        value.subscribe((value, path) => {
            if (path) {
                _store.notify(value, `${key}.${path}`)
            } else {
                _store.notify(value, key)
            }
        })
        _store.data[key] = value
    }


    return new Proxy(_store, {
        get(target, prop) {
            if (prop in _STORE_PROTO) return target[prop]
            return target.data[prop]
        }
    })
}

function _makeSubscribable(item) {
    if (!item.$subscribable) {
        return typeof item === "object" ? store(item) : atom(item)
    }
    return item
}

if (typeof module !== "undefined") {
    module.exports = { atom, store }
}


//src
class LiveStoreClient {
    constructor(websocketAddress) {
        this.ready = new Promise((resolve, reject) => {
            this._resolveReady = resolve;
            this._rejectReady = reject;
        })

        this.store = null

        this._initWebSocket(websocketAddress)
    }

    _initWebSocket(websocketAddress) {
        this.socket = new WebSocket(websocketAddress)

        this.socket.addEventListener("open", () => {
            console.log(`liveStore "${websocketAddress}" connected.`)
        })

        this.socket.addEventListener("close", () => {
            console.log(`liveStore "${websocketAddress}" disconnected.`)
        })

        this.socket.addEventListener("message", event => {
            const { type, data } = JSON.parse(event.data)

            if (type === "initial") {
                this.handleInitial(data)
            } else if (type === "update") {
                this.handleUpdate(data)
            }
        })
    }

    handleInitial(data) {
        this.store = store(data)

        this.store.subscribe((value, path) => {
            this.socket.send(JSON.stringify({
                type: "update",
                data: {
                    path,
                    value
                }
            }))
        }, true) // Skip this subscriber when receiving changes as to not be a circular loop.
    }

    handleUpdate({ path, value }) {
        const paths = path.split(".")
        let current = this.store
        for (let key of paths) {
            current = current[key]
        }
        current.value = value
        current.notify(value, true) // Don't notify the skipped subscribers
    }
}
