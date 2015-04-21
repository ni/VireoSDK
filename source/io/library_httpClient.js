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
            },
            
            deleteHeaders: function() {
                headers = {};   
            }
        };
    })(),
    
    loginManager: (function() {
        var username = "";
        var password = "";
        var cookies = {};
        
        return {
            setUsername : function(name) {
                username = name;
            },
            
            setPassword : function(pass) {
                password = pass;   
            },
            
            addCookie : function(key, value) {
                 cookies[key] = value;
            },
            
            setCookies : function(cookieStr) {
                var tokens = cookieStr.split(';');
                for (var index in tokens) {
                    var subTokens = tokens[index].split("=");
                    if (subTokens.length === 2) {
                        this.addCookie(subTokens[0].trim(), subTokens[1].trim());
                    }
                }
            },
        
            getCookieString : function() {
                var str = "";
                for (var key in cookies) {
                    str += key + "=" + cookies[key] + ";";
                }
                return str;
            },
            
            clearData : function() {
                username = "";
                password = "";
                
                var str = this.getCookieString();
                for (var key in cookies) {
                    document.cookie = key + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';   
                }
                cookies = {};
            },
            
            getRequest : function(protocol, url) {
                var request = new XMLHttpRequest();
                if (username !== "" && password !== "") {
                    request.open(protocol, url, true, username, password);
                }
                else if (username !== "" && password === "") {
                    request.open(protocol, url, true, username);
                }
                else {
                    request.open(protocol, url, true);   
                }
                
                if (Object.keys(cookies).length !== 0) {
                    request.withCredentials = true;
                    document.cookie += this.getCookieString();
                }
                return request;
            }
        };
    })(),
    
    makeRequest: function(protocol, url, buffer, successCallback, errorCallback) {
        var request = this.loginManager.getRequest(protocol, url);

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
    
    js_ni_httpClient_OpenHandle : function(cookies, username, password) {
        this.loginManager.setCookies(cookies);
        this.loginManager.setUsername(username);
        this.loginManager.setPassword(password);
    },
    
    js_ni_httpClient_CloseHandle : function(cookies, username, password) {
        this.loginManager.clearData();
        this.headers.deleteHeaders();
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
