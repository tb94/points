const { Events } = require("discord.js");
const { User } = require("../db/models");

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(guildMember) {
        if (!guildMember.user.bot)
            await User.findCreateFind({
                where: { snowflake: guildMember.user.id, guild: guildMember.guild.id },
                defaults: { username: guildMember.user.tag }
            });
    }
}