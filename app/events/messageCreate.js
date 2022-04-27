const { User } = require("../db/models");

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (!guildMember.user.bot)
        User.findCreateFind({ where: { username: message.author.tag, guild: message.guild.id } })
            .then(([user, isNew]) => user.increment('balance'));
    }
}