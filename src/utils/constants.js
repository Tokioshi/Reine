export const InteractionType = {
    PING: 1,
    APPLICATION_COMMAND: 2,
    APPLICATION_COMMAND_AUTOCOMPLETE: 4,
    MODAL_SUBMIT: 5,
};

export const InteractionResponseType = {
    PONG: 1,
    CHANNEL_MESSAGE_WITH_SOURCE: 4,
    DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
    APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
    MODAL: 9,
};

export const ComponentType = {
    TEXT_INPUT: 4,
    LABEL: 18,
    FILE_UPLOAD: 19,
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
