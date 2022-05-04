const { User } = require("../db/models");

module.exports = {
    name: 'guildMemberAdd',
    async execute(guildMember) {
        if (!guildMember.user.bot)
            await User.findCreateFind({
                where: { username: guildMember.user.tag, guild: guildMember.guild.id }
            });
    }
}