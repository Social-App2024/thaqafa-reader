import { api } from "./client.js";

    async function shareQuote(data) {
        // Convert data URL to File object
        const file = dataURLtoFile(data.imageUrl, "quote.png");

        // Upload quote image to server using FormData
        const formData = new FormData();
        formData.append("file", file);
        formData.append("container", "tmp");

        // Future: Upload to server and publish
        const uploadResponse = await api.post("/assets/upload", formData);
        console.log("file uploaded");

        const url = uploadResponse.data?.url || uploadResponse.data;
        console.log('[ShareQuote] Extracted URL:', url);
        if (!url) {
            throw new Error('Upload succeeded but no URL returned from server');
        }

        const publishResponse = await api.post("/posts/publish",{
            profileId:"66b7a5025cf5d67e2eeaa110",
            category:"photo",
            imagesUrls:[url],
            tags: ["book","quote"]
        });
        console.log("post published");
    }

function dataURLtoFile(dataUrl, filename) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
}

export default shareQuote