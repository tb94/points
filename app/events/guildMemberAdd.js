const { User } = require("../db/models");

module.exports = {
    name: 'guildMemberAdd',
    async execute(guildMember) {
        if (!guildMember.user.bot)
            await User.findCreateFind({
                where: { snowflake: guildMember.user.id, guild: guildMember.guild.id },
                defaults: { username: guildMember.user.tag }
            });
    }
}