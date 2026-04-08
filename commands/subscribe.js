const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('subscribe')
        .setDescription('How to get subscriber role and key? / Abone rolü ve key nasıl alınır?'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('💎 RYPHERA OS | ACCESS GUIDE')
            .setColor('#FEE75C')
            .addFields(
                { 
                    name: '🇹🇷 TÜRKÇE ANLATIM', 
                    value: `1. YouTube kanalımıza abone olun.\n2. Ekran görüntüsünü (SS) <#1491460319002755152> kanalına gönderin.\n3. Bot onaylayınca **Abone** rolünüz verilecektir.\n4. Ardından <#1491474379354148934> kanalından keyinizi alabilirsiniz.`, 
                    inline: false 
                },
                { 
                    name: '🇬🇧 ENGLISH GUIDE', 
                    value: `1. Subscribe to our YouTube channel.\n2. Send the screenshot (SS) to <#1491457214974656552> channel.\n3. Once approved, the **Subscriber** role will be granted.\n4. Then, you can get your key from <#1491474439865368677> channel.`, 
                    inline: false 
                }
            )
            .setFooter({ text: 'Ryphera OS System' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};