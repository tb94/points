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

function joinChat(newState) {
    const t = Date.now();

    console.log(`${newState.member.user.username} is joining chat in ${newState.guild.id}`)
    if (!newState.member.user.bot)
    return User.findCreateFind({ where: { username: newState.member.user.tag, guild: newState.guild.id } })
        .then(([u]) => u.set('voiceActivity', t))
        .then(u => u.save())
        .catch(err => console.error(err));
}

function leaveChat(oldState) {
    if (!oldState.member.user.bot)
    return User.findCreateFind({ where: { username: oldState.member.user.tag, guild: oldState.guild.id } })
        .then(([u]) => u.set('voiceActivity', null))
        .then(u => u.save())
        .catch(err => console.error(err));
}