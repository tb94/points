const { User } = require("../db/models");

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        const t = Date.now();
        console.log(`${oldState.member.user.username} going from ${oldState.channelId} to ${newState.channelId} as ${newState.member.user.username}`);

        // joining a voice chat
        if (oldState.channelId == null) {
            User.findCreateFind({ where: { username: newState.member.user.tag, guild: newState.guild.id } })
                .then(u => u.createVoiceState({ channelId: newState.channelId, timestamp: t }))
                .catch(err => console.error(err));
        }

        // leaving a voice chat
        if (newState.channelId == null || newState.channelId == newState.guild.afkChannelId) {
            let user = await User.findCreateFind({ where: { username: oldState.member.user.tag, guild: oldState.guild.id } });
            let voiceState = await user.getVoiceState();
            let minutes = Math.floor((t - voiceState.timestamp) / 60000);
            voiceState.destroy();
            user.setVoiceState(null);
            user.increment('balance', { by: minutes });
        }
    }
}