import repoList from './repo-list'
import colorChanger from './color-changer'
import {filterLinks} from '@cycle/history'
import Mapper from 'url-mapper'
import {header, div, a} from '@cycle/dom'

//Initialize url mapper
const urlMapper = Mapper()

//Define routes
const routes = {
  '/': colorChanger,
  '/repos': repoList,
  '*': colorChanger,
}

//Routing logic
function getRouteValue(location, sources) {
  //Pass current url into router to get the appropriate value
  const {match, values} = urlMapper.map(location.pathname, routes)
  //If function returned, pass it the sources object and evaluate it
  if (typeof match === 'function') {
    return match(sources, values)
  }
  //else just return the route value, which must be DOM.
  return {DOM: match}
}

//Primary app function which runs on both client & server
//I'm basically making it a router for this example.
function app(sources) {
  //Link click interception & filtering
  const url$ = sources.DOM
    .select('a')
    .events('click')
    .filter(filterLinks)
    .map(event => event.target.pathname)
    .filter(x => x) //This truthy check is needed if you are putting other dom elements within an <a>...</a>

  //Observable of route values, which updates when the URL changes.
  //The route values are essentially small Cycle apps, so they are
  //objects containing observables (sinks).
  //For example: {DOM: vTree$, HTTP: request$}
  const route$ = sources.History
    .map(location => getRouteValue(location, sources))
    .do(x => {
      //Fancy logging so I know what sinks a route is returning
      const hasDOM = x.DOM ? true : false
      const hasHTTP = x.HTTP ? true : false
      console.log(`Content state emitted - DOM: ${hasDOM}, HTTP: ${hasHTTP}`)
    })
    .shareReplay(1) //Webpack Hot Module Replacement needed this to be shareReplay(1) instead of just share().  Your results may vary.

  //Map the DOM observables in the route$ stream, and wrap them in the overall page view.
  //.pluck() just grabs an object key from the stream value.
  const view$ = route$.pluck('DOM')
    .map(routeView =>
      div({style: {height: '100%'}}, [
        header([
          a({href: '/'}, 'Color Changer'),
          a({href: '/repos'}, 'Repo List'),
        ]),
        div('.content-holder', [routeView]),
      ])
    )

  //Our final HTTP sink grabs the HTTP observables from the router$ stream.
  //Some routes won't have HTTP sinks, so we filter them out.
  //I'm not sure the filter() is needed, but it's safe to keep.
  const http$ = route$.pluck('HTTP')
    .filter(x => x).flatMapLatest(x => x)

  //sinks
  return {
    DOM: view$,
    HTTP: http$,
    History: url$,
  }
}

export default app
