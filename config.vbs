' This value sets the default location for saving team logos.
' It may be worth setting it to where your HUDs are configured to look for logos,
' and then have OBS, or any other application, reference from there.
defaultLogoSaveFolder = "C:\tmp\logo"

' This value needs to be the full path to your gitbash executable.
' You can find this by right-clicking in any location in Windows and choosing 'Open Git Bash Here'
' Then, copy-paste this command into gitbash:
'                                                   cygpath -w "$(which bash)"
' Then, copy-paste the result into this variable:
gitBashExecutable = "C:\Program Files\Git\bin\bash.exe"
