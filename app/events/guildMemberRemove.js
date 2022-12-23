const { Events } = require("discord.js");
const { User } = require("../db/models");

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(guildMember) {
        await User.destroy({
            where: { snowflake: guildMember.user.id, guild: guildMember.guild.id }
        });
    }
}