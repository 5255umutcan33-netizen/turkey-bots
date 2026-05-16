const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sifrele')
        .setDescription('VIP & Yetkililer için Lua kodunu çalınmaya karşı şifreler (Obfuscate).')
        .addStringOption(option =>
            option.setName('kod')
                .setDescription('Şifrelemek istediğiniz Lua kodunu buraya yapıştırın.')
                .setRequired(true)
        ),

    async execute(interaction) {
        // Güvenlik: Sadece yöneticiler ve yetkililer kullanabilsin (İleride bunu VIP role de bağlayabilirsin)
        const STAFF_ROLE = '1501638556026802287';
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && !interaction.member.roles.cache.has(STAFF_ROLE)) {
            return interaction.reply({ content: '❌ **Bu VIP komutunu kullanmak için gerekli yetkiniz yok!**', ephemeral: true });
        }

        const rawCode = interaction.options.getString('kod');
        await interaction.deferReply({ ephemeral: true }); // Kod uzun olabileceği için bota zaman kazandırıyoruz

        try {
            // --- 🛡️ LUAWARE XOR OBFUSCATION ENGINE ---
            const xorKey = Math.floor(Math.random() * 150) + 50; // 50-200 arası rastgele şifreleme anahtarı
            let encryptedBytes = [];

            // Kodun her karakterini XOR anahtarı ile kırıyoruz
            for (let i = 0; i < rawCode.length; i++) {
                encryptedBytes.push(rawCode.charCodeAt(i) ^ xorKey);
            }

            const byteString = encryptedBytes.join(',');

            // Roblox Executor'larının arka planda çözeceği runtime wrapper kodunu inşa ediyoruz
            const obfuscatedCode = `local _LUAWARE_PROTECT = {${byteString}} local _KEY = ${xorKey} local _CHARS = {} for i=1, #_LUAWARE_PROTECT do _CHARS[i] = string.char(_LUAWARE_PROTECT[i] ~ _KEY) end return loadstring(table.concat(_CHARS))()`;
            // ----------------------------------------

            // Sonuç ekranını şık bir embed ile adama teslim ediyoruz
            const obfEmbed = new EmbedBuilder()
                .setTitle('🔐 LUAWARE | Kod Başarıyla Şifrelendi!')
                .setColor('#00D4FF')
                .setDescription('Aşağıdaki şifrelenmiş kodu direkt kopyalayıp executor\'ınızda çalıştırabilirsiniz. Orijinal kaynak kodunuz tamamen gizlenmiştir!')
                .addFields(
                    { name: '📝 Orijinal Boyut', value: `\`${rawCode.length} Karakter\``, inline: true },
                    { name: '🛡️ Güvenlik Katmanı', value: `\`XOR-Byte (Anti-Skid)\``, inline: true }
                )
                .setFooter({ text: 'LUAWARE Obfuscation Tool v1.0' });

            // Şifrelenmiş kodu kopyalaması kolay olsun diye kod bloğu içinde gönderiyoruz
            return interaction.editReply({ 
                embeds: [obfEmbed], 
                content: `\`\`\`lua\n${obfuscatedCode}\n\`\`\`` 
            });

        } catch (err) {
            console.error(err);
            return interaction.editReply({ content: '❌ **Kod şifrelenirken bir hata oluştu!** Kod karakterlerini kontrol edin.' });
        }
    }
};