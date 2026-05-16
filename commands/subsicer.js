const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('subscriber')
        .setDescription('Anahtar alma adımlarını gösterir / Shows the key generation guide.'),
        
    async execute(interaction) {
        const guideEmbed = new EmbedBuilder()
            .setTitle('🔑 LUAWARE | Key Guide / Anahtar Rehberi')
            .setColor('#57F287')
            .setDescription(
                "🇹🇷 **ADIM ADIM KEY NASIL ALINIR?**\n" +
                "**1.** <#1500249077000966404> kanalına gidin.\n" +
                "**2.** `🔑 Anahtar Al` butonuna tıklayın.\n" +
                "**3.** Önünüze açılan gizli mesajdaki reklam (LootLabs) linkine tıklayın.\n" +
                "**4.** Kısa görevleri tamamladığınızda 24 Saatlik özel LUAWARE anahtarınız anında ekranda belirecektir!\n\n" +
                "---\n\n" +
                "🇬🇧 **HOW TO GET A KEY STEP BY STEP?**\n" +
                "**1.** Go to the <#1500249098219946155> channel.\n" +
                "**2.** Click the `🔑 Get Key` button.\n" +
                "**3.** Click the ad (LootLabs) link provided in the hidden message.\n" +
                "**4.** Complete the short tasks, and your 24-hour custom LUAWARE key will be generated instantly!"
            )
            .setImage('https://cdn.discordapp.com/attachments/1111/1111/luaware_banner.png') // Banner linkini buraya sabitleyebilirsin
            .setFooter({ text: 'LUAWARE Security System' })
            .setTimestamp();

        // Herkesin görmesi için ephemeral (gizlilik) kapalı
        await interaction.reply({ embeds: [guideEmbed] });
    }
};