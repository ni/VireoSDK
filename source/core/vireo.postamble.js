// Begin postamble
// Add some functions to the vireo object.

Module.v_create = Module.cwrap('EggShell_Create', 'number', ['number']);
Module.v_readDouble = Module.cwrap('EggShell_ReadDouble', 'number', ['number', 'string', 'string']);
Module.v_writeDouble = Module.cwrap('EggShell_WriteDouble', 'void', ['number', 'string', 'string', 'number']);
Module.v_readValueString = Module.cwrap('EggShell_ReadValueString', 'string', ['number', 'string', 'string', 'string' ]);
Module.v_writeValueString = Module.cwrap('EggShell_WriteValueString', 'void', ['number', 'string', 'string', 'string', 'string']);
Module.v_dataWriteString = Module.cwrap('Data_WriteString', 'void', ['number', 'number', 'string', 'number']);
Module.v_repl = Module.cwrap('EggShell_REPL', 'void', ['number', 'string', 'number']);
Module.v_executeSlices = Module.cwrap('EggShell_ExecuteSlices', 'number', ['number',  'number']);
Module.v_delete = Module.cwrap('EggShell_Delete', 'number', ['number']);
Module.v_root =  Module.v_create(0);
Module.v_userShell = Module.v_create(Module.v_root);
Module.fpSync = function(fpId) {};

HttpUser = function (userName, password) {
    'use strict';
    // Properties
    this.userName = userName;
    this.password = password;
    this.headers = {};

    // Methods
    if (typeof this.HttpUserMethods !== 'function') {
        var proto = HttpUser.prototype;
        proto.HttpUserMethods = function () {
        };

        proto.setUserName = function (userName) {
            this.userName = userName;
        };

        proto.getUserName = function () {
            return this.userName;
        };

        proto.setPassword = function (password) {
            this.password = password;
        };

        proto.getPassword = function () {
            return this.password;
        };

        proto.addHeader = function (header, value) {
            this.headers[header] = value;
        };

        proto.removeHeader = function (header) {
            if (this.headers.hasOwnProperty(header))
            {
                delete this.headers[header];
            }
        };

        proto.getHeaderValue = function (header) {
            if (this.headers.hasOwnProperty(header))
            {
                return this.headers[header];
            }
            return '';
        };

        proto.headerExist = function (header) {
            if (this.headers.hasOwnProperty(header))
            {
                return true;
            }
            return false;
        };

        proto.listHeaders = function () {
            var outputHeaders = '';
            for (var header in this.headers) {
                outputHeaders += header + ': ' + this.headers[header];
                outputHeaders += '\r\n';
            }
            return outputHeaders;
        };

        proto.getHeaders = function () {
            return this.headers;
        };
    }
};

HttpUsers = function () {
    'use strict';
    // Properties
    this.httpClients = {};

    // Methods
    if (typeof this.HttpUsersMethods !== 'function') {
        var proto = HttpUsers.prototype;
        proto.HttpUsersMethods = function () {
        };

        proto.add = function (userName, password) {
            var httpUser = new HttpUser(userName, password);
            var handle = Object.keys(this.httpClients).length + 1;
            var strHandle = handle.toString();
            this.httpClients[strHandle] = httpUser;
            console.log ("httpUser created for: " + userName);
            return handle;
        };

        proto.remove = function (handle) {
            if (handle !== 0)
            {
                var strHandle = handle.toString();
                if (this.httpClients.hasOwnProperty(strHandle))
                {
                    var user = this.httpClients[strHandle]
                    console.log ("httpUser deleted for: " + user.getUserName());
                    delete this.httpClients[strHandle];
                }
                else
                {
                    console.log ("httpUser error: Unknown handle (" + strHandle + ")");
                    return -1;
                }
            }

            return 0;
        };

        proto.get = function (handle) {
            if (handle !== 0)
            {
                var strHandle = handle.toString();
                if (this.httpClients.hasOwnProperty(strHandle))
                {
                    var user = this.httpClients[strHandle];
                    console.log ("The following user was requested: " + user.getUserName());
                    return user;
                }
            }
            return null;
        };

        proto.addHeader = function (handle, header, value) {
            if (handle !== 0)
            {
                var strHandle = handle.toString();
                if (this.httpClients.hasOwnProperty(strHandle))
                {
                    var user = this.httpClients[strHandle];
                    user.addHeader (header,value);
                    console.log ("The following header was added: " + header + "(" + value + ")");
                    return 0;
                }
                else
                    return -1;
            }
            return -1;
        };

        proto.removeHeader = function (handle, header) {
            if (handle !== 0)
            {
                var strHandle = handle.toString();
                if (this.httpClients.hasOwnProperty(strHandle))
                {
                    var user = this.httpClients[strHandle];
                    user.removeHeader (header);
                    console.log ("The following header was removed: " + header);
                    return 0;
                }
                else
                    return -1;
            }
            return -1;
        };

        proto.getHeaderValue = function (handle, header) {
            if (handle !== 0)
            {
                var strHandle = handle.toString();
                if (this.httpClients.hasOwnProperty(strHandle))
                {
                    var user = this.httpClients[strHandle];
                    var value = user.getHeaderValue (header);
                    console.log ("The following value was returned:(" + value + ") for header: " + header);
                    return value;
                }
                else
                    return '';
            }
            return '';
        };

        proto.headerExist = function (handle, header) {
            if (handle !== 0)
            {
                var strHandle = handle.toString();
                if (this.httpClients.hasOwnProperty(strHandle))
                {
                    var user = this.httpClients[strHandle];
                    var exist = user.headerExist (header);
                    console.log ("The following value was returned:(" + exist + ") for headerExist: " + header);
                    return exist;
                }
                else
                    return false;
            }
            return false;
        };

        proto.listHeaders = function (handle) {
            if (handle !== 0)
            {
                var strHandle = handle.toString();
                if (this.httpClients.hasOwnProperty(strHandle))
                {
                    var user = this.httpClients[strHandle];
                    var value = user.listHeaders ();
                    console.log ("The following value was returned:(" + value + ") for listHeaders.");
                    return value;
                }
                else
                    return '';
            }
            return '';
        };
    }
};

