const { User, sequelize } = require('../db/models');
const { Collection, OAuth2Guild } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        // fetching guilds returns Collection of OAuth2Guilds which don't contain members
        let oauth2Guilds = await client.guilds.fetch({ force: true });
        const t = await sequelize.transaction();

        // oauth2guild can fetch the full Guild object, then fetch all users in the guild and populate the database
        oauth2Guilds.forEach(pg => pg.fetch()
            .then(g => g.members.fetch({ force: true }))
            .then(members => {
                return Promise.all(members.filter(m => !m.user.bot).map(async (member) => {
                    return User.findCreateFind({
                        where: { username: member.user.tag, guild: member.guild.id }
                    });
                }));
            }))
            .catch(err => console.err(err));

        console.log(`Ready! Logged in as ${client.user.tag}`);
    },
};
