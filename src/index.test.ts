import * as hungryFetch from './index';

describe('hungryFetch', () => {
  beforeEach(() => {
    hungryFetch.clear();
  });

  it('logs fetch calls', () =>
    fetch('path/to/nowhere', {
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

    return Promise.all([
      fetch('path/to/nowhere', request),
      fetch('path/to/nowhere', request),
    ]).then(() => {
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
    })
      .then((response) => response.json())
      .then((body) => {
        expect(body.data).toBe('some data');
      });
  });

  it('plaintext response', () => {
    hungryFetch.mockResponse('*', 'Hello');

    return fetch('/path/to/nowhere', {})
      .then((response) => response.text())
      .then((text) => {
        expect(text).toBe('Hello');
      });
  });

  it('custom status code', () => {
    hungryFetch.mockResponse(
      '*',
      {
        data: 'Unauthorized',
      },
      {
        status: 401,
      }
    );

    return fetch('/path/to/nowhere', {}).then((response) => {
      expect(response.status).toBe(401);
      expect(response.ok).toBe(false);
    });
  });

  it('custom headers', () => {
    hungryFetch.mockResponse(
      '*',
      {
        data: 'Something',
      },
      {
        headers: {
          'X-TestHeader': 'Hello',
        },
      }
    );

    return fetch('/path/to/nowhere', {}).then((response) => {
      expect(response.headers.get('X-TestHeader')).toBe('Hello');
    });
  });

  it('no matching response', async () => {
    hungryFetch.mockResponse('/path/to/somewhere', {});

    expect(await fetch('/path/to/nowhere', {})).toBe(undefined);
    expect(await fetch('/path/to/somewhere/different', {})).toBe(undefined);
  });

  it('select explicit response over wildcard', () => {
    hungryFetch.mockResponse('/somewhere', 'hello');
    hungryFetch.mockResponse('*', {});

    return fetch('/somewhere', {})
      .then((response) => response.text())
      .then((text) => {
        expect(text).toBe('hello');
      });
  });

  it('call fetch(…) without request parameters', () => {
    hungryFetch.mockResponse('/somewhere', 'hello');

    return fetch('/somewhere')
      .then((response) => response.text())
      .then((text) => {
        expect(text).toBe('hello');
      });
  });

  it('reject response', () => {
    hungryFetch.mockResponse('*', 'hello', {}, false);

    return expect(fetch('/anywhere', {})).rejects.toThrow();
  });

  it('throws error when trying to parse non-text body as json', async () => {
    hungryFetch.mockResponse('*', new Blob());

    await fetch('/somewhere', {}).then((response) => response.text());

    expect(() => {
      hungryFetch.lastCall().json();
    }).toThrow();
  });

  it('use * to mark wildcard segments', async () => {
    hungryFetch.mockResponse('/some/*/test', 'hello');

    await fetch('/some/random/test', {})
      .then((response) => response.text())
      .then((text) => {
        expect(text).toBe('hello');
      });

    expect(await fetch('/some/fail', {})).toBe(undefined);
    expect(await fetch('/some/random/fail', {})).toBe(undefined);
    expect(await fetch('/some/random/test/failure', {})).toBe(undefined);
  });
});
