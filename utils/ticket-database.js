export async function getActiveTicket(db, guildId, ownerId) {
    return db
        .prepare(
            `SELECT * FROM tickets
             WHERE guild_id = ? AND owner_id = ?
               AND status IN ('creating', 'open', 'closing')
             ORDER BY id DESC
             LIMIT 1`,
        )
        .bind(guildId, ownerId)
        .first();
}

export async function getTicketByThreadId(db, threadId) {
    return db.prepare("SELECT * FROM tickets WHERE thread_id = ? LIMIT 1").bind(threadId).first();
}

export async function createTicketReservation(
    db,
    { interactionId, guildId, parentChannelId, ownerId, type, service, details },
) {
    const result = await db
        .prepare(
            `INSERT INTO tickets (
                interaction_id, guild_id, parent_channel_id, owner_id, type, service, details
             ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(interactionId, guildId, parentChannelId, ownerId, type, service, details)
        .run();

    return db.prepare("SELECT * FROM tickets WHERE id = ?").bind(result.meta.last_row_id).first();
}

export async function attachThread(db, ticketId, threadId) {
    await db
        .prepare(
            `UPDATE tickets
             SET thread_id = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND status = 'creating'`,
        )
        .bind(threadId, ticketId)
        .run();
}

export async function markTicketOpen(db, ticketId, starterMessageId) {
    await db
        .prepare(
            `UPDATE tickets
             SET starter_message_id = ?, status = 'open', updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND status = 'creating'`,
        )
        .bind(starterMessageId, ticketId)
        .run();
}

export async function beginTicketClose(db, ticketId, closedBy, reason) {
    const result = await db
        .prepare(
            `UPDATE tickets
             SET status = 'closing', closed_by = ?, close_reason = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND status = 'open'`,
        )
        .bind(closedBy, reason, ticketId)
        .run();

    return result.meta.changes === 1;
}

export async function markTicketClosed(db, ticketId) {
    await db
        .prepare(
            `UPDATE tickets
             SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND status IN ('open', 'closing')`,
        )
        .bind(ticketId)
        .run();
}

export async function markTicketFailed(db, ticketId, reason) {
    await db
        .prepare(
            `UPDATE tickets
             SET status = 'failed', close_reason = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND status = 'creating'`,
        )
        .bind(reason.slice(0, 1000), ticketId)
        .run();
}

export async function getRecoverableTickets(db, limit = 25) {
    const { results } = await db
        .prepare(
            `SELECT * FROM tickets
             WHERE (status = 'creating' AND updated_at < datetime('now', '-15 minutes'))
                OR status = 'closing'
             ORDER BY updated_at ASC
             LIMIT ?`,
        )
        .bind(limit)
        .all();

    return results ?? [];
}
