const { User } = require("../db/models");

module.exports = {
    name: 'guildMemberAdd',
    async execute(guildMember) {
        await User.findOrCreate({
            where: { username: guildMember.user.tag }
        });
    }
}