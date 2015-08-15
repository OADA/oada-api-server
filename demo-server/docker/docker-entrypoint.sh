#! /bin/bash

# Tell node server to run on 3000:
export PORT=3000
# Tell config.js to use /data to store data:
export ISDOCKER=1

# Install any new local dependencies
# (note npm update pulls any new git stuff)
cd /code/oada-api-server
npm install && npm update

# Start forever to keep the API server running
npm run start-watch
