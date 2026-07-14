export const slashCommands = [
    {
        name: "watch",
        description: "Add an anime to the notification watchlist.",
        default_member_permissions: "8",
        options: [
            {
                name: "anime",
                description: "Search for an anime by title",
                type: 3,
                required: true,
                autocomplete: true,
            },
        ],
    },
    {
        name: "unwatch",
        description: "Remove an anime from the watchlist.",
        default_member_permissions: "8",
        options: [
            {
                name: "anime",
                description: "Pick an anime from your watchlist",
                type: 3,
                required: true,
                autocomplete: true,
            },
        ],
    },
    {
        name: "list",
        description: "Show all anime currently on the watchlist.",
    },
];
