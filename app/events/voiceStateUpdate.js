const { User, VoiceState } = require("../db/models");

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        if ((oldState.channel.id == null || oldState.channel.id == oldState.guild.afkChannel.id)
            && (newState.channel.id != null || newState.channel.id == newState.guild.afkChannel.id)) {
            await joinChat(newState);
        } else if ((newState.channel.id == null || newState.channel.id == newState.guild.afkChannel.id)
        && (oldState.channel.id != null || oldState.channel.id == oldState.guild.afkChannel.id)) {
            await leaveChat
        } else if (oldState.guild.id != newState.guild.id) {
            await leaveChat(oldState).then(() => joinChat(newState));
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

    return User.findOne({ where: { username: oldState.member.user.tag, guild: oldState.guild.id }, include: VoiceState })
        .then(([user]) => user.getVoiceState()
            .then(voiceState => user.increment('balance', { by: Math.floor((t - (voiceState?.timestamp ?? t)) / 60000) })
                .then(() => voiceState?.destroy())))
        .catch(err => console.error(err));
}