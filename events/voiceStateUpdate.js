const { User, VoiceState } = require("../db/models");

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        const t = Date.now();
        console.log(`${oldState.member.user.username} going from ${oldState.channelId} to ${newState.channelId} as ${newState.member.user.username}`);

        // joining a voice chat
        if (oldState.channelId == null) {
            User.findOne({ where: { username: oldState.member.user.tag } })
                .then(u => u.createVoiceState({ channelId: newState.channelId, timestamp: t }))
                .catch(err => console.error(err));
        }

        // leaving a voice chat
        if (newState.channelId == null) {
            let user = await User.findOne({ where: { username: oldState.member.user.tag } });
            let voiceState = await user.getVoiceState();
            let minutes = Math.floor((t - voiceState.timestamp) / 60000);
            voiceState.destroy();
            user.setVoiceState(null);
            user.increment('balance', { by: minutes });
        }
    }
}