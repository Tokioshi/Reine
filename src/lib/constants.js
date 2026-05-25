export const InteractionType = {
    PING: 1,
    APPLICATION_COMMAND: 2,
    APPLICATION_COMMAND_AUTOCOMPLETE: 4,
};

export const InteractionResponseType = {
    PONG: 1,
    CHANNEL_MESSAGE_WITH_SOURCE: 4,
    DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
    APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
};

export const MessageFlags = {
    EPHEMERAL: 64,
};

export const JsonHeaders = {
    "Content-Type": "application/json; charset=utf-8",
};
