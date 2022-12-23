const { Events } = require("discord.js");
const { User } = require("../db/models");

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (!message.author.bot)
            User.findCreateFind({
                where: { snowflake: message.author.id, guild: message.guild.id },
                defaults: { username: message.author.tag }
            }).then(([user]) => user.increment('balance'));
    }
}