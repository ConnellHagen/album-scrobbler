let $ = (id) => document.getElementById(id);

let uInt8ArrayToBase64 = (uint8) => {
    let binaryString = "";

    uint8.forEach(byte => {
        binaryString += String.fromCharCode(byte);
    });

    return btoa(binaryString);
}

let base64ToUint8Array = (base64) => {
    // decode the base64 string to a binary string
    let binaryString = atob(base64);
    
    // create a Uint8Array to hold the binary data
    let len = binaryString.length;
    let bytes = new Uint8Array(len);
    
    // convert the binary string to a Uint8Array
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;
}

let scrollPositions = {
    "collection-tab": 0,
    "search-tab": 0,
    "manual-add-tab": 0,
    "queue-tab": 0
};

let mouseDownX = 0;
let mouseDownY = 0;
let mouseX = 0;
let mouseY = 0;
let mouseDrag = false;

class DragTable {
    constructor() {
        this.tbody = null;
        this.currRow = null;
        this.dragElem = null;
    }
}

let manualAddDragTable = new DragTable();
let queueDragTable = new DragTable();

class QueueItem {
    constructor(coverURL, title, artist, album, albumArtist, trackLength) {
        this.coverURL = coverURL ? coverURL : null;
        this.title = title ? title : null;
        this.artist = artist ? artist : null;
        this.album = album ? album : null;
        this.albumArtist = albumArtist ? albumArtist : null;
        this.trackLength = trackLength ? trackLength : null;
    }

    getColFormat() {
        return [this.coverURL, this.title, this.artist, this.album, this.trackLength]
    }
}

let queueContents = []

window.addEventListener("DOMContentLoaded", async () => {
    manualAddDragTable.tbody = $("ma-track-info").querySelector('tbody');
    queueDragTable.tbody = $("queue-track-info").querySelector('tbody');

    let tabs = ["search", "manual-add", "queue"];
    for (let i = 0; i < tabs.length; i++) {
        $(`${tabs[i]}-tab-btn`).addEventListener("click", (event) => {
            switchToTab(`${tabs[i]}-tab`);
        });
    }

    $("collection-tab-btn").addEventListener("click", (event) => {
        switchToTab(`collection-tab`);
        adjustCollectionGridSize();
        $("collection-tab").scrollTop = scrollPositions["collection-tab"];
    });

    $("account-dropdown").addEventListener("click", (event) => {
        $("account-dropmenu").classList.add("shown");
    });

    $("account-signin-btn").addEventListener("click", async (event) => {
        $("signin-popup").classList.add("shown");
        await window.lastfm.requestAuth();
    });

    $("ae-api-info-btn").addEventListener("click", async (event) => {
        loadCredentials();
    });
    
    $("signin-popup-x").addEventListener("click", (event) => {
        $("signin-popup").classList.remove("shown");
    });

    $("signin-popup-done-btn").addEventListener("click", async (event) => {
        signIn();
    });

    $("credentials-popup-x").addEventListener("click", (event) => {
        $("credentials-popup").classList.remove("shown");
    });

    $("credentials-popup-save-btn").addEventListener("click", async (event) => {
        saveCredentials();
    });

    $("sign-out-btn").addEventListener("click", (event) => {
        signOut();
    });

    $("ma-album-select").addEventListener("click", (event) => {
        $("ma-album-cover-input").click();
    });

    $("ma-album-cover-input").addEventListener("change", (event) => {
        uploadManualAlbumCover(event);
    });

    document.querySelector("#ma-add-track-btn a").addEventListener("click", (event) => {
        addTrackInfoRow();
    });
    
    $("ma-save-btn").addEventListener("click", (event) => {
        saveManualAddAlbum();
    });

    $("ma-reset-btn").addEventListener("click", (event) => {
        resetManualAddAlbum();
    });

    $("queue-clear-btn").addEventListener("click", (event) => {
        queueDragTable.tbody.innerHTML = "";

        window.lastfm.testSessionKeyValid();
    });

    $("queue-scrobble-btn").addEventListener("click", (event) => {
        scrobbleQueue();
    });

    // stop icons from being able to be "dragged"
    document.addEventListener("dragstart", function(event) {
        event.preventDefault();
    });
    
    bindMouse();
    startSession();
    fillCollectionGrid();
    resetManualAddAlbum();

    // await window.db.test();
});