var httpUsers = new HttpUsers ();
httpUsers.add("",""); // Adding default user for empty handle (0)

return {
    version: Module.cwrap('Vireo_Version', 'number', []),

    readDouble:
        function(vi, path)
        { return Module.v_readDouble(Module.v_userShell, vi, path); },
    writeDouble:
        function(vi, path, value)
        { Module.v_writeDouble(Module.v_userShell, vi, path, value); },
    readJSON:
        function(vi, path)
        { return Module.v_readValueString(Module.v_userShell, vi, path, 'JSON'); },
    writeJSON:
        function(vi, path, value)
        { Module.v_writeValueString(Module.v_userShell, vi, path, 'JSON', value); },
    dataWriteString:
        function(destination, source, sourceLength)
        { Module.v_dataWriteString(Module.v_userShell, destination, source, sourceLength); },
    loadVia:
        function(viaText)
        { Module.v_repl(Module.v_userShell, viaText, -1); },
    executeSlices:
        function(slices)
        { return Module.v_executeSlices(Module.v_userShell, slices); },
    reboot:
        function() {
            Module.v_delete(Module.v_userShell);
            Module.v_userShell = Module.v_create(Module.v_root);
        },
    core: Module,
    addHttpUser:
        function (userName, password) {
            return httpUsers.add (userName, password);
        },
    removeHttpUser:
        function (handle) {
            httpUsers.remove(handle);
        },
    getHttpUser:
        function (handle) {
            return httpUsers.get(handle);
        },
    addHeader:
        function (handle, header, value) {
            httpUsers.addHeader (handle, header, value);
        },
    removeHeader:
        function (handle, header) {
            return httpUsers.removeHeader (handle, header);
        },
    getHeaderValue:
        function (handle, header, value) {
            var valueText = httpUsers.getHeaderValue (handle, header);
            NationalInstruments.Vireo.dataWriteString(value, valueText, valueText.length);
            return 0;
        },
    headerExist:
        function (handle, header) {
            return httpUsers.headerExist (handle, header);
        },
    listHeaders:
        function (handle, list) {
            var listText = httpUsers.listHeaders (handle);
            NationalInstruments.Vireo.dataWriteString(list, listText, listText.length);
            return 0;
        },
    makeRequest: 
        function (userHandle, protocol, url, timeOut, buffer, successCallback, errorCallback, onTimeOutCallback) {
            var httpUser = this.getHttpUser(userHandle);

            var request = new XMLHttpRequest();
            request.open(protocol, url);

            var error = function () {
                errorCallback(request);
            };

            var onTimeOut = function () {
                onTimeOutCallback(request);
            }

            // Set the headers
            var allHeaders = httpUser.getHeaders();
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

            request.ontimeout = function () {
                onTimeOut();
            }

            if (buffer === undefined) {
                request.send();
            } else {
                request.send(buffer);
            }
        }
};

}());

if (typeof process === 'object' && typeof require === 'function') {
    module.exports = NationalInstruments.Vireo;
}
