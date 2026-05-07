const { Events, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios'); // Eğer yüklü değilse: npm install axios

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
            if (message.attachments.size === 0) {
                await message.delete().catch(() => {});
                const warnMsg = isTR ? "⚠️ Sadece fotoğraf gönderebilirsin!" : "⚠️ You can only send photos!";
                const warn = await message.channel.send(`<@${message.author.id}> ${warnMsg}`);
                return setTimeout(() => warn.delete().catch(() => {}), 4000);
            }

            const attachment = message.attachments.first();
            const waitMsg = isTR ? "🔄 Görsel inceleniyor..." : "🔄 Image being reviewed...";
            const statusMsg = await message.channel.send(`<@${message.author.id}> ${waitMsg}`);

            try {
                // Görseli indiriyoruz
                const response = await axios.get(attachment.url, { responseType: 'arraybuffer' });
                const base64 = Buffer.from(response.data, 'binary').toString('base64');

                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const prompt = "Görselde '@LuawareScrpt' veya 'LuawareScrpt' yazısı geçiyor mu? Sadece 'EVET' veya 'HAYIR' olarak cevap ver.";

                const imagePart = { inlineData: { data: base64, mimeType: attachment.contentType || 'image/png' } };
                const result = await model.generateContent([prompt, imagePart]);
                const decision = result.response.text().toUpperCase();

                // Kanaldaki kalabalığı temizle
                await message.delete().catch(() => {});
                await statusMsg.delete().catch(() => {});

                const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);

                // Kontrol: Cevap "EVET" içeriyor mu?
                if (decision.includes("EVET") || decision.includes("YES")) {
                    const ROL_ABONE = '1500587633649127445';
                    const ROL_UNVERIFIED = '1500249403443908711';
                    
                    const member = await message.guild.members.fetch(message.author.id);
                    await member.roles.add(ROL_ABONE).catch(console.error);
                    await member.roles.remove(ROL_UNVERIFIED).catch(console.error);

                    const successMsg = isTR ? "✅ Onaylandı! Rolün verildi." : "✅ Approved! Role granted.";
                    const ok = await message.channel.send(`<@${message.author.id}> ${successMsg}`);
                    setTimeout(() => ok.delete().catch(() => {}), 5000);

                    await message.author.send(isTR ? "🎉 Abone rolün verildi!" : "🎉 Subscriber role granted!").catch(() => {});

                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('✅ Onaylandı')
                            .setColor('Green')
                            .setDescription(`${message.author.tag} kullanıcısının SS'i başarıyla onaylandı.`);
                        logChannel.send({ embeds: [embed] });
                    }
                } else {
                    // REDDEDİLME DURUMU
                    const failMsg = isTR ? "❌ Reddedildi! @LuawareScrpt yazısı yok." : "❌ Rejected! @LuawareScrpt text missing.";
                    const no = await message.channel.send(`<@${message.author.id}> ${failMsg}`);
                    setTimeout(() => no.delete().catch(() => {}), 5000);

                    await message.author.send(isTR ? "❌ SS reddedildi, yazı bulunamadı." : "❌ SS rejected, text not found.").catch(() => {});

                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('❌ Reddedildi')
                            .setColor('Red')
                            .setDescription(`${message.author.tag} kullanıcısının SS'i geçersiz sayıldı.`);
                        logChannel.send({ embeds: [embed] });
                    }
                }
            } catch (err) {
                console.error("HATA:", err);
                await statusMsg.edit("⚠️ Sistem hatası oluştu.").then(m => setTimeout(() => m.delete(), 3000));
            }
            return;
        }
    }
};