// src/lib/commandBus.ts
type CommandHandler = (payload?: any) => void;

class CommandBus {
  private handlers: Record<string, CommandHandler[]> = {};

  on(id: string, handler: CommandHandler) {
    if (!this.handlers[id]) this.handlers[id] = [];
    this.handlers[id].push(handler);
  }

  off(id: string, handler: CommandHandler) {
    this.handlers[id] = (this.handlers[id] || []).filter((h) => h !== handler);
  }

  dispatch(id: string, payload?: any) {
    (this.handlers[id] || []).forEach((h) => h(payload));
  }
}

export const commandBus = new CommandBus();
