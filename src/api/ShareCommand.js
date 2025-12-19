import { api } from "./client.js";
import Command from "./Command.js";

class ShareCommand extends Command {
    constructor(imageUrl, text, bookTitle, bookAuthor) {
        super();
        this.imageUrl = imageUrl;
        this.text = text;
        this.bookTitle = bookTitle;
        this.bookAuthor = bookAuthor;
    }

    async execute() {
        // Download the quote image
        // const link = document.createElement('a');
        // link.download = 'quote.png';
        // link.href = this.imageUrl;
        // link.click();

        alert("shared highlighted text");

        // Future: Upload to server and publish
        // const { url } = await api.post("/assets/upload",{
        //     file: this.imageUrl,
        //     container: "quotes"
        // });
        // const { post } = await api.post("/posts/publish",{
        //     profileId:"66b7a5025cf5d67e2eeaa110",
        //     category:"photo",
        //     imagesUrls:[url],
        //     tags: ["book","quote"],
        //     caption: `"${this.text}" - ${this.bookTitle} by ${this.bookAuthor}`
        // });
    }

    async undo() {
        // Share/download actions cannot be undone
        console.log("Share action cannot be undone");
    }
}

export default ShareCommand