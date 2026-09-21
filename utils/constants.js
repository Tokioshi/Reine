export const InteractionType = {
    PING: 1,
    APPLICATION_COMMAND: 2,
    MESSAGE_COMPONENT: 3,
    APPLICATION_COMMAND_AUTOCOMPLETE: 4,
    MODAL_SUBMIT: 5,
};

export const InteractionResponseType = {
    PONG: 1,
    CHANNEL_MESSAGE_WITH_SOURCE: 4,
    DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
    DEFERRED_UPDATE_MESSAGE: 6,
    UPDATE_MESSAGE: 7,
    APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
    MODAL: 9,
};

export const ComponentType = {
    ACTION_ROW: 1,
    BUTTON: 2,
    STRING_SELECT: 3,
    TEXT_INPUT: 4,
    LABEL: 18,
    FILE_UPLOAD: 19,
};

export const ButtonStyle = {
    PRIMARY: 1,
    SECONDARY: 2,
    SUCCESS: 3,
    DANGER: 4,
    LINK: 5,
};

export const ChannelType = {
    GUILD_TEXT: 0,
    PRIVATE_THREAD: 12,
};

export const PermissionFlags = {
    ADMINISTRATOR: 1n << 3n,
    MANAGE_THREADS: 1n << 34n,
};

export const TextInputStyle = {
    SHORT: 1,
    PARAGRAPH: 2,
};

export const MessageFlags = {
    EPHEMERAL: 64,
};

export const JsonHeaders = {
    "Content-Type": "application/json; charset=utf-8",
};
