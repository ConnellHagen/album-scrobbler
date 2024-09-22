let $ = (id) => document.getElementById(id); 

let blobToBase64 = (blob) => {
    const binary = new Uint8Array(blob);
    let binaryString = '';
    
    binary.forEach(byte => {
        binaryString += String.fromCharCode(byte);
    });

    return btoa(binaryString);  // Convert binary string to base64
}

window.addEventListener('DOMContentLoaded', async () => {
    // window.db.test();
    fillGrid();
});

async function fillGrid() {
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
        console.log(url)
        albumCard.style.backgroundImage = url;

        grid.appendChild(albumCard);
    }
}