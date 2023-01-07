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
