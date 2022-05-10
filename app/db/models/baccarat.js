const { Model } = require('sequelize');
const { MessageEmbed } = require('discord.js');

module.exports = (sequelize, DataTypes) => {
    class Baccarat extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Baccarat.hasMany(models.Player, { onDelete: 'CASCADE' });
        }

        async getHandEmbeds() {
            let embeds = [];
            let players = await this.getPlayers()

            for (let player of players) {
                let embed = new MessageEmbed().setColor("DARK_RED");
                let user = await player.getUser();
                let cards = await player.getCards();
                if (cards == null || cards.length == 0) continue;

                embed.setTitle(`${!user ? "Banker" : "Player"}`);
                cards.forEach(card => embed.addField("\u200b", card.value + card.suit, true));
                embed.setFooter(`Total: ${player.handValue % 10}`);

                embeds.unshift(embed);
            }
            return embeds;
        }
    }

    Baccarat.init({
        guild: DataTypes.STRING,
        channel: DataTypes.STRING,
        startTime: DataTypes.DATE
    }, {
        hooks: {
            beforeCreate: (table, options) => { table.startTime = Date.now() + (10 * 1000); }
        },
        sequelize,
        timestamps: false,
    });

    return Baccarat
}