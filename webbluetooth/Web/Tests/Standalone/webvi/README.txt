This tool creates a http static file server that maps the /jsResources, /Web, and /bower_components to the correct locations in the repository branch. This is helpful for debugging and testing web vis in the deployed scenario.

1) From this directory, run the command 'npm install'
    - This only needs to be done the first time the web vi server is run
    - You may see some errors during npm install about native modules failing to build. This should be safe to ignore

2) Copy the generated WebVI files (Function.html, VIACode.txt, VIAInfo.js) into either the provided /webvi/yourvi folder or your own subdirectory (if you want several tests)

3) From the commandline in the /webvi directory run the command 'npm run serve'
    - This will show the help so you can see how to pass the directory of your generated web vi to the tool
    - Ex: to run the HTML Panel in the /webvi/yourvi directory and open the served page in the default browser the command would be 'npm run serve -- -o yourvi'
    
DO NOT check in the 'node_modules' folder or any new files made in the /webvi/yourvi directory or other custom directory