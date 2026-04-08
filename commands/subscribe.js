const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('subscribe')
        .setDescription('How to get subscriber role and key? / Abone rolü ve key nasıl alınır?'),

    async execute(interaction) {
        
        // 💎 PREMİUM FORMAT EKRANI
        const embed = new EmbedBuilder()
            .setTitle('💎 Ryphera OS | Access Guide / Erişim Rehberi')
            .setColor('#FEE75C')
            .setDescription(
                `🇹🇷 **TÜRKÇE ANLATIM**\n` +
                `1️⃣ **Adım 1 -->** YouTube kanalımıza abone olun.\n` +
                `2️⃣ **Adım 2 -->** Ekran görüntüsünü (SS) <#1491460319002755152> kanalına gönderin.\n` +
                `3️⃣ **Adım 3 -->** Bot onaylayınca **Abone** rolünüz otomatik verilecektir.\n` +
                `4️⃣ **Adım 4 -->** Ardından <#1491474379354148934> kanalından keyinizi alabilirsiniz.\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                `🇬🇧 **ENGLISH GUIDE**\n` +
                `1️⃣ **Step 1 -->** Subscribe to our YouTube channel.\n` +
                `2️⃣ **Step 2 -->** Send the screenshot (SS) to <#1491457214974656552> channel.\n` +
                `3️⃣ **Step 3 -->** Once approved, the **Subscriber** role will be granted.\n` +
                `4️⃣ **Step 4 -->** Then, you can get your key from <#1491474439865368677> channel.`
            )
            .setFooter({ text: 'Ryphera OS System' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};