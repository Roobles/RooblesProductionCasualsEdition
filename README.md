Roobles Production: Casuals Edition
=====================================

Roobles Production: Casuals Edition, at its core, is a set of standalone bash scripts that are intended to help automate or simplify common tasks in the CounterStrike production scene.  At the moment, the scope is entirely limited to pulling data from the popular platform [FACEIT!](http://www.faceit.com), but may expand in scope in the future.  To cover more platforms, and/or to grow in scope beyond shell scripts.

The scripts come with a Windows HTML Application (hta) GUI wrapper, for ease of use.  (It's the source of the tongue-in-cheek name.)  It's an exclusively Microsoft technology and only works in Windows environemnts; OSX and Linux users will have to use the shell scripts directly.

  

Dependencies
------------

There are three core dependencies:

  - [Git Bash](https://git-scm.com/downloads/win)
    - When installing Git, make sure you include Git Bash in the installation options.
  - [ImageMagick](https://imagemagick.org/archive/binaries/ImageMagick-7.1.2-0-Q16-HDRI-x64-dll.exe)
    - Install as normal, but make sure programs are added in system path.
  - [jq](https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-windows-amd64.exe)
    - This must be downloaded, renamed, and manually moved into the git bash environment.


Installation
------------

### Step 1: Install Git Bash

  Install Git Bash.  (If it's already installed in your system?  Great!  Skip this step.)


  *Note:* Installing git bash is a matter of installing Git on Windows, and choosing to include GitBash with it (should be selected by default.)
  

### Step 2: Install ImageMagick

  All of the default options should work perfectly.  Just make sure the programs are included in the system path.

### Step 3: Install jq

  - Open Git Bash by right-clicking inside of your desktop, or any open directory, and selecting `Open Git Bash here`.
  - Copy-Paste the following command into Git Bash:

```console
cd /usr/bin && explorer . || exit
```

  - (A new Windows Explorer window should open, in the Git Bash bin directory.  And Git Bash terminal should close automatically afterwards.)
  - Download jq from the link provided in the Dependencies section.
  - Move the jq executable to the Git Bash bin directory and rename it to **jq.exe**.

### Step 4: Install Roobles Production: Casuals Edition

  - Download a release or clone this repository.
  - Open `config.vbs` in a text editor of your choice.
  - Find the line that starts with `gitBashExecutable`, and set the value to the full Windows path of Git Bash's bash executable.
    - To get that path, open up Git Bash and type the following command:

```console
cygpath -w "$(which bash)"
```

  - An example of a configuration would look like:

```vbscript
gitBashExecutable = "C:\Program Files\Git\bin\bash.exe"
```

  - (Optional) Set the path of the default location to download team logos to.


Capabilities
-----------

### Logos

  Team Logos can be downloaded directly from a FaceIt Match or Tournament Id.  They will be automatically converted to 250x250 png's that are center-gravity cropped.  This makes team logos completely swappable with eachother, without needing to reposition or scale.

  If you provide a Match Id, just the two teams that are playing will have their logos downloaded.

  If you provide a Tournament Id, it will download the logos of every team that is partipating.

