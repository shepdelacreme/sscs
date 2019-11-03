#!/usr/bin/env node
const https = require('http')
const fs = require('fs')
const path = require('path')
const { URL } = require('url')
const send = require('send')

const pidloc = path.join(__dirname, 'pid')

function kill () {
  let pid

  try {
    pid = fs.readFileSync(pidloc, 'utf8')
  } catch (err) {
    if (err.code === 'ENOENT') {
      return start()
    }
  }

  try {
    process.kill(parseInt(pid, 10))
  } catch (err) {
  }

  try {
    fs.unlinkSync(pidloc)
  } catch (err) {
  }

  start()
}

process.on('uncaughtException', err => {
  if (err.code === 'EADDRINUSE') {
    return kill()
  }

  console.error(err.message)
  process.exit(1)
})

const opts = {
  root: `${__dirname}/../static/`
}

const onListen = () => {
  try {
    fs.writeFileSync(pidloc, String(process.pid), 'utf8')
  } catch (err) {
    console.error(err)
    process.exit(1)
  }

  console.log('  http -> 8000')
}

function start () {
  https.createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost:8000/').pathname

    console.log(`  req -> ${u}`)

    const error = () => {
      const f = path.join(opts.root, 'index.html')
      fs.createReadStream(f).pipe(res)
    }

    send(req, u, opts).on('error', error).pipe(res)
  }).listen(8000, onListen)
}

start()
