# About

Album Scrobbler is a desktop application that allows for the
quick scrobbling of albums, or collections of selected songs
on [last.fm](https://www.last.fm/). This is especially useful for people
who listen to music in a way that doesn't get automatically 
scrobbled, or who have issues with an auto-scrobbler breaking
from time to time.

# How to Run

Currently, this software is not as polished and featured as I would
like it to be for a full release, so I do not have executables prepared.
Proceed if you are okay with using the command line.

First, make sure you have `npm` installed. If you are not scared
of using the command line, you can figure out how to do this from
google: it is too many steps for me to lay out here. Next, navigate to
the directory that `package-lock.json` is located in, and run
`npm install`. Now, to run the program just run `npm start`. This
should start the program. Note that the database file is the one
I am using for testing, so you will have a bunch of random albums
in the collection tab.

# Setup Instructions

## Getting a last.fm API Account
In order for this app to be able to send scrobbles to your account,
you need a last.fm API Account? Why? I'll explain after the setup
instructions.

First, you need to register for an API account. This is very simple
and can be done [here](https://www.last.fm/api/account/create). All
you need to fill out on this form is an email, and the name of the
application (probably "Album Scrobbler" for simplicity).

![image](https://github.com/user-attachments/assets/74be4962-2071-4df3-bf4b-a7ab29e2a353)

Now, this should bring you to a page that looks like the following
screenshot. You can copy your API Key and Secret from here, and
paste them into the boxes within the application.

![image](https://github.com/user-attachments/assets/06851787-552f-414c-87a1-c34471525fbd)

<img src="https://github.com/user-attachments/assets/f8e59e25-9576-4502-8e6d-07523e896bde" style="width: 56%;">
<img src="https://github.com/user-attachments/assets/32395ede-ed11-4dd7-b5b9-2bd5de995f8b" style="width: 43%;">

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
