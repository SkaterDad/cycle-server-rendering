import Cycle from '@cycle/core'
import {makeDOMDriver} from '@cycle/dom'
import {makeHTTPDriver} from '@cycle/http'
import app from './app'

//Client-side app's "Main" function
function clientSideApp(sources) {
  let sinks = app(sources)
  //The component we're rendering through 'app'
  // updates the DOM 4 times, and has 1 HTTP request.
  // We'll need to skip those while mounting the client-side JS.

  // If you skip the wrong # of DOM, the nicely rendered DOM from the server
  // will get wiped out as the client code tries to recreate it.
  // Sometimes you could end up with a visually complete page, but have it unresponsive to use inputs.
  sinks.DOM = sinks.DOM.skip(4)

  // Forgetting to skip the HTTP will cause a duplicate data request from the client-side.
  sinks.HTTP = sinks.HTTP.skip(1)

  return sinks
}

//Define what drivers are needed for this app
const drivers = {
  DOM: makeDOMDriver('.app-container'),
  HTTP: makeHTTPDriver(),
}

//Start up Cycle.js!
Cycle.run(clientSideApp, drivers)
