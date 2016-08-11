
For More Information: https://nitalk.jiveon.com/docs/DOC-314516


The rpp tester is a tool that simulates the rt websocket protocol sending updates to a remote front panel. The tool will scrape the Function.html file and determine what controls are available and send property update messages.

In order to run do the following:
1) Open a command prompt in this directory and run 'npm install' to install dependencies
2) Place your Function.html in the yourvi folder provided or have the Function.html located in a different directory at a known location on disk
3) Modify Function.html so that ni-web-application has a remote-url attribute pointing to the location the server is running
   i.e. If the server and browser are on the same machine, remote-url="ws://localhost:3000/ws"
   i.e. If the server is on a separate machine, remote-url="ws://SERVER_IP_ADDRESS:3000/ws"
   NOTE: Be aware of the lack of a trailing slash character
4) Run the following command to start the rpp tester 'npm run rpptest -- yourvi -interval 500' where yourvi is the directory that contains Function.html
5) In the browser navigate to http://localhost:3000/static/Function.html

To Debug the script:
1) Install Visual Studio Code
2) Open this folder 'rpptester' in Visual Studio Code
3) If you placed your Function.html file in the yourvi folder you can click the Debug tab in Visual Studio Code and launch
   If your Function.html is in a different directory, edit the .vscode/launch.json file and change the 'args' array from yourvi to the directory that contains your Function.html