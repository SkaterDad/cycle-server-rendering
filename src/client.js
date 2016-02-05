import Cycle from '@cycle/core'
import {makeDOMDriver} from '@cycle/dom'
import {makeHTTPDriver} from '@cycle/http'
import {makeHistoryDriver} from '@cycle/history'
import app from './app'

//Client-side app's "Main" function
function clientSideApp(sources) {
  let sinks = app(sources)

  // With the history driver and some routing, it's a
  // lot simpler to mount the client code.
  // Only have to skip one DOM update, which comes from
  // the routing observable.  The content of the
  // route is no longer a factor here thanks to that.
  sinks.DOM = sinks.DOM.skip(1)

  return sinks
}

//Define what drivers are needed for this app
const drivers = {
  DOM: makeDOMDriver('.app-container'),
  HTTP: makeHTTPDriver(),
  History: makeHistoryDriver(),
}

//Start up Cycle.js!
Cycle.run(clientSideApp, drivers)
