'use strict'
/**
* @module response
*/
module.exports = SolidResponse

var webUtil = require('../util/web-util')

/**
* Provides a wrapper around an XHR response object, and adds several
* Solid-specific parsed fields (link headers, allowed verbs, etc)
* @class SolidResponse
* @constructor
* @param xhrResponse {XMLHttpRequest} Result of XHR operation
* @param method {String} HTTP verb for the original request
*/
function SolidResponse (xhrResponse, method) {
  if (!xhrResponse) {
    this.xhr = null
    this.user = ''
    this.method = null
    return
  }
  /**
   * Hashmap of parsed `Link:` headers. Example:
   *
   *   ```
   *   {
   *     acl: 'resourceName.acl',
   *     describedBy: 'resourceName.meta',
   *     type: 'http://www.w3.org/ns/ldp#Resource'
   *   }
   *   ```
   * @property linkHeaders
   * @type Object
   */
  var linkHeader = xhrResponse.getResponseHeader('Link')
  this.linkHeaders = webUtil.parseLinkHeader(linkHeader) || {}

  if (method) {
    method = method.toLowerCase()
  } else {
    method = ''
  }
  /**
   * HTTP verb for the original request (GET, PUT, etc)
   * @property method
   * @type String
   */
  this.method = method

  /**
   * Name of the corresponding `.acl` resource
   * @property acl
   * @type String
   */
  this.acl = this.linkHeaders['acl']
  /**
   * Hashmap of HTTP methods/verbs allowed by the server.
   * (If a verb is not allowed, it's not included.)
   * Example:
   *   ```
   *   {
   *     'get': true,
   *     'put': true
   *   }
   *   ```
   * @property allowedMethods
   * @type Object
   */
  this.allowedMethods = this.parseAllowedMethods(xhrResponse, method)

  /**
   * Name of the corresponding `.meta` resource
   * @property meta
   * @type String
   */
  this.meta = this.linkHeaders['meta'] || this.linkHeaders['describedBy']
  /**
   * LDP Type for the resource.
   * Example: 'http://www.w3.org/ns/ldp#Resource'
   */
  this.type = this.linkHeaders.type
  /**
  * URL of the resource created or retrieved
  * @property url
  * @type String
  */
  this.url = xhrResponse.getResponseHeader('Location') || xhrResponse.responseURL
  /**
   * WebID URL of the currently authenticated user (empty string if none)
   * @property user
   * @type String
   */
  this.user = xhrResponse.getResponseHeader('User') || ''
  /**
   * URL of the corresponding websocket instance, for this resource
   * Example: `wss://example.org/blog/hellow-world`
   * @property websocket
   * @type String
   */
  this.websocket = xhrResponse.getResponseHeader('Updates-Via') || ''
  /**
   * Raw XHR response object
   * @property xhr
   * @type XMLHttpRequest
   */
  this.xhr = xhrResponse
}

/**
 * Returns the Content-Type of the response (or null if no response
 * is present)
 * @method contentType
 * @return {String|Null}
 */
SolidResponse.prototype.contentType = function contentType () {
  if (this.xhr) {
    return this.xhr.getResponseHeader('Content-Type')
  } else {
    return null
  }
}

/**
 * Returns true if the resource exists (not a 404)
 * @method exists
 * @return {Boolean}
 */
SolidResponse.prototype.exists = function exists () {
  return this.xhr && this.xhr.status >= 200 && this.xhr.status < 400
}

/**
 * Returns true if the user is logged in with the server
 * @method isLoggedIn
 * @return {Boolean}
 */
SolidResponse.prototype.isLoggedIn = function isLoggedIn () {
  return this.user // && this.user.slice(0, 4) === 'http'
}

/**
 * In case that this was preflight-type request (OPTIONS or POST, for example),
 * parses and returns the allowed methods for the resource (for the current
 * user).
 * @method parseAllowedMethods
 * @param xhrResponse {XMLHttpRequest}
 * @param method {String} HTTP verb for the original request
 * @return {Object} Hashmap of the allowed methods
 */
SolidResponse.prototype.parseAllowedMethods =
  function parseAllowedMethods (xhrResponse, method) {
    if (method === 'get') {
      // Not a preflight request
      return {}
    } else {
      return webUtil.parseAllowedMethods(
        xhrResponse.getResponseHeader('Allow'),
        xhrResponse.getResponseHeader('Accept-Patch')
      )
    }
  }

/**
 * Returns the raw XHR response (or null if absent)
 * @method raw
 * @return {Object|Null}
 */
SolidResponse.prototype.raw = function raw () {
  if (this.xhr) {
    return this.xhr.response
  } else {
    return null
  }
}
