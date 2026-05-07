const { Events, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const genAI = new GoogleGenerativeAI('AIzaSyCwt6L0otY_MXPEXr3VK0f4gZwHT8zNodY');

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
            // SADECE FOTOĞRAF KONTROLÜ
            if (message.attachments.size === 0) {
                await message.delete().catch(() => {});
                const warn = await message.channel.send(`<@${message.author.id}> ${isTR ? "⚠️ Sadece fotoğraf!" : "⚠️ Photos only!"}`);
                return setTimeout(() => warn.delete().catch(() => {}), 4000);
            }

            const attachment = message.attachments.first();
            const statusMsg = await message.channel.send(`<@${message.author.id}> ${isTR ? "🔄 İnceleniyor..." : "🔄 Reviewing..."}`);

            try {
                // Görseli indir ve Yapay Zekaya Gönder
                const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
                const base64 = Buffer.from(response.data, 'binary').toString('base64');

                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const prompt = "Bu görselde '@LuawareScrpt' veya 'LuawareScrpt' yazısı var mı? Sadece EVET veya HAYIR yaz.";

                const imagePart = { inlineData: { data: base64, mimeType: attachment.contentType || 'image/png' } };
                const result = await model.generateContent([prompt, imagePart]);
                const decision = result.response.text().toUpperCase();

                // Asıl kanalı temizle
                await message.delete().catch(() => {});
                await statusMsg.delete().catch(() => {});

                const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);

                if (decision.includes("EVET")) {
                    // ✅ ONAY: ROL VER VE LOGA SS AT
                    const ROL_ABONE = '1500587633649127445';
                    const ROL_UNVERIFIED = '1500249403443908711';
                    
                    const member = await message.guild.members.fetch(message.author.id);
                    await member.roles.add(ROL_ABONE).catch(() => {});
                    await member.roles.remove(ROL_UNVERIFIED).catch(() => {});

                    const ok = await message.channel.send(`✅ <@${message.author.id}> ${isTR ? "Onaylandı!" : "Approved!"}`);
                    setTimeout(() => ok.delete().catch(() => {}), 5000);
                    await message.author.send(isTR ? "🎉 Onaylandın!" : "🎉 Approved!").catch(() => {});

                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('✅ SS ONAYLANDI')
                            .setColor('Green')
                            .addFields({ name: 'Kullanıcı', value: `${message.author.tag}` })
                            .setImage(attachment.url) // LOGA SS ATAR
                            .setTimestamp();
                        logChannel.send({ embeds: [embed] });
                    }
                } else {
                    // ❌ RED: YAZI YOKSA
                    const no = await message.channel.send(`❌ <@${message.author.id}> ${isTR ? "Yazı bulunamadı!" : "Text not found!"}`);
                    setTimeout(() => no.delete().catch(() => {}), 5000);
                    await message.author.send(isTR ? "❌ Reddedildi, @LuawareScrpt yazısı yok." : "❌ Rejected, @LuawareScrpt not found.").catch(() => {});

                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('❌ SS REDDEDİLDİ')
                            .setColor('Red')
                            .addFields({ name: 'Kullanıcı', value: `${message.author.tag}` }, { name: 'Sebep', value: 'Yazı Bulunamadı' })
                            .setImage(attachment.url) // LOGA REDDEDİLEN SS'İ ATAR
                            .setTimestamp();
                        logChannel.send({ embeds: [embed] });
                    }
                }
            } catch (err) {
                console.error(err);
                await statusMsg.edit("⚠️ API Hatası!").then(m => setTimeout(() => m.delete(), 3000));
            }
            return;
        }
    }
};