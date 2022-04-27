const { User } = require("../db/models");

module.exports = {
    name: 'guildMemberRemove',
    async execute(guildMember) {
        await User.destroy({
            where: { username: guildMember.user.tag, guild: guildMember.guild.id }
        });
    }
}