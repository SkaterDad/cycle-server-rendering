import Rx from 'rx'
import {h} from '@cycle/dom'

function checkRequestUrl(res$, url) {
  try {
    return res$.request.url.indexOf(url) === 0
  } catch (e) {
    return false
  }
}

function resultView({
  full_name = 'Unknown Repo Name',
  description = 'No description given.',
  owner = {
    avatar_url: '',
    login: '?',
  }}) {
  return h('article.hero.hero-item', {href: '#'}, [
    h('img.hero', {src: owner.avatar_url}),
    h('h1.hero.repo', {}, full_name),
    h('div.small', {}, description),
    h('div.small', {}, `by ${owner.login}`),
  ])
}

function RepoList({DOM, HTTP}) {
  //We're going to reuqest data from our own server.
  const GET_REQUEST_URL = 'http://localhost:3000/data'

  //Send HTTP request to get data for the page
  //.shareReplay(1) is needed because this observable
  //immediately emmits its value before anything can
  //subscribe to it.
  const dataRequest$ = Rx.Observable.just(GET_REQUEST_URL)
    .do(() => console.log(`Repo list: Search request subscribed`))
    .shareReplay(1)

  // Convert the stream of HTTP responses to virtual DOM elements.
  const dataResponse$ = HTTP
    .filter(res$ => checkRequestUrl(res$, GET_REQUEST_URL))
    .flatMapLatest(x => x) //Needed because HTTP gives an Observable when you map it
    .map(res => res.body)  //The JSON we want is in the 'body' of the response object
    .startWith([]) //Begin with an empty array so the vTree can render before HTTP response.
    .do((x) => console.log(`Repo list: HTTP response emitted: ${x.length} items`))
    .share() //Shared because loading$ and state$ both subscribe to this stream, and we don't want our HTTP request to double-fire.

  //loading indication.  true if request is newer than response
  const loading$ = dataRequest$.map(true).merge(dataResponse$.map(false))
    .do((x) => console.log(`Repo List: loading status emitted: ${x}`))

  //Combined state observable which triggers view updates
  const state$ = Rx.Observable.combineLatest(dataResponse$, loading$,
    (res, loading) => {
      return {results: res, loading: loading}
    })
    .do(() => console.log(`Repo List: state emitted`))

  //Map state into DOM elements
  const vtree$ = state$
    .map(({results, loading}) =>
      h('div.page-wrapper', {}, [
        h('div', {style: {height: '100%', overflow: 'auto'}}, [
          h('h1', {}, 'Cyclejs Repo List'),
          h('section.flex', {}, results.map(resultView).concat(loading ? h('div', ['Loading...']) : null)),
        ]),
      ])
    )
    .do(() => console.log(`Repo list: DOM emitted`))

  //Silly side effect to prove that the app still works after the client-side JS takes over!
  //Using `.subscribe()` is not normal in a Cycle app, but don't tell anyone...
  const sillySideEffect = DOM.select('.hero-item').events('click')
    .subscribe(() => console.log(`You clicked something, wohoo!`))

  //Return sinks
  return {
    DOM: vtree$,
    HTTP: dataRequest$,
  }
}

export default RepoList
