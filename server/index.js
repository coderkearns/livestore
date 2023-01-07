const WebSocketServer = require("ws")
const { store } = require("../shared/index")

class LiveStoreServer {
    constructor(baseObject, websocketOptions = {}) {
        this.store = store(baseObject)
        this._initStore()
        this._initWebSocket(websocketOptions)
    }

    _initStore() {
        this.store.subscribe((value, path) => {
            this._sendUpdateMessage(path, value)
        }, true) // Skip this subscriber when receiving changes as to not be a circular loop.
    }

    _initWebSocket(websocketOptions) {
        this.server = new WebSocketServer.Server(websocketOptions)

        this.server.on("connection", ws => {
            // TODO To handle multiple connections, use this.clients = [], append each client as it is connected and remove on disconnect.
            // TODO Then change each "_send" to read "for (let ws of this.clients)" instead of "if (this.ws)"
            this.ws = ws
            this._sendInitialMessage()

            ws.on("message", data => {
                const { type, data } = JSON.parse(data)

                if (type === "update") {
                    self._handleUpdate(data)
                }
            })

            ws.on("close", () => {
                this.ws = null
            })
        })
    }

    _sendInitialMessage() {
        if (this.ws) {
            this.ws.send(JSON.stringify({
                type: "initial",
                data: this.store.get()
            }))
        }
    }

    _sendUpdateMessage(path, value) {
        if (this.ws) {
            this.ws.send(JSON.stringify({
                type: "update",
                data: { path, value }
            }))
        }
    }

    _handleUpdate({ path, value }) {
        const paths = path.split(".")
        let current = this.store
        for (let key of paths) {
            current = current[key]
        }
        current.value = value
        current.notify(value, true) // Don't notify the skipped subscribers
    }
}

module.exports = LiveStoreServer
