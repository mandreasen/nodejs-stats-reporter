# Anonymous usage statistics reporter
This module reports anonymous usage statistics from my node.js modules.

# Currently, this data is reported:
- Which module is sending statistics.
- An anonymous ID that identifies your machine.
- The version of node.js you're running.
- The version of my node.js module you're running.
- The version of the nodejs-stats-reporter module you're running.
- The operating system and version, you are using.
- The uptime of your application.

# Opting out

Set MA_NODEJS_STATS_REPORTER_REPORT environment variable to false. If you don't wanna report, anonymous usage statistics to me.