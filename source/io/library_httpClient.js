/*jshint browser: true, node: true*/
var HttpClient = {

    // Make a header module
    headers: (function () {
        var headers = {};

        return {
            // Adds a key/value pair to the headers or update it if it exists
            addHeader: function (name, value) {
                headers[name] = value;
            },
            
            removeHeader: function(name) {
                delete headers[name];
            },
            
            // Gets all the headers as an object of key/value pairs.
            getHeaders: function () {
                return headers;
            },
            
            // Request a specific value based on a given key
            getHeader: function (name) {
                return headers[name] || '';
            },
            
            headerExists: function(name) {
                return headers.hasOwnProperty(name);
            }
        };
    })(),
    
    loginManager: (function() {
        var username = "";
        var password = "";
        var cookies = "";
        
        return {
            addUsername : function(name) {
                username = name;
            },
            addPassword : function(pass) {
                password = pass;   
            }
            
        };
    })(),
    
    makeRequest: function(protocol, url, buffer, successCallback, errorCallback) {
        var request = new XMLHttpRequest();
        request.open(protocol, url);

        var error = function () {
            errorCallback(request);
        };
        
        // Set the headers
        var allHeaders = this.headers.getHeaders();
        for (var key in allHeaders) {
            if (allHeaders.hasOwnProperty(key)) {
                request.setRequestHeader(key, allHeaders[key]);
            }
        }

        request.onreadystatechange = function () {
            if (request.readyState === 4) {
                if (request.status == 200) {
                    successCallback(request);
                } else {
                    error();
                }
            }
        };

        request.onerror = function () {
            error();
        };

        if (buffer === undefined) {
            request.send();
        } else {
            request.send(buffer);
        }
    },

    js_ni_httpClient_Get: function (url) {
        var successCallback = function(request) {
            // Return Headers
            console.log(request.getAllResponseHeaders());
            
            // Return body
            console.log(request.responseText);
        };
        var errorCallback = function(request)
        {
            console.log(request.statusText);
        };
        
        this.makeRequest('GET', url, undefined, successCallback, errorCallback);
    },

    js_ni_httpClient_Post: function (url, buffer) {

        var successCallback = function(request) {
           // Return Headers
            console.log(request.getAllResponseHeaders());
            
            // Return body
            console.log(request.responseText);
        };
        var errorCallback = function(request)
        {
            console.log(request.statusText);
        };
        
        this.makeRequest('POST', url, buffer, successCallback, errorCallback);
    },
    
    js_ni_httpClient_Put: function(url, buffer) {
        var successCallback = function(request) {
           // Return Headers
            console.log(request.getAllResponseHeaders());
            
            // Return body
            console.log(request.responseText);
        };
        var errorCallback = function(request)
        {
            console.log(request.statusText);
        };
        
        this.makeRequest('PUT', url, buffer, successCallback, errorCallback);
    },
    
    js_ni_httpClient_Delete: function(url) {
         var successCallback = function(request) {
           // Return Headers
            console.log(request.getAllResponseHeaders());
            
            // Return body
            console.log(request.responseText);
        };
        var errorCallback = function(request)
        {
            console.log(request.statusText);
        };
        
        this.makeRequest('POST', url, undefined, successCallback, errorCallback);
    },
    
    js_ni_httpClient_Head: function(url)
    {
        var successCallback = function(request) {
           // Return Headers
            console.log(request.getAllResponseHeaders());
        };
        var errorCallback = function(request)
        {
            console.log(request.statusText);
        };
        
        this.makeRequest('HEAD', url, undefined, successCallback, errorCallback);
    },

    js_ni_httpClient_AddHeader: function (header, value) {
        this.headers.addHeader(header, value);
    },
    
    js_ni_httpClient_RemoveHeader : function(header) {
        this.headers.removeHeader(header);   
    },
    
    js_ni_httpClient_GetHeader : function(header) {
        var headerValue = this.headers.getHeader(header);
        console.log(headerValue);
    },
    
    js_ni_httpClient_HeaderExists : function(header) {
        var headerExists = this.headers.headerExists(header);
        var headerValue = this.headers.getHeader(header);
        
        console.log(headerExists);
        console.log(headerValue);
    },
    
    js_ni_httpClient_ListHeaders : function() {
        var allHeaders = this.headers.getHeaders();
        var outputString = '';
        for (var key in allHeaders) {
            outputString += key + ': ' + allHeaders[key];
            outputString += '\r\n';
        }
        
        console.log(outputString);
    }
        
};