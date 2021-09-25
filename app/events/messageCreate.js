const { User } = require("../db/models");

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // author gets points 
        if (message.author.bot) return;

        User.findCreateFind({ where: { username: message.author.tag, guild: message.guild.id } })
            .then(([user, isNew]) => user.increment('balance'));
    }
}