import ShareCommand from "./ShareCommand.js";

/**
 * Factory for creating command objects
 * Decouples UI components from concrete command implementations
 */
class CommandFactory {
  /**
   * Creates a share command
   * @param {Object} params - Command parameters
   * @param {string} params.imageUrl - URL of the image to share
   * @param {string} params.text - Text content to share
   * @param {string} params.bookTitle - Book title
   * @param {string} params.bookAuthor - Book author
   * @returns {ShareCommand} The share command instance
   */
  createShareCommand({ imageUrl, text, bookTitle, bookAuthor }) {
    return new ShareCommand(imageUrl, text, bookTitle, bookAuthor);
  }

  /**
   * Creates a command by type (extensible for future command types)
   * @param {string} type - Command type ('share', 'highlight', etc.)
   * @param {Object} params - Command parameters
   * @returns {Command} The command instance
   */
  createCommand(type, params) {
    switch (type) {
      case 'share':
        return this.createShareCommand(params);
      // Future commands can be added here:
      // case 'highlight':
      //   return this.createHighlightCommand(params);
      default:
        throw new Error(`Unknown command type: ${type}`);
    }
  }
}

// Export singleton instance
export default new CommandFactory();
