const { User } = require("../db/models");

module.exports = {
    name: 'guildMemberRemove',
    async execute(guildMember) {
        await User.destroy({
            where: { snowflake: guildMember.user.id, guild: guildMember.guild.id }
        });
    }
}