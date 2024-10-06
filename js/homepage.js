let $ = (id) => document.getElementById(id);

let blobToBase64 = (blob) => {
    const binary = new Uint8Array(blob);
    let binaryString = "";

    binary.forEach(byte => {
        binaryString += String.fromCharCode(byte);
    });

    return btoa(binaryString);  // Convert binary string to base64
}

let scrollPositions = {
    "collection-tab": 0,
    "search-tab": 0,
    "manual-add-tab": 0,
    "queue-tab": 0
};

window.addEventListener("DOMContentLoaded", async () => {
    let tabs = ["collection", "search", "manual-add", "queue"];
    for (let i = 0; i < tabs.length; i++) {
        $(`${tabs[i]}-tab-btn`).addEventListener("click", (event) => {
            switchToTab(`${tabs[i]}-tab`);
        });
    }

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

    startSession();

    fillCollectionGrid();
});

window.addEventListener("resize", async () => {
    adjustCollectionGridSize();
});

window.onclick = (event) => {
    if (!(event.target.matches(".dropbtn") || event.target.matches(".dropbtn *") || event.target.matches(".dropmenu"))) {
        let dropmenus = document.querySelectorAll('.dropmenu');
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
        let artist = album[1];
        let title = album[2];
        let coverBlob = album[3];

        const base64Image = blobToBase64(coverBlob);
        let url = `url('data:image/jpg;base64,${base64Image}')`

        let albumCard = document.createElement("div");
        albumCard.classList.add("album");
        albumCard.style.backgroundImage = url;

        grid.appendChild(albumCard);
    }

    adjustCollectionGridSize();
}

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

    albums = grid.childNodes;

    if (albums.length === 0)
        return;

    let newHeight = `${albums[0].offsetWidth}px`;
    albums.forEach((album) => {
        album.style.height = newHeight;
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
