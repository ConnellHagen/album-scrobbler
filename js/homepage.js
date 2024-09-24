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
    "manual-add-tab": 0,
    "search-tab": 0
};

window.addEventListener("DOMContentLoaded", async () => {
    $("collection-tab-btn").addEventListener("click", (event) => {
        event.preventDefault();
        switchToTab("collection-tab");
    });

    $("manual-add-tab-btn").addEventListener("click", (event) => {
        event.preventDefault();
        switchToTab("manual-add-tab");
    });

    $("search-tab-btn").addEventListener("click", (event) => {
        event.preventDefault();
        switchToTab("search-tab");
    });

    fillCollectionGrid();
});

window.addEventListener('resize', async () => {
    adjustCollectionGridSize();
});

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

    // for (let i = 0; i < 24; i++) {
    //     let albumCard = document.createElement("div");
    //     albumCard.classList.add("album");
    //     grid.appendChild(albumCard);
    // }

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
