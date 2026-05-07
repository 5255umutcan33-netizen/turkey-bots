const { Events, EmbedBuilder } = require('discord.js');
const Tesseract = require('tesseract.js'); // Kendi lokal görsel okuma kütüphanemiz

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
            // 1. SADECE FOTOĞRAF KONTROLÜ
            if (message.attachments.size === 0) {
                await message.delete().catch(() => {});
                const warnMsg = isTR ? "⚠️ Lütfen sadece abone olduğunuzu kanıtlayan bir fotoğraf gönderin!" : "⚠️ Please only send a photo proving your subscription!";
                const warn = await message.channel.send(`<@${message.author.id}> ${warnMsg}`);
                return setTimeout(() => warn.delete().catch(() => {}), 4000);
            }

            const attachment = message.attachments.first();
            if (!attachment.contentType?.startsWith('image/')) return;

            const waitMsg = isTR ? "🔄 Görsel taranıyor (Lokal AI)..." : "🔄 Scanning image (Local AI)...";
            const statusMsg = await message.channel.send(`<@${message.author.id}> ${waitMsg}`);

            try {
                // KENDİ SİSTEMİMİZ: Resmi indirip içindeki yazıları ayıklıyoruz
                const { data: { text } } = await Tesseract.recognize(
                    attachment.url,
                    'eng', // İngilizce karakter setiyle tara (Logolar ve kullanıcı adları için en temizi)
                    { logger: () => {} } // Konsolu kirletmesin diye boş geçtik
                );

                const cleanedText = text.toLowerCase();
                const targetText = "luawarescrpt"; // Aradığımız anahtar kelime

                // Asıl kanaldaki mesajı ve bekleme yazısını hemen siliyoruz (Temizlik)
                await message.delete().catch(() => {});
                await statusMsg.delete().catch(() => {});

                const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);

                // KONTROL: Görselde yazımız geçiyor mu?
                if (cleanedText.includes(targetText)) {
                    // ✅ ONAY: ROLÜ VER
                    const ROL_ABONE = '1500587633649127445';
                    const ROL_UNVERIFIED = '1500249403443908711';

                    const member = await message.guild.members.fetch(message.author.id);
                    await member.roles.add(ROL_ABONE).catch(() => {});
                    await member.roles.remove(ROL_UNVERIFIED).catch(() => {});

                    const successMsg = isTR ? "✅ Abone rolün başarıyla verildi!" : "✅ Subscriber role successfully granted!";
                    const ok = await message.channel.send(`<@${message.author.id}> ${successMsg}`);
                    setTimeout(() => ok.delete().catch(() => {}), 5000);

                    // DM Gönder
                    await message.author.send(isTR ? "🎉 **LUAWARE OS:** SS onaylandı ve rolün verildi!" : "🎉 **LUAWARE OS:** SS approved and role granted!").catch(() => {});

                    // Log Kanalına SS ile Gönder
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('✅ LOKAL AI | ONAYLANDI')
                            .setColor('Green')
                            .addFields(
                                { name: 'Kullanıcı', value: `${message.author.tag} (${message.author.id})` },
                                { name: 'Kanal', value: isTR ? 'Türkçe SS' : 'English SS' }
                            )
                            .setImage(attachment.url)
                            .setTimestamp();
                        logChannel.send({ embeds: [embed] });
                    }
                } else {
                    // ❌ RED: YAZI BULUNAMADI
                    const failMsg = isTR ? "❌ Reddedildi! Görselde @LuawareScrpt bulunamadı." : "❌ Rejected! @LuawareScrpt not found in image.";
                    const no = await message.channel.send(`<@${message.author.id}> ${failMsg}`);
                    setTimeout(() => no.delete().catch(() => {}), 5000);

                    // DM Gönder
                    await message.author.send(isTR ? "❌ **LUAWARE OS:** SS reddedildi, gerekli kanal ismi bulunamadı." : "❌ **LUAWARE OS:** SS rejected, channel name not found.").catch(() => {});

                    // Log Kanalına Reddedilen SS ile Gönder
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('❌ LOKAL AI | REDDEDİLDİ')
                            .setColor('Red')
                            .addFields(
                                { name: 'Kullanıcı', value: `${message.author.tag} (${message.author.id})` },
                                { name: 'Sebep', value: 'Görselde LuawareScrpt yazısı tespit edilemedi.' }
                            )
                            .setImage(attachment.url)
                            .setTimestamp();
                        logChannel.send({ embeds: [embed] });
                    }
                }

            } catch (err) {
                console.error("Lokal Okuma Hatası:", err);
                await message.delete().catch(() => {});
                await statusMsg.delete().catch(() => {});
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