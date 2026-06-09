# Spotify-OBS-Bridge
Display currently playing spotify information on an OBS stream!

This works by using Spicetify to gather information about the current song, and send it via websocket to a python server, which will serve to a dynamic webpage.

OBS has a Browser view option. Setting the source to http://127.0.0.1:5005 will render the spotify information on the stream in real-time!