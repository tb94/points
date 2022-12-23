const { Events } = require("discord.js");
const { User } = require("../db/models");

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        let oldChannelId = oldState.channelId ?? oldState.channel?.id;
        let newChannelId = newState.channelId ?? newState.channel?.id;

        if (oldChannelId == newChannelId) {
            // no change
        } else if (newChannelId == null) {
            // disconnect
            await leaveChat(oldState);
        } else if (newChannelId == newState.guild.afkChannelId ?? oldState.guild.afkChannel?.id) {
            // moved to afk
            await leaveChat(oldState);
        } else if (oldChannelId == null) {
            // fresh join
            await joinChat(newState);
        } else if (oldChannelId == oldState.guild.afkChannelId ?? oldState.guild.afkChannel?.id) {
            // join from afk
            await joinChat(newState);
        } else if (oldState.guild.id == newState.guild.id) {
            // join from another channel in the same guild 
        } else {
            console.error("something weird happened with voice state")
            console.error("oldState: %s", JSON.stringify(oldState, undefined, 2));
            console.error("newState: %s", JSON.stringify(newState, undefined, 2));
        }
    }
}

function joinChat(voiceState) {
    const t = Date.now();
    if (!voiceState.member.user.bot)
        return User.findCreateFind({
            where: { snowflake: voiceState.member.user.id, guild: voiceState.guild.id },
            defaults: { username: voiceState.member.user.tag }
        })
            .then(([u]) => u.update({ voiceActivity: t }))
            .catch(err => console.error(err));
}

function leaveChat(voiceState) {
    if (!voiceState.member.user.bot)
        return User.findCreateFind({
            where: { snowflake: voiceState.member.user.id, guild: voiceState.guild.id },
            defaults: { username: voiceState.member.user.tag }
        })
            .then(([u]) => u.update({ voiceActivity: null }))
            .catch(err => console.error(err));
}