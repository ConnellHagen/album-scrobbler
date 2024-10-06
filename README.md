# About

Album Scrobbler is a desktop application that allows for the
quick scrobbling of albums, or collections of selected song
on [last.fm](last.fm). This is especially useful for people
who listen to music in a way that doesn't get automatically 
scrobbled, or who have issues with an auto-scrobbler breaking
from time to time.

# Setup Instructions

## Getting a last.fm API Account
In order for this app to be able to send scrobbles to your account,
you need a last.fm API Account? Why? I'll explain after the setup
instructions.

First, you need to register for an API account. This is very simple
and can be done [here](https://www.last.fm/api/account/create). All
you need to fill out on this form is an email, and the name of the
application (probably "Album Scrobbler" for simplicity).

(screenshot of registration)

Now, this should bring you to a page that looks like the following
screenshot. You can copy your API Key and Secret from here, and
paste them into the boxes within the application.

(screenshot of api key)

(screenshot of form in app)

Once you have saved your keys, you may proceed to login with last.fm
in the application and scrobble away!

### Why Do I Need To Do This?
The last.fm API is something that essentially gives this application
permission to do things to your account (e.g. send a scrobble). The
reason that I can't just use my API account for everybody comes down
to the API Secret. There would be no feasible way for me to provide
it in the code/some other method without someone being able to gain
access to it, and then possibly mess with my API account/do other bad
things. Having to create your own account is the compromise that has
to be made for this to work from a desktop application that doesn't
have anything running on a server somewhere else. The way that last.fm
handles this for websites is different, which is why they are able to
have a simple "sign-in with last.fm" button. Sorry for the
inconvenience but this is just how it is (at least for now).