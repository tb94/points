const { User } = require("../db/models");

module.exports = {
    name: 'guildMemberAdd',
    async execute(guildMember) {
        await User.findCreateFind({
            where: { username: guildMember.user.tag, guild: guildMember.guild.id }
        });
    }
}