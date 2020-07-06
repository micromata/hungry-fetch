/**
 * This monkeypatches fetch and stores all requests send with fetch.
 * fetch calls are simply resolved with no data.
 *
 * With this you can test what your code is sending via fetch.
 */

import FetchCall from './fetch-call';
import { testWildcardPattern } from './url-pattern';

let fetchRequests: FetchCall[] = [];
let mockResponses: ResponseData[] = [];

export type Body = Record<string, any> | string;

export type ResponseData = {
  pattern: string;
  body: Record<string, any> | string;
  config: {
    contentType?: string;
    headers?: { [key: string]: string };
    status?: number;
  };
  resolve?: boolean;
};

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

function testUrl(url: string, pattern: string) {
  // exact match
  if (url === pattern) {
    return 1.0;
  }

  // any pattern
  if (pattern === '*') {
    return 0.1;
  }

  // match using wildcards
  if (testWildcardPattern(url, pattern)) {
    return 0.5;
  }

  // no match
  return 0;
}

function getMockResponse(url: string): ResponseData | null {
  if (mockResponses.length === 0) return null;

  return mockResponses.reduce<ResponseData | null>((acc, cur) => {
    const curWeight = testUrl(url, cur.pattern);

    if (curWeight === 0) {
      return acc;
    }

    if (acc === null || curWeight > testUrl(url, acc.pattern)) {
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
    throw new Error(
      `fetch(…) not called exactly one time! It was called ${fetchRequests.length} times.`
    );
  }

  return lastCall();
}

/**
 * Mock a response with a url matching the specified pattern.
 *
 * The pattern supports wildcards for parts of the url by using an asterisk (\*).
 * Example: /category/*&#47;details
 *
 * You may also use a single asterisk "*" to match all routes.
 *
 * The matchers are weighted so that a perfect match has the highest priority.
 * A match using wildcard components has the second highest prority. The
 * single asterisk matcher has the lowest priority. This helps to configure
 * default responses.
 *
 * @param urlMatcher The matcher incoming urls will be checked against.
 * @param body The body of the response.
 * @param config An optional config.
 * @param resolve Set to false to reject matching fetch calls.
 */
export function mockResponse(
  pattern: string,
  body: Body,
  config = {},
  resolve = true
) {
  mockResponses.push({
    pattern,
    body,
    resolve,
    config,
  });
}

(typeof window !== 'undefined' ? window : (global as any)).fetch = (
  url: string,
  request: RequestInit,
  ...args: any[]
) =>
  new Promise((resolve, reject) => {
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