window.addEventListener("resize", async () => {
    adjustCollectionGridSize();
});

window.onclick = (event) => {
    if (!(event.target.matches(".dropbtn") || event.target.matches(".dropbtn *") || event.target.matches(".dropmenu"))) {
        let dropmenus = document.querySelectorAll(".dropmenu");
        for (let i = 0; i < dropmenus.length; i++) {
            dropmenus[i].classList.remove("shown");
        }
    }
}

function switchToTab(tabname) {
    let tabButtons = document.querySelectorAll(".tab-btn");
    let tabContents = document.querySelectorAll(".content-display .tab-content");

    for (let i = 0; i < tabContents.length; i++) {
        let currTab = tabContents[i];
        let currTabBtn = tabButtons[i];

        // if the tab is currently active, disable it
        if (currTab.classList.contains("active")) {
            // save scroll position
            scrollPositions[currTab.id] = currTab.scrollTop;

            currTabBtn.classList.remove("active");
            currTab.classList.remove("active");
        }

        // if the tab is the one being switched to, activate it
        if (currTab.id === tabname) {
            // restore scroll position
            currTab.scrollTop = scrollPositions[tabname];

            currTabBtn.classList.add("active");
            currTab.classList.add("active");
        }
    }
}

async function fillCollectionGrid() {
    let grid = $("album-grid");
    grid.innerHTML = "";

    let allAlbums = await window.db.getAllAlbums();

    for (let i = 0; i < allAlbums.length; i++) {
        let album = allAlbums[i];
        let albumID = album[0];
        let artist = album[1];
        let title = album[2];
        let coverBlob = album[3];

        let base64Image;
        if (coverBlob) {
            base64Image = uInt8ArrayToBase64(coverBlob);
        } else {
            let defaultCover = await window.db.coverFromImage("img/default-cover.png");
            base64Image = uInt8ArrayToBase64(defaultCover);
        }
        let url = `url("data:image/jpg;base64,${base64Image}")`;

        let albumImage = document.createElement("div");
        albumImage.classList.add("album-image");
        albumImage.style.backgroundImage = url;

        let albumOverlay = document.createElement("div");
        albumOverlay.classList.add("album-overlay");
        let overlayAddButton = document.createElement("a");
        overlayAddButton.addEventListener("click", async () => {
            let albumTracks = await window.db.getTracks(albumID);
            albumTracks.forEach(track => {
                let queueTrack = new QueueItem(url, track[1], track[0], title, artist, track[2]);
                addQueueTrack(queueTrack);
            });
        });
        overlayDeleteButton.addEventListener("click", async () => {
            window.db.deleteAlbumByID(albumID);
            // also remove album from the gui.
            adjustCollectionGridSize();
        });
        let plusIcon = document.createElement("img");
        plusIcon.src = "../img/icons/plus.svg";
        plusIcon.classList.add("filter-white");
        overlayAddButton.appendChild(plusIcon);
        albumOverlay.appendChild(overlayAddButton);

        let albumCard = document.createElement("div");
        albumCard.classList.add("album");
        albumCard.appendChild(albumImage);
        albumCard.appendChild(albumOverlay);

        grid.appendChild(albumCard);
    }

    adjustCollectionGridSize();
}

async function addAlbumToCollectionGrid(albumID) {
    let grid = $("album-grid");

    let album = await window.db.getAlbumByID(albumID);
    let artist = album["Artist"];
    let title = album["Title"];
    let coverBlob = album["Cover"];

    let base64Image;
    if (coverBlob) {
        base64Image = uInt8ArrayToBase64(coverBlob);
    } else {
        let defaultCover = await window.db.coverFromImage("img/default-cover.png");
        base64Image = uInt8ArrayToBase64(defaultCover);
    }
    let url = `url("data:image/jpg;base64,${base64Image}")`;

    let albumCard = document.createElement("div");
    albumCard.classList.add("album");
    albumCard.style.backgroundImage = url;


    let dummyAlbums = document.querySelectorAll(".album.dummy");
    dummyAlbums.forEach(dummy => {
        grid.removeChild(dummy);
    });
    grid.appendChild(albumCard);

    // to adjust the number of dummy albums
    adjustCollectionGridSize();
}           

