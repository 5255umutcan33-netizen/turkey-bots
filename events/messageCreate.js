const { Events, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ANAHTAR BURADA, DOKUNMA KANKA
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
            // SADECE FOTOĞRAF KURALI
            if (message.attachments.size === 0) {
                await message.delete().catch(() => {});
                const warnMsg = isTR ? "⚠️ Sadece fotoğraf gönderebilirsin!" : "⚠️ You can only send photos!";
                const warn = await message.channel.send(`<@${message.author.id}> ${warnMsg}`);
                return setTimeout(() => warn.delete().catch(() => {}), 4000);
            }

            const attachment = message.attachments.first();
            if (!attachment.contentType?.startsWith('image/')) return;

            const waitMsg = isTR ? "🔄 Görsel inceleniyor..." : "🔄 Image being reviewed...";
            const statusMsg = await message.channel.send(`<@${message.author.id}> ${waitMsg}`);

            try {
                const response = await fetch(attachment.url);
                const arrayBuffer = await response.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString('base64');

                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const prompt = "Bu görselde '@LuawareScrpt' veya 'LuawareScrpt' yazısı var mı? Sadece EVET veya HAYIR cevabı ver.";

                const imagePart = { inlineData: { data: base64, mimeType: attachment.contentType } };
                const result = await model.generateContent([prompt, imagePart]);
                const decision = result.response.text().trim().toUpperCase();

                // TEMİZLİK: SS ve durum mesajını sil
                await message.delete().catch(() => {});
                await statusMsg.delete().catch(() => {});

                const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);

                if (decision.includes("EVET")) {
                    // ONAYLANIRSA
                    const ROL_ABONE = '1500587633649127445';
                    const ROL_UNVERIFIED = '1500249403443908711';
                    
                    await message.member.roles.add(ROL_ABONE).catch(() => {});
                    await message.member.roles.remove(ROL_UNVERIFIED).catch(() => {});

                    const successMsg = isTR ? "✅ SS Onaylandı, rolün verildi!" : "✅ SS Approved, role granted!";
                    const success = await message.channel.send(`<@${message.author.id}> ${successMsg}`);
                    setTimeout(() => success.delete().catch(() => {}), 5000);
                    
                    // DM GÖNDER
                    const dmMsg = isTR ? "🎉 **LUAWARE OS:** SS onaylandı, abone rolün verildi!" : "🎉 **LUAWARE OS:** SS approved, subscriber role granted!";
                    await message.author.send(dmMsg).catch(() => {});

                    // LOG GÖNDER
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('✅ SS ONAYLANDI')
                            .setColor('#00FF00')
                            .addFields(
                                { name: 'Kullanıcı', value: `${message.author.tag} (${message.author.id})` },
                                { name: 'Kanal', value: isTR ? 'Türkçe SS' : 'English SS' }
                            )
                            .setTimestamp();
                        logChannel.send({ embeds: [logEmbed] });
                    }
                } else {
                    // REDDEDİLİRSE
                    const failMsg = isTR ? "❌ Geçersiz SS! @LuawareScrpt yazısı bulunamadı." : "❌ Invalid SS! @LuawareScrpt text not found.";
                    const fail = await message.channel.send(`<@${message.author.id}> ${failMsg}`);
                    setTimeout(() => fail.delete().catch(() => {}), 5000);
                    
                    // DM GÖNDER
                    const dmFail = isTR ? "❌ **LUAWARE OS:** SS reddedildi. Görselde @LuawareScrpt yazısı görünmüyor." : "❌ **LUAWARE OS:** SS rejected. @LuawareScrpt text is not visible in the image.";
                    await message.author.send(dmFail).catch(() => {});

                    // LOG GÖNDER
                    if (logChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('❌ SS REDDEDİLDİ')
                            .setColor('#FF0000')
                            .addFields(
                                { name: 'Kullanıcı', value: `${message.author.tag} (${message.author.id})` },
                                { name: 'Sebep', value: '@LuawareScrpt yazısı bulunamadı.' }
                            )
                            .setTimestamp();
                        logChannel.send({ embeds: [logEmbed] });
                    }
                }
            } catch (err) {
                console.error(err);
                await message.delete().catch(() => {});
                await statusMsg.delete().catch(() => {});
            }
            return;
        }

        // PREFİX KOMUTLARI
        const prefix = '!';
        if (!message.content.startsWith(prefix)) return;
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands?.get(commandName);
        if (command) command.execute(message, args, client);
    }
};