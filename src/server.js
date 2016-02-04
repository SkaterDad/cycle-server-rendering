'use strict'
let Cycle = require('@cycle/core')
let express = require('express')
let Rx = require('rx')
let {
  html,
  head,
  title,
  link,
  body,
  div,
  script,
  makeHTMLDriver
} = require('@cycle/dom')
let app = require('../build/app').default

function wrapVTreeWithHTMLBoilerplate(vtree) {
  return (
    html([
      head([
        title('Cycle Server Side Rendering Example'),
        link({rel: 'stylesheet', href: './css/bundle.css'}),
      ]),
      body([
        div('.app-container', [vtree]),
        script({src: './dist/bundle.js'}),
      ]),
    ])
  )
}

function prependHTML5Doctype(appHTML) {
  return `<!doctype html>${appHTML}`
}

function wrapAppResultWithBoilerplate(appFn) {
  return function wrappedAppFn(sources) {
    return {
      DOM: appFn(sources).DOM.map(wrapVTreeWithHTMLBoilerplate)
    }
  }
}

//Initialize the Express server.
let server = express()

//serve static files
server.use(`/dist`, express.static(`dist`))
server.use(`/css`, express.static(`css`))

//Every request to the server will use this function.
//You could also put this into a server.get('/*', ...) function
server.use((req, res) => {
  // Ignore favicon requests
  if (req.url === '/favicon.ico') {
    res.writeHead(200, {'Content-Type': 'image/x-icon'})
    res.end()
    return
  }

  //Log each request
  console.log(`${new Date().toUTCString()} - Request: ${req.method} ${req.url}`)

  //Prepare Cycle.js app for Server Rendering
  //In this case, we wrap the app's vTree with the full page HTML.
  let wrappedAppFn = wrapAppResultWithBoilerplate(app)

  //Run the Cycle app.
  let cycleApp = Cycle.run(wrappedAppFn, {
    DOM: makeHTMLDriver(),
  })
  let sources = cycleApp.sources

  // ******* MYSTERY *********
  // The HTML driver uses the `.last()` operator to figure out when the app is done
  // updating the DOM.  How does that even work in a Cycle app where observables never end?
  // *************************
  //Subscribe to the HTML Driver events
  //HTML driver returns a string representation of the vTree.
  //When the string is emitted, send the HTML response to the client.
  let html$ = sources.DOM.map(prependHTML5Doctype)
  html$.subscribe(appHTML => {
    console.log(`${new Date().toUTCString()} - Response: Sending HTML reply.`)
    res.send(appHTML)
  })
})

//Start listening to requests.
let port = process.env.PORT || 3000
server.listen(port)
console.log(`Listening on port ${port}`)
