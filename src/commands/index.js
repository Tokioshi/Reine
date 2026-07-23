import watch from "./watch.js";
import unwatch from "./unwatch.js";
import list from "./list.js";
import clear from "./clear.js";
import ban from "./ban.js";
import message from "./message.js";

// To add a new command: create commands/<name>.js exporting
// { name, definition, execute, autocomplete? }, then register it here.
const all = [watch, unwatch, list, clear, ban, message];

export const COMMANDS = Object.fromEntries(
    all.map((command) => [
        command.name,
        { execute: command.execute, autocomplete: command.autocomplete },
    ]),
);

export const slashCommands = all.map(({ name, definition }) => ({ name, ...definition }));

export const MODAL_HANDLERS = Object.fromEntries(
    all
        .filter((command) => command.modalId)
        .map((command) => [command.modalId, command.handleModalSubmit]),
);
