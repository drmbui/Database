#Description: Kill long running processes
#Author: Minh Bui/Jason Mimick
#Date:2/3/2016

echo "start script"

mongo findLongRunningMongoDBProcesses.js

echo "end script"
