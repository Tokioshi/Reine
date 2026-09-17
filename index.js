import { handleFetch } from "./events/fetch.js";
import { handleScheduled } from "./events/scheduled.js";

export default {
    fetch: handleFetch,
    scheduled: handleScheduled,
};
