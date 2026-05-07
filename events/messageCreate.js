const { Events, EmbedBuilder } = require('discord.js');
const Tesseract = require('tesseract.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        const TR_CHANNEL = '1500594950839075088';
        const EN_CHANNEL = '1500588822994358282';
        const LOG_CHANNEL_ID = '1500587963338326228';
        
        const isTR = message.channel.id === TR_CHANNEL;
        const isEN = message.channel.id === EN_CHANNEL;

        if (isTR || isEN) {
            // SADECE FOTOĞRAF KURALI
            if (message.attachments.size === 0) {
                await message.delete().catch(() => {});
                const warnMsg = isTR ? "⚠️ Sadece fotoğraf gönderilebilir!" : "⚠️ Only photos allowed!";
                const warn = await message.channel.send(`<@${message.author.id}> ${warnMsg}`);
                return setTimeout(() => warn.delete().catch(() => {}), 3000);
            }

            const attachment = message.attachments.first();
            if (!attachment.contentType?.startsWith('image/')) return;

            // HIZLI BİLGİ MESAJI
            const statusMsg = await message.channel.send(isTR ? "🔄 İnceleniyor..." : "🔄 Reviewing...");

            try {
                // LOKAL OCR TARAMA (HIZLANDIRILMIŞ)
                const { data: { text } } = await Tesseract.recognize(
                    attachment.url,
                    'eng',
                    { logger: () => {} } 
                );

                const cleanedText = text.toLowerCase().replace(/\s+/g, '');
                const target = "luawarescrpt"; 

                const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);

                // SONUÇLARI KONTROL ET
                if (cleanedText.includes(target)) {
                    // ✅ ONAY
                    const ROL_ABONE = '1500587633649127445';
                    const ROL_UNVERIFIED = '1500249403443908711';

                    const member = await message.guild.members.fetch(message.author.id);
                    await member.roles.add(ROL_ABONE).catch(() => {});
                    await member.roles.remove(ROL_UNVERIFIED).catch(() => {});

                    const ok = await message.channel.send(isTR ? `✅ <@${message.author.id}> Abone rolün verildi!` : `✅ <@${message.author.id}> Role granted!`);
                    
                    // DM GÖNDER
                    await message.author.send(isTR ? "🎉 Onaylandınız, rolünüz verildi!" : "🎉 Approved, role granted!").catch(() => {});

                    // LOG KANALINA AT (ASLA SİLİNMEZ)
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('✅ SİSTEM ONAYI')
                            .setColor('#00FF00')
                            .addFields(
                                { name: 'Kullanıcı', value: `${message.author.tag}`, inline: true },
                                { name: 'ID', value: `${message.author.id}`, inline: true }
                            )
                            .setImage(attachment.url)
                            .setTimestamp();
                        logChannel.send({ embeds: [embed] });
                    }

                    // KANALI TEMİZLE
                    setTimeout(async () => {
                        await message.delete().catch(() => {});
                        await statusMsg.delete().catch(() => {});
                        await ok.delete().catch(() => {});
                    }, 2000);

                } else {
                    // ❌ RED
                    const no = await message.channel.send(isTR ? `❌ <@${message.author.id}> Geçersiz ekran görüntüsü!` : `❌ <@${message.author.id}> Invalid screenshot!`);
                    
                    await message.author.send(isTR ? "❌ Gönderdiğiniz ekran görüntüsü kriterlere uymuyor." : "❌ Your screenshot does not meet the criteria.").catch(() => {});

                    // LOG KANALINA AT (REDDEDİLENLER DE BURADA DURUR)
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('❌ SİSTEM REDDİ')
                            .setColor('#FF0000')
                            .addFields(
                                { name: 'Kullanıcı', value: `${message.author.tag}`, inline: true },
                                { name: 'Durum', value: 'Geçersiz Görsel', inline: true }
                            )
                            .setImage(attachment.url)
                            .setTimestamp();
                        logChannel.send({ embeds: [embed] });
                    }

                    // KANALI TEMİZLE
                    setTimeout(async () => {
                        await message.delete().catch(() => {});
                        await statusMsg.delete().catch(() => {});
                        await no.delete().catch(() => {});
                    }, 2000);
                }

            } catch (err) {
                console.error("Tarama Hatası:", err);
                await message.delete().catch(() => {});
                await statusMsg.delete().catch(() => {});
            }
            return;
        }

        // DİĞER KOMUTLAR
        const prefix = '!';
        if (!message.content.startsWith(prefix)) return;
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands?.get(commandName);
        if (command) command.execute(message, args, client);
    }
};