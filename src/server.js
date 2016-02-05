'use strict'
let Cycle = require('@cycle/core')
let express = require('express')
//let Rx = require('rx')
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
let {makeHTTPDriver} = require('@cycle/http')
let {makeServerHistoryDriver} = require('@cycle/history')
let app = require('../build/app').default
let theData = require('./data.js') //cached data from the github api

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

function wrapAppResultWithBoilerplate(appFn, takeOptions) {
  return function wrappedAppFn(sources) {
    const theApp = appFn(sources)
    return {
      DOM: theApp.DOM.take(takeOptions.dom).map(wrapVTreeWithHTMLBoilerplate),
      HTTP: theApp.HTTP.take(takeOptions.http),
      History: theApp.History,
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
  console.log(`${new Date().toString()} - Request: ${req.method} ${req.url}`)

  //Serve up the cached github data when requested
  if (req.url === '/data') {
    res.json(theData)
    res.end()
    return
  }

  //Define how many DOM and HTTP events we need to take from the app
  //You may want to define these numbers in your route config and read them here.
  //I chose not to since this examle is so simple.
  //You'll know if these numbers are wrong because your HTML response won't happen.
  const takeOptions = {
    dom: 1,
    http: req.url === '/repos' ? 1 : 0, //repo list has one http request, the other page has none
  }

  //Prepare Cycle.js app for Server Rendering
  //In this case, we wrap the app's vTree with the full page HTML.
  let wrappedAppFn = wrapAppResultWithBoilerplate(app, takeOptions)

  //Run the Cycle app.
  let cycleApp = Cycle.run(wrappedAppFn, {
    DOM: makeHTMLDriver(),
    HTTP: makeHTTPDriver(),
    History: makeServerHistoryDriver({pathname: req.url}),
  })
  let sources = cycleApp.sources

  // ******* MYSTERY *********
  // The HTML driver uses the `.last()` operator to figure out when the app is done
  // updating the DOM.  How does that even work in a Cycle app where observables never end?
  //
  // My current theory is that the HTMLDriver doesn't do all that circular dependency magic
  // like the DOMDriver does.  Its code is much simpler and seems to emit a normal observable.
  //
  // To illustrate this, the repo-list.js component emmits the DOM 4 times (see the server console log)
  // This log message only happens once, after all the DOM updates are done!
  // This still works even if you delay the reply from the '/data' route for a few seconds.
  // *************************
  //Subscribe to the HTML Driver events
  //HTML driver returns a string representation of the vTree.
  //When the string is emitted, send the HTML response to the client.
  let html$ = sources.DOM.map(prependHTML5Doctype)
  html$.subscribe(appHTML => {
    console.log(`${new Date().toString()} - Response: Sending HTML reply.`)
    res.send(appHTML)
  })
})

//Start listening to requests.
let port = process.env.PORT || 3000
server.listen(port)
console.log(`Listening on port ${port}`)
