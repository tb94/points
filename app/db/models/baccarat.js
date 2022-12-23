const { Model } = require('sequelize');
const { EmbedBuilder } = require('discord.js');

module.exports = (sequelize, DataTypes) => {
    class Baccarat extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Baccarat.hasMany(models.Player, { onDelete: 'CASCADE' });
            Baccarat.hasOne(models.Deck);
        }

        async getHandEmbeds() {
            let embeds = [];
            let players = await this.getPlayers()

            for (let player of players) {
                let embed = new EmbedBuilder().setColor("DarkRed");
                let user = await player.getUser();
                let cards = await player.getCards();
                if (cards == null || cards.length == 0) continue;

                embed.setTitle(`${!user ? "Banker" : "Player"}`);
                cards.forEach(card => embed.addFields({ name: `\u200b`, value: `${card.value + card.suit}`, inline: true }));
                embed.setFooter({ text: `Total: ${player.handValue % 10}` });

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
        sequelize,
        timestamps: false,
    });

    return Baccarat
}