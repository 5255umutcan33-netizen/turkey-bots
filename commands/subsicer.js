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
                "**2.** İçinde `@Luawarescrpt` yazısı net bir şekilde görünen Abone kanıtı ekran görüntünü (SS) <#1500594950839075088> kanalına gönder.\n" +
                "⚠️ *(ÖNEMLİ: Lütfen resmi kırpmayın! Sayfanın **tamamını** SS alıp gönderin.)*\n" +
                "**3.** Yapay Zeka seni anında onaylayıp **Abone** rolünü verecek.\n" +
                "**4.** Rolü aldıktan sonra **Lisans Merkezi** kanalına git ve `🔑 Anahtar Al` butonuna tıkla. Karşına çıkan kısa reklam görevini geçtiğinde 24 Saatlik LUAWARE anahtarın anında ekranda olacak!\n\n" +
                "---\n\n" +
                "🇬🇧 **HOW TO GET A KEY STEP BY STEP?**\n" +
                "**1.** [Click Here to Subscribe to Our YouTube Channel](https://www.youtube.com/@LuawareScrpt)\n" +
                "**2.** Send a screenshot (SS) clearly showing the text `@Luawarescrpt` to the <#1500588822994358282> channel.\n" +
                "⚠️ *(IMPORTANT: Please do not crop the image! Take a screenshot of the **entire page/screen**.)*\n" +
                "**3.** The AI will instantly approve you and give you the **Subscriber** role.\n" +
                "**4.** After getting the role, go to the **License Center** channel and click the `🔑 Get Key` button. Complete the short ad task, and your 24-hour LUAWARE key will be generated instantly!"
            )
            .setImage('https://cdn.discordapp.com/attachments/1111/1111/luaware_banner.png') // İstersen buraya da LUAWARE banner linkini koyabilirsin, boş kalırsa resim çıkmaz
            .setFooter({ text: 'LUAWARE Security System' })
            .setTimestamp();

        // Gizlilik (ephemeral) yok. Herkes görebilir.
        await interaction.reply({ embeds: [guideEmbed] });
    }
};