// modifies the height of the albums in the grid and
// adds invisible dummy albums to the end to stop albums
// from stretching into rectangles at the end of the grid
function adjustCollectionGridSize() {
    let grid = $("album-grid");
    let gridWidth = grid.offsetWidth;
    let numPerRow = Math.floor((gridWidth - 20) / 220);

    let albums = document.querySelectorAll(".album:not(.dummy)");
    let dummyAlbums = document.querySelectorAll(".album.dummy");

    // add dummy albums to the end so that flex-grow doesn't cause last row to be shaped weird
    let newTotalDummyAlbums = (numPerRow - (albums.length % numPerRow)) % numPerRow;
    let dummyAlbumsToAdd = newTotalDummyAlbums - dummyAlbums.length;

    if (dummyAlbumsToAdd > 0) {
        for (let i = 0; i < dummyAlbumsToAdd; i++) {
            let dummyAlbum = document.createElement("div");
            dummyAlbum.classList.add("album");
            dummyAlbum.classList.add("dummy");
    
            grid.appendChild(dummyAlbum);
        }
    } else if (dummyAlbumsToAdd < 0) {
        let dummyAlbumsToRemove = -1 * dummyAlbumsToAdd;
        for (let i = 0; i < dummyAlbumsToRemove; i++) {
            grid.removeChild(grid.lastElementChild);
        }
    }

    albums = grid.querySelectorAll(".album:not(.dummy)");

    if (albums.length === 0) {
        return;
    }

    let newHeight = `${albums[0].offsetWidth}px`;
    albums.forEach((album) => {
        album.style.height = newHeight;
        album.children[1].style.width = newHeight; // for giving the overlay the update in its width as well as height
    });
}

async function loadCredentials() {
    $("credentials-apikey-input").value = await window.lastfm.getAPIKey();
    $("credentials-apisecret-input").value = await window.lastfm.getAPISecret();
    $("credentials-popup").classList.add("shown");
}

async function saveCredentials() {
    let apiKey = $("credentials-apikey-input").value;
    let apiSecret = $("credentials-apisecret-input").value;

    if (!(apiKey.length === 32 && apiSecret.length === 32)) {
        $("credentials-popup").classList.remove("shown");
        return;
    }      

    window.lastfm.setAPIKey(apiKey);
    window.lastfm.setAPISecret(apiSecret);

    $("credentials-popup").classList.remove("shown");
}

async function startSession() {
    let isSession = await window.lastfm.isSession();

    if (isSession) {
        restoreSession();
    }
}

async function restoreSession() {
    let userinfo = await window.db.getUser();

    let username = userinfo.values[0][0];
    let pfp = userinfo.values[0][1];
    
    $("pfp-preview").src = pfp;
    $("user-info-pfp").src = pfp;
    $("user-info-name").innerText = username;
    
    $("account-sign-in-menu").classList.remove("shown");
    $("account-sign-out-menu").classList.add("shown");
}

async function signIn() {
    window.lastfm.createSession().then(async (userdata) => {
        return await window.db.setUser(userdata[0], userdata[1]);
    }).then(async () => {
        // just to ensure that the user info being displayed is actually saved to the db
        let userdata = await window.db.getUser();

        $("signin-popup").classList.remove("shown");

        let username = userdata.values[0][0];
        let pfp = userdata.values[0][1];

        $("pfp-preview").src = pfp;
        $("user-info-pfp").src = pfp;
        $("user-info-name").innerText = username;
    
        $("account-sign-in-menu").classList.remove("shown");
        $("account-sign-out-menu").classList.add("shown");
    });
}

async function signOut() {
    window.db.removeUser();
    window.lastfm.endSession();

    $("pfp-preview").src = "../img/default-pfp.png";
    $("user-info-pfp").src = "../img/default-pfp.png";

    $("account-sign-in-menu").classList.add("shown");
    $("account-sign-out-menu").classList.remove("shown");
}

function getCurrentTabDragTable() {
    if ($("queue-tab").classList.contains("active")) {
        return queueDragTable;
    } else if ($("manual-add-tab").classList.contains("active")) {
        return manualAddDragTable;
    }

    return null;
}

function removeDraggableRows(table) {
    let dragRows = table.tbody.querySelectorAll(".draggable-table__drag");
    for (let i = 0; i < dragRows.length; i++) {
        table.tbody.removeChild(dragRows[i]);
    }
}

