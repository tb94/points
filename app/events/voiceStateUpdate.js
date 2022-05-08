const { User } = require("../db/models");

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        if ((oldState.channel?.id == null || oldState.channel?.id == oldState.guild?.afkChannel.id)
            && (newState.channel?.id != null || newState.channel?.id == newState.guild?.afkChannel.id)) {
            await joinChat(newState);
        } else if ((newState.channel?.id == null || newState.channel?.id == newState.guild?.afkChannel.id)
            && (oldState.channel?.id != null || oldState.channel?.id == oldState.guild?.afkChannel.id)) {
            await leaveChat(oldState);
        } else if (oldState.guild?.id != newState.guild?.id) {
            await leaveChat(oldState).then(() => joinChat(newState));
        } else {
            console.error("something weird happened with voiceStateUpdate");
        }
    }
}

function joinChat(state) {
    const t = Date.now();
    if (!state.member.user.bot)
        return User.findCreateFind({
            where: { snowflake: state.member.user.id, guild: state.guild.id },
            defaults: { username: state.member.user.tag }
        })
            .then(([u]) => u.set('voiceActivity', t))
            .then(u => u.save())
            .catch(err => console.error(err));
}

function leaveChat(state) {
    if (!state.member.user.bot)
        return User.findCreateFind({
            where: { snowflake: state.member.user.id, guild: state.guild.id },
            defaults: { username: state.member.user.tag }
        })
            .then(([u]) => u.set('voiceActivity', null))
            .then(u => u.save())
            .catch(err => console.error(err));
}