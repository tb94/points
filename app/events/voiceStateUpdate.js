const { User, VoiceState } = require("../db/models");

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        console.log(`${oldState.member.user.username} going from ${oldState.channelId} to ${newState.channelId} as ${newState.member.user.username}`);

        // switching guilds (create new voice state and destry old)
        if (oldState.guild.id !== newState.guild.id) {
            leaveChat(oldState).then(() => joinChat(newState));
            return;
        }

        // joining a voice chat
        if (oldState.channelId == null) {
            joinChat(newState);
            return;
        }

        // leaving a voice chat
        if (newState.channelId == null || newState.channelId == newState.guild.afkChannelId) {
            leaveChat(oldState);
            return;
        }
    }
}

function joinChat(newState) {
    const t = Date.now();

    return User.findCreateFind({ where: { username: newState.member.user.tag, guild: newState.guild.id } })
        .then(([u]) => u.createVoiceState({ channelId: newState.channelId, timestamp: t }))
        .catch(err => console.error(err));
}

function leaveChat(oldState) {
    const t = Date.now();

    return User.findCreateFind({ where: { username: oldState.member.user.tag, guild: oldState.guild.id }, include: VoiceState })
        .then(([user]) => user.getVoiceState()
            .then(voiceState => user.increment('balance', { by: Math.floor((t - (voiceState?.timestamp ?? t)) / 60000) })
                .then(() => voiceState?.destroy())))
        .catch(err => console.error(err));
}