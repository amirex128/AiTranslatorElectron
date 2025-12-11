export class UndoRedoManager<T> {
  private undoStack: T[] = [];
  private redoStack: T[] = [];
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  push(state: T): void {
    this.undoStack.push(state);
    this.redoStack = []; // Clear redo stack when new action is performed

    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
  }

  undo(): T | null {
    if (this.undoStack.length === 0) {
      return null;
    }

    const current = this.undoStack.pop();
    if (current !== undefined) {
      this.redoStack.push(current);
      return this.undoStack[this.undoStack.length - 1] || null;
    }

    return null;
  }

  redo(): T | null {
    if (this.redoStack.length === 0) {
      return null;
    }

    const state = this.redoStack.pop();
    if (state !== undefined) {
      this.undoStack.push(state);
      return state;
    }

    return null;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}