function bindMouse() {
    document.addEventListener("mousedown", (event) => {
        if (event.button != 0) {
            return true;
        }
        
        let target = getTargetRow(event.target);
        if (target) {
            // find current active tab
            let table = getCurrentTabDragTable();

            if (!table) {
                return;
            }

            table.currRow = target;
            removeDraggableRows(table);
            addDraggableRow(table, target);
            table.currRow.classList.add("is-dragging");

            let coords = getMouseCoords(event);
            mouseDownX = coords.x;
            mouseDownY = coords.y;
            
            mouseDrag = true;   
        }
    });
    
    document.addEventListener("mousemove", (event) => {
        if (!mouseDrag) return;
        
        let coords = getMouseCoords(event);

        mouseX = coords.x - mouseDownX;
        mouseY = coords.y - mouseDownY;  

        let table = getCurrentTabDragTable();
        if (!table) {
            return;
        }
        
        moveRow(table, mouseX, mouseY);
    });
    
    document.addEventListener("mouseup", (event) => {
        if (!mouseDrag) {
            return;
        }

        let table = getCurrentTabDragTable();

        if (table.currRow) {
            table.currRow.classList.remove("is-dragging");
        }
        removeDraggableRows(table);
        table.dragElem = null;

        mouseDrag = false;
    });    
}

function swapRow(table, row, index) {
    let currIndex = Array.from(table.tbody.children).indexOf(table.currRow);
    let row1 = currIndex > index ? table.currRow : row;
    let row2 = currIndex > index ? row : table.currRow;
      
    table.tbody.insertBefore(row1, row2);

    if (table == manualAddDragTable) {
        reIndexRows(table);
    }
}

function reIndexRows(table) {
    let rows = table.tbody.querySelectorAll("tr:not(.draggable-table__drag)");

    for (let i = 0; i < rows.length; i++) {
        rows[i].children[1].innerText = i + 1;
    }
}
  
function moveRow(table, x, y) {
    table.dragElem.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    let	dPos = table.dragElem.getBoundingClientRect();
    let currStartY = dPos.y;
    let currEndY = currStartY + dPos.height;
    let rows = getRows(table);

    for (var i = 0; i < rows.length; i++) {
        let rowElem = rows[i];
        let rowSize = rowElem.getBoundingClientRect();
        let rowStartY = rowSize.y;
        let rowEndY = rowStartY + rowSize.height;

        if(table.currRow !== rowElem && isIntersecting(currStartY, currEndY, rowStartY, rowEndY)) {
        if(Math.abs(currStartY - rowStartY) < rowSize.height / 2)
            swapRow(table, rowElem, i);
        }
    }    
}

function addDraggableRow(table, target) {    
    table.dragElem = target.cloneNode(true);
    table.dragElem.classList.add("draggable-table__drag");
    table.dragElem.style.height = getStyle(target, "height");
    table.dragElem.style.background = getStyle(target, "backgroundColor");     

    for (var i = 0; i < target.children.length; i++) {
        let oldTD = target.children[i];
        let newTD = table.dragElem.children[i];

        newTD.style.width = getStyle(oldTD, "width");
        newTD.style.height = getStyle(oldTD, "height");
        newTD.style.padding = getStyle(oldTD, "padding");
        newTD.style.margin = getStyle(oldTD, "margin");
    }
  
    table.tbody.appendChild(table.dragElem);

    let tPos = target.getBoundingClientRect();
    let dPos = table.dragElem.getBoundingClientRect();
    table.dragElem.style.bottom = ((dPos.y - tPos.y) - tPos.height) + "px";
    table.dragElem.style.left = "-1px";

    document.dispatchEvent(
        new MouseEvent("mousemove", { 
            view: window,
            cancelable: true,
            bubbles: true 
        })
    );
}  

function getRows(table) {
    return table.tbody.querySelectorAll("tr");
}    

function getTargetRow(target) {
    let elemName = target.tagName.toLowerCase();

    if (elemName == 'tr') {
        return target;
    }

    if (elemName == 'td') {
        return target.closest('tr');
    }  
}

function getMouseCoords(event) {
    return {
        x: event.clientX,
        y: event.clientY
    };    
}

