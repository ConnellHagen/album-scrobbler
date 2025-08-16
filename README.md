# About

Album Scrobbler is a desktop application that allows for the
quick scrobbling of albums, or collections of selected songs
on [last.fm](https://www.last.fm/). This is especially useful for people
who listen to music in a way that doesn't get automatically 
scrobbled, or who have issues with an auto-scrobbler breaking
from time to time.

Version 1.0 is coming soon. I hope to have it finished within the next month or so.

# Usage

### Collection Tab
The collection tab is your home page. It is where all of the albums that you save will be stored for quick re-use later. You can
add an album from here to your queue by hovering over it and hitting the plus icon.

<img width="1584" height="821" alt="image" src="https://github.com/user-attachments/assets/67820ba3-2477-4808-8457-af8c0c4ff938" />

### Search Tab

The search tab is where you can quickly add an album to your collection by searching the database from discogs.com. Although not
every album and mixtape ever created will be on discogs, this will most likely do the trick 99% of the time. You can search by
artist, album title, or whatever query you would like, and the Discogs search functionality handles finding the best matches for you.

<img width="1584" height="821" alt="image" src="https://github.com/user-attachments/assets/e23b09b3-82df-4142-82d8-29f158b6108b" />

### Manual Add Tab

For the edge case where you just aren't satisfied with what Discogs has in their database, you can also manually add an album
yourself! This is still better than finding a track-by-track manual scrobbler as you can easily save your album for later to scrobble
again when you listen again. It also will speed up the process by filling in defaults for repetitive/unnecessary fields like track
artist and song duration.

<img width="1584" height="821" alt="image" src="https://github.com/user-attachments/assets/1f052df9-a6e1-46f6-8e31-231c8434ab35" />

### Keys Tab

The keys tab is a place where you add your API keys so that the last.fm and Discogs integration works. There will be a section below
on how to obtain these keys if you are not familiar with what an API is or how they work. As long as you can copy/paste the strings
into the matching-named box, you will be able to figure this out though, don't worry.

<img width="1584" height="821" alt="image" src="https://github.com/user-attachments/assets/2326f336-a244-451a-afda-5cfed3eef8f2" />

### Queue Tab

Everything that you "add" from the collection tab gets sent to the queue, where you can do some last minute refining on the batch of
scrobbled that you send to your last.fm account. This can include re-ordering tracks by dragging and dropping them where you want.
This can also include removing tracks if you, for example, only got through part of an album but still want to have a quick way to
scrobble that portion. When you are ready, just hit the "Send Scrobbles" button. If mistakes were made and you need to quickly reset
the queue and start over, the "Clear" button will quickly get you back to an empty queue without sending the tracks to your last.fm.

<img width="1584" height="821" alt="image" src="https://github.com/user-attachments/assets/92815080-7275-4a8c-b5b2-a44a42234296" />


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
in the collection tab for now.

## Important Links (for setting up in the Keys tab)
- https://www.discogs.com/settings/developers
- https://www.last.fm/api/accounts
