class Command {
  constructor() {
    // Subclasses can initialize state here
  }

  async execute() {
    throw new Error('execute() must be implemented by subclass')
  }

  async undo() {
    throw new Error('undo() must be implemented by subclass')
  }
}

export default Command
