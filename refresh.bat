@echo off
echo Deleting old extension
del %appdata%\spicetify\Extensions\lyric2serial-spicetifyext.js

echo Copying over modified extension
echo F | xcopy lyric2serial-spicetifyext.js %appdata%\spicetify\Extensions\lyric2serial-spicetifyext.js

echo Removing old extension from spicetify
spicetify config extensions lyric2serial-spicetifyext.js-

echo Applying changes to spicetify
spicetify apply

echo Re-enabling extension in spicetify
spicetify config extensions lyric2serial-spicetifyext.js

echo Applying changes to spicetify
spicetify apply

echo Done!
pause