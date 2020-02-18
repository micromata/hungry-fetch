/**
 * Container for storing call-data, providing some convenience functions.
 */
export default class FetchCall {
  url: string;
  additionalArgs: any;
  request: RequestInit;

  constructor(url: string, request: RequestInit = {}, additionalArgs: any) {
    this.request = request;
    this.url = url;
    this.additionalArgs = additionalArgs;
  }

  /**
   * Parses the request body from json.
   * @returns The parsed object.
   */
  json(): any {
    if (typeof this.request.body !== 'string')
      throw Error(`Can't parse json from ${typeof this.request.body}`);

    return JSON.parse(this.request.body);
  }

  /**
   * Gets the body of the request.
   * @returns The body.
   */
  body(): any {
    return this.request.body;
  }
}
