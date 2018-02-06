import * as hungryFetch from './index';

describe('hungryFetch', () => {
  beforeEach(() => {
    hungryFetch.clear();
  });

  it('logs fetch calls', () => fetch('path/to/nowhere', {
    body: 'I am a body',
    method: 'POST',
  }).then(() => {
    expect(hungryFetch.calls().length).toBe(1);
    expect(hungryFetch.lastCall().body()).toBe('I am a body');
  }));

  it('singleCall throws Error when there was more than one call', () => {
    const request = {
      body: 'I am a body',
      method: 'POST',
    };

    return Promise.all([fetch('path/to/nowhere', request), fetch('path/to/nowhere', request)]).then(() => {
      expect(() => {
        hungryFetch.singleCall();
      }).toThrow();
    });
  });

  it('singleCall throws Error when there was no call', () => {
    expect(() => {
      hungryFetch.singleCall();
    }).toThrow();
  });

  it('lastCall throws Error when there was more than one call', () => {
    expect(() => {
      hungryFetch.lastCall();
    }).toThrow();
  });

  it('test network call', () => {
    return fetch('/path/to/nowhere', {
      body: JSON.stringify({
        data: 'I am a body',
      }),
    }).then(() => {
      const call = hungryFetch.singleCall();
      expect(call.url).toBe('/path/to/nowhere');
      expect(call.json().data).toBe('I am a body');
    });
  });

  it('test response', () => {
    hungryFetch.mockResponse('/path/to/nowhere', {
      data: 'some data',
    });

    return fetch('/path/to/nowhere', {
      body: JSON.stringify({
        data: 'I am a body',
      }),
    }).then(response => response.json()).then((body) => {
      expect(body.data).toBe('some data');
    });
  });
});
