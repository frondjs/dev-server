const {execSync} = require('child_process')
const http = require('http')
const fs = require('fs')
const path = require('path')
const mime = require('mime')
const chokidar = require('chokidar')
const WebSocket = require('ws')
const Automerge = require('automerge')

module.exports = function createServer({port, watch, silent, publicpath, ctx}) {
  // get update count from automerge
  const dbname = ctx.project.name + '-db.json'
  const dbpath = path.join('~/.frondjs', dbname)
  const db = fs.existsSync(dbpath) ? fs.readFileSync(dbpath, 'utf8') : null
  let doc = db
    ? Automerge.load(db)
    : Automerge.from({updatedFiles: [], codebaseUpdateCount: new Automerge.Counter()})

  process.on('SIGINT', function() {
    fs.writeFileSync(dbpath, Automerge.save(doc))
    process.exit()
  })

  // create websocket client without a server because we will attach it
  // to the node server below
  let websocket = null
  const wss = new WebSocket.Server({noServer: true})
  wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
      if (!silent) console.log(`🌍 WEBSOCKET CLIENT: ${message}`)
    })
    try {
      ws.send(JSON.stringify({codebaseUpdated: false, updateCount: doc.codebaseUpdateCount}))
    } catch (e) {
      if (!silent) console.log('Websocket connection established but failed \
to send a message to the client.', e.message)
    }
    websocket = ws
  })

  const reDirectoryMatch = /.\.[a-zA-Z0-9]{1,4}$/
  const server = http.createServer(function(request, response) {
    if (!silent) console.log(`🌍 ${request.method}: ${request.url}`)

    // match request with a static file or index.html
    const isDirectory = reDirectoryMatch.test(request.url) === false
    let filepath = isDirectory === false
      ? path.join(ctx.project.path, publicpath, request.url)
      : path.join(ctx.project.path, publicpath, request.url, 'index.html')

    function sendResponse(data) {
      response.setHeader('Content-Type', mime.getType(filepath))
      response.end(data)
    }

    // serve
    fs.readFile(filepath, function(err, data) {
      if (err) {
        filepath = path.join(ctx.project.path, publicpath, '/', 'index.html')
        fs.readFile(filepath, function(err, data) {
          if (err) {
            response.statusCode = 404
            return response.end('File not found or you made an invalid request.')
          }
          return sendResponse(data)
        })
      }
      else {
        return sendResponse(data)
      }
    })
  })

  server.on('upgrade', function(request, socket, head) {
    // NOTE: Authenticate websocket client here, if neccessary.
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request, null)
    })
  })

  server.on('error', function(err) {
    throw err
  })

  server.on('clientError', function onClientError(err, socket) {
    console.error(err)
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
  })

  server.listen(port, function() {
    if (!silent) console.log(`🌍 Dev server is online! http://localhost: ${port}`)

    // watch
    if (watch) {
      const watchPaths = ['src', 'modules/frond']
      const watcher = chokidar.watch(
        watchPaths.map(p => path.join(ctx.project.path, p, '/**')),
        {
          ignored: [
            '**/node_modules/**'
          ],
          persistent: true,
          alwaysStat: true
        }
      )
      watcher.on('ready', function() {
        if (!silent) console.log(`🔎 Watching service initiated.`)
      })
      watcher.on('change', function(fullpath, stats) {
        const relpath = path.relative(ctx.project.path, fullpath)
        if (!silent) console.log(`🔎 Change detected. ${relpath} Rebuilding app...`)

        const cmd = [
          `NODE_ENV=development cd ${ctx.project.path}`,
          `npm run build`
        ]
        execSync(cmd.join(' && '))

        doc = Automerge.change(doc, 'Codebase change', d => {
          d.codebaseUpdateCount.increment()
          d.updatedFiles.push(relpath)
        })
        try {
          websocket.send(JSON.stringify({codebaseUpdated: true, updateCount: doc.codebaseUpdateCount}))
        } catch (e) {
          if (!silent) console.log('Websocket connection established but failed \
to send a message to the client.', e.message)
        }
      })
    }
  })
}
