@ECHO OFF
node scripts/build.js
IF %ERRORLEVEL% EQU 0 start index.htm
