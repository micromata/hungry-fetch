# Hungry Fetch

Nomnomnom … lets you test your fetch calls.

[![Build Status](https://travis-ci.org/micromata/hungry-fetch.svg?branch=master)](https://travis-ci.org/micromata/hungry-fetch)
[![npm](https://img.shields.io/npm/v/hungry-fetch.svg)](https://www.npmjs.com/package/hungry-fetch)

## What it doesn’t do

*Hungry Fetch* does not polyfill the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). Furthermore it requires `Response` to be available, so you might actualy need to [polyfill the Fetch API](https://github.com/github/fetch) before using *Hungry Fetch*.

## How does it work?

*Hungry Fetch* monkey patches `window.fetch` and saves all calls to `fetch(…)` with it’s parameters.

## Installation

```
npm install --save-dev hungry-fetch
```

## Examples

### Swallow and resolve requests

By default *hungryFetch* resolves any request with an undefined response.

```javascript
import hungryFetch from 'hungry-fetch';

test('test network call', () => {
  return fetch('/path/to/nowhere', {
    body: JSON.stringify({
      data: 'I am a body'
    })
  }).then(() => {
    const call = hungryFetch.singleCall();
    expect(call.url).toBe('/path/to/nowhere');
    expect(call.json().data).toBe('I am a body');
  });
});
```

### Mock response

You can mock responses for explicit URLs. You may also use `*` as url matcher to match any URL. Explicit URLs are stronger weighted than the wildcard matcher, so you can specify a default response and add different responses for explicit URLs.

```javascript
import hungryFetch from 'hungry-fetch';

test('test response', () => {
  hungryFetch.mockResponse('/path/to/nowhere', {
    data: 'some data'
  });

  return fetch('/path/to/nowhere', {
    body: JSON.stringify({
      data: 'I am a body'
    })
  }).then(response => {
    return response.json();
  }).then(body => {
    expect(body.data).toBe('some data');
  });
});
```
