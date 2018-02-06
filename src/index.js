/**
 * This monkeypatches fetch and stores all requests send with fetch.
 * fetch calls are simply resolved with no data.
 *
 * With this you can test what your code is sending via fetch.
 */

import FetchCall from './fetch-call';

let fetchRequests = [];
let mockResponses = [];

function getResponse(responseData) {
  let body;
  let contentType;

  if (typeof responseData.body === 'object') {
    // json response
    body = JSON.stringify(responseData.body);
    contentType = 'application/json';
  } else {
    // plain text
    body = responseData.body;
    contentType = 'text/plain';
  }

  return new Response(body, {
    headers: {
      'Content-Type': responseData.contentType || contentType,
    },
  });
}

function testUrl(url, matcher) {
  if (matcher === '*') {
    return 0.1;
  }

  if (matcher === url) {
    return 1.0;
  }

  return 0;
}

function getMockResponse(url) {
  if (mockResponses.length === 0) return null;

  return mockResponses.reduce((acc, cur) => {
    const curWeight = testUrl(url, cur.matcher);

    if (curWeight === 0) {
      return acc;
    }

    if (acc === null || curWeight > testUrl(url, acc.matcher)) {
      return cur;
    }

    return acc;
  }, null);
}

export function clear() {
  fetchRequests = [];
  mockResponses = [];
}

export function calls() {
  return fetchRequests;
}

export function lastCall() {
  if (fetchRequests.length === 0) {
    throw new Error('fetch(…) has not been called!');
  }

  return fetchRequests[fetchRequests.length - 1];
}

export function singleCall() {
  if (fetchRequests.length !== 1) {
    throw new Error(`fetch(…) not called exactly one time! It was called ${fetchRequests.length} times.`);
  }

  return lastCall();
}

export function mockResponse(urlMatcher, body, resolve = true, contentType) {
  mockResponses.push({
    matcher: urlMatcher,
    body,
    resolve,
    contentType,
  });
}

window.fetch = (url, request, ...args) => new Promise((resolve, reject) => {
  fetchRequests.push(new FetchCall(url, request, args));
  const mockedResponse = getMockResponse(url);

  if (mockedResponse) {
    const response = getResponse(mockedResponse);

    if (mockedResponse.resolve) {
      resolve(response);
    } else {
      reject(response);
    }
  } else {
    resolve();
  }
});
