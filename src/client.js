import Cycle from '@cycle/core'
import {makeDOMDriver} from '@cycle/dom'
import app from './app'

//Client-side app's "Main" function
function clientSideApp(sources) {
  let sinks = app(sources)
  //skip the first DOM event since the server already rendered it.
  sinks.DOM = sinks.DOM.skip(1)
  return sinks
}

//Define what drivers are needed for this app
const drivers = {
  DOM: makeDOMDriver('.app-container'),
}

//Start up Cycle.js!
Cycle.run(clientSideApp, drivers)
