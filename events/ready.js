const { Events, ActivityType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`✅ ${client.user.tag} başarıyla giriş yaptı ve aktif!`);

        // Botun Durumu (Oynuyor vs.)
        client.user.setPresence({
            activities: [{ name: 'LUAWARE OS System', type: ActivityType.Watching }],
            status: 'dnd', // Rahatsız Etmeyin (Kırmızı)
        });

        // --- 7/24 SES KANALINA BAĞLANMA SİSTEMİ ---
        const VOICE_CHANNEL_ID = '1501279145106215044';
        const channel = client.channels.cache.get(VOICE_CHANNEL_ID);

        if (channel) {
            try {
                joinVoiceChannel({
                    channelId: channel.id,
                    guildId: channel.guild.id,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                    selfDeaf: true, // Bot kendini sağırlaştırır (Gereksiz internet/ram harcamaz)
                    selfMute: true  // Bot kendini susturur
                });
                console.log(`🔊 [LUAWARE SİSTEM] Bot başarıyla sese bağlandı: ${channel.name}`);
            } catch (error) {
                console.error(`❌ Sese bağlanırken bir hata oluştu:`, error);
            }
        } else {
            console.log(`⚠️ Ses kanalı bulunamadı! Lütfen ID'yi kontrol edin: ${VOICE_CHANNEL_ID}`);
        }
    },
};