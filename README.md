# photo_upload_workaround
##What this is
These two files contain code that I wrote for an enterprise that is still in use today.  Each file comes from a separate
project: a laravel web app and a cordova mobile app that uses inappbrowser to point to the laravel web app.

##What are we looking at here?
After discovering that photo upload from the device to the web application won't work in inappbrowser I wrote a workaround.
See the comments in laravel.blade.php.