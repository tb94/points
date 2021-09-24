const { User } = require("../db/models");

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // author gets points 
        if (message.author.bot) return;

        let user = await User.findOne({ where: { username: message.author.tag } });
        if (!user) return;
        await user.increment('balance');
    }
}