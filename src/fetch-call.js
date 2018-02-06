/**
 * Container for storing call-data, providing some convenience functions.
 */
export default class FetchCall {
  constructor(url, request, additionalArgs) {
    this.request = request;
    this.url = url;
    this.additionalArgs = additionalArgs;
  }

  /**
   * Parses the request body from json.
   * @returns The parsed object.
   */
  json() {
    return JSON.parse(this.request.body);
  }

  /**
   * Gets the body of the request.
   * @returns The body.
   */
  body() {
    return this.request.body;
  }
}
