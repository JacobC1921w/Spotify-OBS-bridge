@echo off
echo Deleting old extension
del %appdata%\spicetify\Extensions\SOBSB-ext.js

echo Copying over modified extension
echo F | xcopy SOBSB-ext.js %appdata%\spicetify\Extensions\SOBSB-ext.js

echo Removing old extension from spicetify
spicetify config extensions SOBSB-ext.js-

echo Applying changes to spicetify
spicetify apply

echo Re-enabling extension in spicetify
spicetify config extensions SOBSB-ext.js

echo Applying changes to spicetify
spicetify apply

echo Done!
pause