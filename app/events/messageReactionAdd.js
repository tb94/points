const { Events } = require("discord.js");
const { User } = require("../db/models");

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(messageReaction, user) {
        let reactionUser = user;
        let messageAuthor = messageReaction.message.author;
        let guild = messageReaction.message.guild;

        if (messageAuthor.id === reactionUser.id) return;

        if (!messageAuthor.bot) {
            await User.findCreateFind({
                where: { snowflake: messageAuthor.id, guild: guild.id },
                defaults: { username: messageAuthor.tag }
            }).then(([u]) => u.increment('balance'));
        }

        if (!reactionUser.bot) {
            await User.findCreateFind({
                where: { snowflake: reactionUser.id, guild: guild.id },
                defaults: { username: reactionUser.tag }
            }).then(([u]) => u.increment('balance'));
        }
    }
}