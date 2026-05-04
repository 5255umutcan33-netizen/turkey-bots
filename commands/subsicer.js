const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('subscriber')
        .setDescription('Abone rehberini ve Key alma adımlarını gösterir / Shows the Subscriber guide.'),
    async execute(interaction) {
        const guideEmbed = new EmbedBuilder()
            .setTitle('🔑 LUAWARE | Subscriber Guide / Abone Rehberi')
            .setColor('#57F287')
            .setDescription(
                "🇹🇷 **ADIM ADIM KEY NASIL ALINIR?**\n" +
                "**1.** [Buraya Tıklayarak YouTube Kanalımıza Abone Ol](https://www.youtube.com/@LuawareScrpt)\n" +
                "**2.** İçinde `@Luawarescrpt` yazısı olan Abone kanıtı ekran görüntünü (SS) <#1500594950839075088> kanalına gönder.\n" +
                "⚠️ *(ÖNEMLİ: Lütfen resmi kırpmayın! Sayfanın **tamamını** SS alıp gönderin.)*\n" +
                "**3.** Yapay Zeka seni anında onaylayıp **Abone** rolünü verecek.\n" +
                "**4.** Rolü aldıktan sonra **Key Alma** kanalına gidip butonla keyini saniyeler içinde oluşturabilirsin!\n\n" +
                "---\n\n" +
                "🇬🇧 **HOW TO GET A KEY STEP BY STEP?**\n" +
                "**1.** [Click Here to Subscribe to Our YouTube Channel](https://www.youtube.com/@LuawareScrpt)\n" +
                "**2.** Send a screenshot (SS) containing the text `@Luawarescrpt` to the <#1500588822994358282> channel.\n" +
                "⚠️ *(IMPORTANT: Please do not crop the image! Take a screenshot of the **entire page/screen**.)*\n" +
                "**3.** The AI will instantly approve you and give you the **Subscriber** role.\n" +
                "**4.** After getting the role, go to the **Key Generation** channel to get your key!"
            )
            .setFooter({ text: 'LUAWARE Auto-Guide' })
            .setTimestamp();

        // ephemeral: true yaparsan sadece komutu yazan kişi görür. Herkes görsün dersen silebilirsin.
        await interaction.reply({ embeds: [guideEmbed], ephemeral: true });
    }
};