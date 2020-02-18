/**
 * This monkeypatches fetch and stores all requests send with fetch.
 * fetch calls are simply resolved with no data.
 *
 * With this you can test what your code is sending via fetch.
 */

import FetchCall from './fetch-call';

let fetchRequests: FetchCall[] = [];
let mockResponses: ResponseData[] = [];

export type Body = Object | string;

export type ResponseData = {
  matcher: string;
  body: Object | string;
  config: {
    contentType?: string;
    headers?: {[key: string]: string},
    status?: number,
  }
  resolve?: boolean;
}

function getResponse(responseData: ResponseData) {
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

  const { config } = responseData;

  return new Response(body, {
    headers: {
      'Content-Type': config.contentType || contentType,
      ...(config.headers || {}),
    },
    status: config.status || 200,
  });
}

function testUrl(url: string, matcher: string) {
  if (matcher === '*') {
    return 0.1;
  }

  if (matcher === url) {
    return 1.0;
  }

  return 0;
}

function getMockResponse(url: string): ResponseData | null {
  if (mockResponses.length === 0) return null;

  return mockResponses.reduce<ResponseData | null>((acc, cur) => {
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

export function mockResponse(urlMatcher: string, body: Body, config = {}, resolve = true) {
  mockResponses.push({
    matcher: urlMatcher,
    body,
    resolve,
    config,
  });
}

window.fetch = (url: string, request, ...args) => new Promise((resolve, reject) => {
  fetchRequests.push(new FetchCall(url, request, args));
  const mockedResponse = getMockResponse(url);

  if (mockedResponse) {
    const response = getResponse(mockedResponse);

    if (mockedResponse.resolve) {
      resolve(response);
    } else {
      reject(new Error('Failed to fetch'));
    }
  } else {
    resolve();
  }
});
