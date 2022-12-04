# MirkPTOTrack
Mirk PTO Tracker
Used as a test to build a tracking tool.

setup article: https://levelup.gitconnected.com/set-up-and-run-a-simple-node-server-project-38b403a3dc09


# SETUP STUFF

## Setting up application to work on your local dev machine:
### *Ensure these are installed on your local computer*
* node.js - https://nodejs.org/en/download/
* git - https://github.com/git-guides/install-git
* Visual Studio Code - https://code.visualstudio.com/download
* mongodb (community addition)  - https://docs.mongodb.com/manual/installation/
* mongotools - https://docs.mongodb.com/database-tools/installation/installation/   [don't forget to set path]

### *Put the project onto your computer*
###### This will put the project into a new Radish directory under reactork.
1. log into git hub, and copy the code link from the main page.
2. go to the local directory you want to intal into (ie: **c:\reactwork**)
3. **git clone https://github.com/RadishApp/RadishApp.git**   <-- FIX PATH -->
4. open project in source tree and checkout the preprod branch
5. open visual studio code to the branch
5.1 run 'npm install' at the / and /client/ folders.  This will install the packages you need.
5.2 build the project (client and main)
5.3 start project - nodemon & front end scripts

##CHECKING VERSIONS OF DRIVERS / DEPENDANCIES
### Run next line at root of project
npm install -g npm-check-updates    || Install the checker.  This is not a dependancy

### Run next 3 lines at root & client
ncu                                                 || Check Versions of package against stable
ncu -u                                             || Forces package updates
npm install                                     || Installs the updates

## Other Notes
##### You may need to update your powershell / terminal server in the application.  Look to https://aka.ms/ Powershell for current version.
##### The serviceworker.js needs to be in the root of the published project.  Run project and look in devtools (chrome - ctrl-shift-i then pick application to see)
##### To test the version of node you are on, from a termal window:  npm node -v
##### More Markdown commands: https://guides.github.com/pdfs/markdown-cheatsheet-online.pdf
##### PAGINATION: Excellent MongoDb pagination article: https://medium.com/swlh/mongodb-pagination-fast-consistent-ece2a97070f3

## FIX node
###If your node returns errors when trying to do npm stuff, can try the following:
1. In c:\users[your user]\AppData\Roaming folder, DELETE the folders **npm** and **npm-cache**  (Hold down shift key to prevent from going to recycle bin) 
2. Uninstall Node.JS (under programs)
3. Re-Install Node.JS
4. In VSCode in a terminal, run **npm install** in both the \Radish  and the \Radish\Client directories
#### This should allow your projects to work again.

## Periodic Update  [Not needed if using ncu function from above]
###run npm updates periodically:  **npm update** in both \ and \client\
### force update to npm 7.21.x requires upgrade to 14.17.5 of node (through windows install).  then 'npm install -g npm' in both root and client

\/   \/   \/   \/   \/   \/   \/   \/   \/   \/   \/   \/   \/   \/   \/   \/   \/   
TO MANUALLY INSTALL PACKAGES FOLLOW THESE STEPS
\/   \/   \/   \/   \/   \/   \/   \/   \/   \/   \/   \/   \/   \/   \/   \/   \/   
To mannually install, follow steps below....
### *Setup inside project to run*
1. Launch Visual Studio Code
2. Start new Terminal Window
3. Make sure you are in the root of your project (ie: c:\websites\MIRKPTOTrack\)
4. Run command: **npm install**
5. Run command: **npm install mongodb --save**  -- install mondgo db support
7. Run command: **npm install -g nodemon** -- option run server w/o restaring for each change. (use script)
9. Run command: **npm install dotenv -- save**
14.Run command: **npm i winston**
15.Run command: **npm i winston-mongodb**

######
1. Change directory to client.  (ie: **c:\reactwork\Radish\client**)
2. Run command: **npm install**   *yes, it needs run again in the client directory*
7. Run command: **npx browserslist --update-db** -- update supported browsers

maybe run  npm i -S react-scripts