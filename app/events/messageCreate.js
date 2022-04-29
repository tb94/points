const { User } = require("../db/models");

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (!message.author.bot)
        User.findCreateFind({ where: { username: message.author.tag, guild: message.guild.id } })
            .then(([user, isNew]) => user.increment('balance'))
            .then(() => console.log(message.content));
    }
}