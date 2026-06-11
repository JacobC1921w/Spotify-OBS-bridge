# Spotify-OBS-Bridge
Display currently playing spotify information on an OBS stream!

This works by using Spicetify to gather information about the current song, and send it via websocket to a python server, which will serve to a dynamic webpage.

OBS has a Browser view option. Setting the source to http://127.0.0.1:5005 will render the spotify information on the stream in real-time!

This should be cross-platform too i think...

## Installation
### 1. Spicetify
You can follow the installation for spicetify [here](https://spicetify.app/docs/getting-started), but heres a basic way to install it on windows:

1. Open up a powershell window by hitting Win+R and typing `pwsh`, the hit 'OK'
2. In the terminal window type the following in:
```powershell
iwr -useb https://raw.githubusercontent.com/spicetify/cli/main/install.ps1 | iex
```

~~Make sure to select Yes when asked to install the marketplace.~~ Installing the marketplace is optional, depending on if you want to add themes or other extensions for spotify easily! Close this powershell window for now.

### 2. Downloading and applying the extension
3. Download the repository as a zip file [here](https://github.com/JacobC1921w/Spotify-OBS-bridge/archive/refs/heads/main.zip) (or clone it), extract it somewhere (doesn't matter where, just remember the location) and place the `SOBSB-ext.js` file into `%appdata%/spicetify/Extensions`, so it should look like this:

![Image of spicetify extension folder](https://github.com/JacobC1921w/Spotify-OBS-Bridge/blob/main/images/spicetifyext.png?raw=true)

4. Install python3 by following the steps [here](https://www.python.org/downloads/). You'll know you've done it right when you open another powershell and type `python --version`, it should display information on your installation like this:

![Image of working python installation](https://github.com/JacobC1921w/Spotify-OBS-Bridge/blob/main/images/pythonver.png?raw=true)

5. In the same powershell window, type in the following command:
```powershell
spicetify config extensions SOBSB-ext.js
spicetify apply
```
 
Spotify should restart.

### 3. Running the server
6. In the same powershell window use the `cd` command to navigate to where you extracted the zip file earlier. Running `ls` should show you a file named `obs-script.py`.
7. Type in `python obs-script.py` to start running the server, it will now accept connections locally on http://127.0.0.1:5005 from the extension
8. Start playing a new song, and open up http://127.0.0.1:5005 in your browser. It should start updating in real-time

### 4. Setting up OBS
9. In OBS, Add a new broswer source but clicking the + in the bottom left of the sources window, and selection Browser. Name it whatever you want, and set the URL to `http://127.0.0.1:5005`, change whatever other settings you want, and when you hit OK, you'll see it appear in the scene. Resize and edit however you want.

# NOTE
Its kinda funky at the moment, you have to have the python script running first, then open spotify, play a new song, and it should start updating from there. I'll fix this in the future, but works after these steps.