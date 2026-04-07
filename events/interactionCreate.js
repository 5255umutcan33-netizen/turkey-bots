const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const KeyModel = require('../models/key');

const cooldown = new Set(); 

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        const OWNER_ID = '345821033414262794'; // SENİN ID'N (Bütün yetkiler buna bağlı)

        // --- 1. SLASH KOMUTLARINI ÇALIŞTIR ---
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) await interaction.followUp({ content: '`HATA`', ephemeral: true });
                else await interaction.reply({ content: '`HATA`', ephemeral: true });
            }
            return;
        }

        // --- 2. BUTONLARI ÇALIŞTIR ---
        if (!interaction.isButton()) return;
        const cid = interaction.customId;

        // --- YENİ EKLENEN: MOBİL SCRIPT KOPYALAMA BUTONU ---
        if (cid === 'mobil_kopyala_btn') {
            // Embed'in içinden script kodunu gizlice çekeriz
            const embed = interaction.message.embeds[0];
            if (!embed) return interaction.reply({ content: '`Script bulunamadı.`', ephemeral: true });

            const scriptAlani = embed.fields.find(f => f.name === '🔗 Script Kodu');
            if (!scriptAlani) return interaction.reply({ content: '`Kod bulunamadı.`', ephemeral: true });

            // Kodun başındaki ve sonundaki ```lua işaretlerini temizliyoruz
            let temizKod = scriptAlani.value.replace(/```lua\n/g, '').replace(/```/g, '').trim();

            // Sadece butona basan kişiye görünür (ephemeral), kopyalaması çok rahattır
            return interaction.reply({ content: `${temizKod}`, ephemeral: true });
        }

        // --- VERİTABANI SİLME (SADECE SEN) ---
        if (cid === 'confirm_delete_all') {
            if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: '`⚠️ YETKİ YOK`', ephemeral: true });
            await KeyModel.deleteMany({});
            return interaction.update({ content: '`✅ Tüm veritabanı mermi gibi temizlendi!`', embeds: [], components: [] });
        }

        if (cid === 'cancel_delete_all') return interaction.update({ content: '`İptal edildi.`', embeds: [], components: [] });

        // --- KEY ALMA (TR/EN) ---
        if (cid === 'get_key_tr' || cid === 'get_key_en') {
            if (cooldown.has(interaction.user.id)) return interaction.reply({ content: '`Bekle...`', ephemeral: true });
            cooldown.add(interaction.user.id);
            setTimeout(() => cooldown.delete(interaction.user.id), 5000);

            const isEn = cid === 'get_key_en';
            const existing = await KeyModel.findOne({ createdBy: interaction.user.id });
            if (existing) return interaction.reply({ content: `\`Key: ${existing.key}\``, ephemeral: true });

            const rypKey = `RYP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            await new KeyModel({ key: rypKey, keyId: "123456", createdBy: interaction.user.id }).save();

            try {
                await interaction.user.send(`🚀 RYPHERA KEY: \`${rypKey}\``);
                return interaction.reply({ content: isEn ? '`SUCCESS: Check DMs!`' : '`BAŞARILI: DM kutuna bak!`', ephemeral: true });
            } catch (e) { return interaction.reply({ content: '`DM KAPALI!`', ephemeral: true }); }
        }
    }
};