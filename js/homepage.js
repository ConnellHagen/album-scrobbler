let $ = (id) => document.getElementById(id);

let blobToBase64 = (blob) => {
    const binary = new Uint8Array(blob);
    let binaryString = "";

    binary.forEach(byte => {
        binaryString += String.fromCharCode(byte);
    });

    return btoa(binaryString);  // Convert binary string to base64
}

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

function switchToTab(tabname) {

    console.log("here");
    let tabButtons = document.querySelectorAll(".tab-btn");
    let tabContents = document.querySelectorAll(".content-display .tab-content");

    for (let i = 0; i < tabContents.length; i++) {
        // if the tab is currently active, disable it
        if (tabContents[i].classList.contains("active")) {
            tabButtons[i].classList.remove("active");
            tabContents[i].classList.remove("active");
        }

        // if the tab is the one being switched to, activate it
        if (tabContents[i].id === tabname) {
            tabButtons[i].classList.add("active");
            tabContents[i].classList.add("active");
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
}
