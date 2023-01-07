const path = require("path")
const fs = require("fs")

const src_file = path.resolve(__dirname, "..", "client", "src.js")
const shared_file = path.resolve(__dirname, "..", "shared", "index.js")

const target_file = path.resolve(__dirname, "..", "client", "index.js")

const src = fs.readFileSync(src_file, "utf8")
const shared = fs.readFileSync(shared_file, "utf8")

const target = `//Generated automatically. Do not edit\n//shared\n${shared}\n\n//src\n${src}`

fs.writeFileSync(target_file, target)

console.log(`Generated "${target_file}"`)
