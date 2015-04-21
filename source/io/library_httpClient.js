
var HttpClient = 
    {
        js_ni_httpClient_Get: function (url, len, response, done)
        {
            function get(urlString) {
                return new Promise (function (resolve, reject) {
                    var request = new XMLHttpRequest();
                    request.open("GET", urlString);

                    request.onload = function () {
                       if (request.status == 200) {
                            resolve(request.responseText)
                        }
                        else {
                            reject(Error(request.statusText));
                        }
                    };

                    request.onerror = function () {
                        reject(Error("Network Error"));
                    };

                    request.send();
                });
            }

            get(Pointer_stringify(url, len)).then(
                function (responseText) {
                    NationalInstruments.Vireo.dataWriteString(response, responseText, responseText.length);
                    var doneText = 'done';
                    NationalInstruments.Vireo.dataWriteString(done, doneText, doneText.length);
                    //console.log("In JavaScript World responseText is " + responseText);
                },
                function(error) {
                    var message = error.message;
                    NationalInstruments.Vireo.dataWriteString(response, message, message.length);
                    var doneText2 = 'done';
                    NationalInstruments.Vireo.dataWriteString(done, doneText2, doneText2.length);
                    console.log("We got an error in JavaScript World: " + message);
                }
            );
        },      
};

/*
{
    js_ni_httpClient_Get: function (url, len, response) {
        var request = new XMLHttpRequest();
        request.open("get", Pointer_stringify(url, len), false); // For now we are making a synchronous call
        request.send();

        //var requestResponse = request.responseText + '\0';
        var requestResponse = request.responseText;
        NationalInstruments.Vireo.dataWriteString(response, requestResponse, requestResponse.length);
    }
}*/
/*{
    js_ni_httpClient_Get: function (url, len, response) {
        setTimeout(function () {
            console.log("start");
            var request = new XMLHttpRequest();
            request.open("get", Pointer_stringify(url, len), false); // For now we are making a synchronous call
            request.send();

            //var requestResponse = request.responseText + '\0';
            var requestResponse = request.responseText;
            NationalInstruments.Vireo.dataWriteString(response, requestResponse, requestResponse.length);
        }, 1000);
       
    }
}*/

mergeInto(LibraryManager.library, HttpClient);