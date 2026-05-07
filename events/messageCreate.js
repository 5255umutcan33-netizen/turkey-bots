const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;

        const TR_CHANNEL = '1500594950839075088';
        const EN_CHANNEL = '1500588822994358282';
        const LOG_CHANNEL_ID = '1500587963338326228';
        
        const isTR = message.channel.id === TR_CHANNEL;
        const isEN = message.channel.id === EN_CHANNEL;

        if (isTR || isEN) {
            // 1. DURUM: SADECE YAZI YAZDIYSA SİL VE UYAR
            if (message.attachments.size === 0) {
                await message.delete().catch(() => {});
                const warnMsg = isTR ? "⚠️ Lütfen sadece abone olduğunuzu kanıtlayan bir fotoğraf gönderin!" : "⚠️ Please only send a photo proving your subscription!";
                const warn = await message.channel.send(`<@${message.author.id}> ${warnMsg}`);
                return setTimeout(() => warn.delete().catch(() => {}), 5000);
            }

            // 2. DURUM: FOTOĞRAF ATILDI (ONAYLA)
            const attachment = message.attachments.first();
            if (!attachment.contentType?.startsWith('image/')) return;

            try {
                const ROL_ABONE = '1500587633649127445';
                const ROL_UNVERIFIED = '1500249403443908711';

                const member = await message.guild.members.fetch(message.author.id);
                
                // Rolleri güncelle
                await member.roles.add(ROL_ABONE).catch(() => {});
                await member.roles.remove(ROL_UNVERIFIED).catch(() => {});

                // Kullanıcıya Onay Mesajı
                const successMsg = isTR ? "✅ Abone rolün verildi! Teşekkürler." : "✅ Subscriber role granted! Thank you.";
                const ok = await message.channel.send(`<@${message.author.id}> ${successMsg}`);

                // --- TEMİZLİK: SS'i ve mesajı 3 saniye sonra siler (Kanal hep boş kalır) ---
                setTimeout(async () => {
                    await message.delete().catch(() => {});
                    await ok.delete().catch(() => {});
                }, 3000);

                // LOG KANALINA BİLGİ GÖNDER
                const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle(isTR ? '📥 Yeni Abone Onaylandı' : '📥 New Subscriber Approved')
                        .setColor('#57F287')
                        .addFields(
                            { name: 'Kullanıcı / User', value: `${message.author.tag} (${message.author.id})` },
                            { name: 'Kanal / Channel', value: isTR ? 'Türkçe SS' : 'English SS' }
                        )
                        .setTimestamp();
                    logChannel.send({ embeds: [logEmbed] });
                }

            } catch (err) {
                console.error("Hata:", err);
            }
            return;
        }

        // PREFİX KOMUTLARIN (!yardım vs.)
        const prefix = '!';
        if (!message.content.startsWith(prefix)) return;
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands?.get(commandName);
        if (command) command.execute(message, args, client);
    }
};