function getStyle(target, styleName) {
    let compStyle = getComputedStyle(target);
    let style = compStyle[styleName];

    return style ? style : null;
}

function isIntersecting(min0, max0, min1, max1) {
    return Math.max(min0, max0) >= Math.min(min1, max1) && Math.min(min0, max0) <= Math.max(min1, max1);
}

async function uploadManualAlbumCover(event) {
    const file = event.target.files[0];

    if (file) {
        let blob = await window.db.coverFromImage(file.path);
        const base64Image = uInt8ArrayToBase64(blob);
        let url = `url("data:image/jpeg;base64,${base64Image}")`
        $("ma-album-cover").style.backgroundImage = url;
    } else {
        $("ma-album-cover").style.backgroundImage = "";
    }
}

function createTrackInfoCols() {
    return [
        { // title
            "value": "",
            "placeholder": "Title"
        },
        { // artist
            "value": "",
            "placeholder": "Artist"
        },
        { // length
            "value": "3:00",
            "placeholder": "mm:ss"
        },
    ];
}

function addTrackInfoRow() {
    const albumArtist = $("ma-album-artist").value;
    
    let cols = createTrackInfoCols();
    cols[1].value = albumArtist ? albumArtist : "";

    let newTrack = createManualAddTrack(cols);
    manualAddDragTable.tbody.appendChild(newTrack);

    reIndexRows(manualAddDragTable);
}

async function saveManualAddAlbum() {
    let albumCover = $("ma-album-cover").style.backgroundImage;
    let albumTitle = $("ma-album-title").value;
    let albumArtist = $("ma-album-artist").value;

    // extract the base64 encoding for the cover from the url
    if (albumCover) {
        albumCover = albumCover.split("base64,")[1];
        albumCover = albumCover.split("\")")[0];
        albumCover = base64ToUint8Array(albumCover);
    } else {
        albumCover = null;
    }

    let albumID = await window.db.addAlbum(albumArtist, albumTitle, albumCover);
    if (!albumID) {
        return;
    }

    await window.db.clearTracks(albumID);
    let tracks = manualAddDragTable.tbody.querySelectorAll("tr");

    let tracksInAlbum = [];
    tracks.forEach(track => {
        let tds = track.children;
        let trackNum = tds[1].innerText;
        let trackTitle = tds[2].children[0].value;
        let trackArtist = tds[3].children[0].value;
        let trackLength = tds[4].children[0].value;

        tracksInAlbum.push({
            "num": trackNum,
            "title": trackTitle,
            "artist": trackArtist,
            "length": trackLength
        });
    });

    await window.db.addAlbumTracks(albumID, tracksInAlbum);

    resetManualAddAlbum();

    addAlbumToCollectionGrid(albumID);
}

function resetManualAddAlbum() {
    $("ma-album-title").value = "";
    $("ma-album-artist").value = "";
    $("ma-album-cover").style.backgroundImage = "";
    $("ma-album-cover-input").value = ""; // ensures that resubmitting the same image again later counts as a 'change' event

    manualAddDragTable.tbody.innerHTML = ``;
    manualAddDragTable.tbody.appendChild(createManualAddTrack(null));
    reIndexRows(manualAddDragTable);
}

// cols contains the values and placeholders for each item in a track
// when null, defaults are applied
function createManualAddTrack(cols) {
    // default
    if (!cols) {
        cols = createTrackInfoCols();
    }

    let row = document.createElement("tr");
    
    let rowDeleteButton = document.createElement("td");
    let rowDeleteIcon = document.createElement("img");
    rowDeleteIcon.classList.add("filter-white");
    rowDeleteIcon.classList.add("track-info-x");
    rowDeleteIcon.setAttribute("src", "../img/icons/x.svg");
    rowDeleteIcon.addEventListener("click", (event) => {
        manualAddDragTable.tbody.removeChild(event.target.parentNode.parentNode);
        reIndexRows(manualAddDragTable);
    });
    rowDeleteButton.appendChild(rowDeleteIcon);

    row.appendChild(rowDeleteButton); // row delete button
    row.appendChild(document.createElement("td")); // track number

    cols.forEach(col => {
        let newTD = document.createElement("td");

        let inputField = document.createElement("input");
        inputField.classList.add("entry-field");
        inputField.setAttribute("type", "text");
        inputField.setAttribute("value", col["value"]);
        inputField.setAttribute("placeholder", col["placeholder"]);

        newTD.appendChild(inputField);
        row.appendChild(newTD);
    });

    let lengthInput = row.children[4];
    lengthInput.addEventListener("input", (event) => {
        let inputField = event.target;
        const isValid = isValidTime(inputField.value)
        if (isValid) {
            inputField.classList.remove("invalid");
        } else {
            inputField.classList.add("invalid")
        }
    });

    return row;
}

