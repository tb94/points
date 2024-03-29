const { Model } = require('sequelize');
const { EmbedBuilder } = require('discord.js');

module.exports = (sequelize, DataTypes) => {
    class Blackjack extends Model {
        deck;
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Blackjack.hasMany(models.Player, { onDelete: 'CASCADE' });
            Blackjack.hasOne(models.Deck);
        }

        async getHandEmbeds(show = false) {
            let embeds = [];
            let players = await this.getPlayers()

            for (let player of players) {
                let user = await player.getUser();
                let cards = await player.getCards();
                let embed = new EmbedBuilder().setColor("DarkGreen");

                if (!user) {
                    embed.setTitle("Dealer\t\t\t\u200b");
                    cards.forEach((card, index) => embed.addFields({ name: `\u200b`, value: `${index == 0 && !show ? "🂠" : card.value + card.suit}`, inline: true }));
                    embed.setFooter({ text: `Total: ${show ? player.handValue : "\u200b"}` });

                } else {
                    embed.setTitle(`${user.username.split('#')[0]}\t\t\t${player.bet} 💰`);
                    cards.forEach(card => embed.addFields({ name: `\u200b`, value: `${card.value + card.suit}`, inline: true }));
                    embed.setFooter({ text: `Total: ${player.handValue}` });
                }
                embeds.unshift(embed);
            }
            return embeds;
        }
    };

    Blackjack.init({
        guild: DataTypes.STRING,
        channel: DataTypes.STRING,
        startTime: DataTypes.DATE
    }, {
        sequelize,
        timestamps: false,
        modelName: 'Blackjack',
    });

    return Blackjack;
};

