import Cycle from '@cycle/core'
import {makeDOMDriver} from '@cycle/dom'
import {makeHTTPDriver} from '@cycle/http'
import {makeHistoryDriver} from '@cycle/history'
import app from './app'

//Client-side app's "Main" function
function clientSideApp(sources) {
  let sinks = app(sources)

  //
  //  MYSTERY!
  //
  //  What to skip, and how many?
  //
  //  sinks.DOM.skip(1) prevents re-drawing, but also prevents
  //  any DOM events in the route components from working.
  //
  //  sinks.History.skip(1) doesn't prevent redrawing, 
  //  and also doesn't prevent the client code from
  //  re-requesting HTTP data.
  //
  //  what to do?

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
