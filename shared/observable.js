const ATOM_PROTO = {
    $observable: true,
    $type: "atom",
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

const OBSERVABLE_PROTO = {
    $observable: true,
    $type: "observable",
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

function atom(value) {
    const _atom = Object.create(ATOM_PROTO)

    _atom.value = value
    _atom.subscribers = []

    return _atom
}

function observable(object) {
    const _observable = Object.create(OBSERVABLE_PROTO)

    _observable.subscribers = []
    _observable.data = {}
    for (let key in object) {
        let value = object[key]
        if (!value.$observable) {
            value = typeof value === "object" ? observable(value) : atom(value)
        }
        value.subscribe((value, path) => {
            if (path) {
                _observable.notify(value, `${key}.${path}`)
            } else {
                _observable.notify(value, key)
            }
        })
        _observable.data[key] = value
    }


    return new Proxy(_observable, {
        get(target, prop) {
            if (prop in OBSERVABLE_PROTO) return target[prop]
            return target.data[prop]
        }
    })
}

if (typeof module !== "undefined") {
    module.exports = { atom, observable }
}