function isValidTime(time) {
    const regex = /^\d{1,2}:\d{2}$/;

    if (!time) {
        return true;
    }

    if (regex.test(time)) {
        let timeTokens = time.split(":");
        if (timeTokens[1] >= 60) { // more than 59 seconds, ex 4:71 is invalid
            return false;
        } else {
            return true;
        }
    } else { // incorrect format
        return false;
    }
}

function minutesToSeconds(time) {
    if (!isValidTime(time)) {
        return null;
    }

    let timeTokens = time.split(":");
    return (parseInt(timeTokens[1]) + 60 * parseInt(timeTokens[0]));
}

function createQueueTrack(queueItem) {
    let row = document.createElement("tr");

    let rowDeleteButton = document.createElement("td");
    let rowDeleteIcon = document.createElement("img");
    rowDeleteIcon.classList.add("filter-white");
    rowDeleteIcon.classList.add("track-info-x");
    rowDeleteIcon.setAttribute("src", "../img/icons/x.svg");
    rowDeleteIcon.addEventListener("click", (event) => {
        queueDragTable.tbody.removeChild(event.target.parentNode.parentNode);

        let index = queueContents.indexOf(queueItem);
        if (index !== -1) {
            queueContents.splice(index, 1);
        }
    });
    rowDeleteButton.appendChild(rowDeleteIcon);

    row.appendChild(rowDeleteButton); // row delete button

    let albumCoverTD = document.createElement("td");
    let albumCover = document.createElement("div");
    albumCover.style.backgroundImage = queueItem.coverURL;
    albumCover.classList.add("cover-preview");
    albumCoverTD.appendChild(albumCover);
    row.appendChild(albumCoverTD);

    let cols = queueItem.getColFormat();

    for (let i = 1; i < cols.length; i++) {
        let col = cols[i];

        let newTD = document.createElement("td");

        let textField = document.createElement("span");
        textField.innerText = col;

        newTD.appendChild(textField);
        row.appendChild(newTD);
    };

    return row;
}

async function addQueueTrack(queueTrack) {
    if (!queueTrack.coverURL) {
        let defaultCover = await window.db.coverFromImage("img/default-cover.png");
        let base64 = uInt8ArrayToBase64(defaultCover);
        queueTrack.coverURL = `url("data:image/jpg;base64,${base64}")`;
    }

    queueContents.push(queueTrack);
    refreshQueueRows();
}

function refreshQueueRows() {
    queueDragTable.tbody.innerHTML = "";

    queueContents.forEach(qt => {
        queueDragTable.tbody.appendChild(createQueueTrack(qt))
    });
}

async function scrobbleQueue() {
    let nextScrobbleTime = Date.now() / 1000;

    while (queueContents.length > 0) {
        let trackTitles = [];
        let trackArtists = [];
        let albumTitles = [];
        let albumArtists = [];
        let timestamps = [];
        
        // one call to the track.scrobble endpoint can handle 50 tracks, maximum
        let i = 0;
        // prepare scrobble data
        for (i = 0; i < 50; i++) {
            let index = queueContents.length - (i + 1); // index of track to be prepared for scrobbling
            if (index < 0) {
                break;
            }
            
            let queueItem = queueContents[index];

            trackTitles.push(queueItem.title);
            trackArtists.push(queueItem.artist);
            albumTitles.push(queueItem.album);
            albumArtists.push(queueItem.albumArtist);
            timestamps.push(nextScrobbleTime);

            nextScrobbleTime -= minutesToSeconds(queueItem.trackLength)
        }

        // send scrobbles
        let success = await window.lastfm.sendScrobbles(trackTitles, trackArtists, albumTitles, albumArtists, timestamps);

        if (success) {
            queueContents = queueContents.slice(0, -i);
        } else {
            refreshQueueRows();
            break;
        }

        refreshQueueRows();
    }
}