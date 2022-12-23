const { User, Blackjack, sequelize, Op } = require('../db/models');
const { Collection, OAuth2Guild, Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        // fetching guilds returns Collection of OAuth2Guilds which don't contain members
        let oauth2Guilds = await client.guilds.fetch({ force: true });

        // oauth2guild can fetch the full Guild object, then fetch all users in the guild and populate the database
        // oauth2Guilds.forEach(pg => pg.fetch()
        //     .then(g => g.members.fetch({ force: true }))
        //     .then(members => {
        //         return Promise.all(members.filter(m => !m.user.bot).map(async (member) => {
        //             return User.findCreateFind({
        //                 where: { username: member.user.tag, guild: member.guild.id, balance: 1000 },
        //                 defaults: { balance: 1000 }
        //             });
        //         }));
        //     })
        //     .then(() => console.log("Database populated"))
        //     .catch(err => console.error(err)));

        // await User.findAll({ where: { snowflake: null } })
        //     .then(users => {
        //         oauth2Guilds.forEach(pg => pg.fetch()
        //             .then(g => g.members.fetch({ force: true }))
        //             .then(members => members.filter(m => !m.user.bot))
        //             .then(async (members) => {
        //                 for (let u of users) {
        //                     let m = members.find(m => m.user.tag === u.username);
        //                     if (!m) console.log(`Could not find guild member with username: ${u.username}`);
        //                     await u.update({ snowflake: m?.user?.id });
        //                 }
        //             }))
        //     })

        // await oauth2Guilds.forEach(pg => pg.fetch()
        // .then(g => g.members.fetch({ force: true }))
        // .then(members => {
        //     return Promise.all(members.filter(m => m.user.bot).map(async (member) => {
        //         return User.destroy({
        //             where: { snowflake: member.user.id, guild: member.guild.id }
        //         });
        //     }));
        // }));

        client.user.setPresence({ activities: [{ name: 'Keeping score', type: 'CUSTOM' }]});
        console.log(`Ready! Logged in as ${client.user.tag}`);
    },
};
