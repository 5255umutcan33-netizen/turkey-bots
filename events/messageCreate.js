const { Events } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const AboneChannel = require('../models/aboneChannel'); // Veritabanı modelin

// ANAHTARIN BURADA, DOKUNMA KANKA
const genAI = new GoogleGenerativeAI('AIzaSyCwt6L0otY_MXPEXr3VK0f4gZwHT8zNodY');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        // 1. VERİTABANINDAN KANALI KONTROL ET
        const channelData = await AboneChannel.findOne({ guildId: message.guild.id });
        if (!channelData || message.channel.id !== channelData.channelId) return;

        // 2. SADECE FOTOĞRAF KURALI (YAZI YAZILIRSA SİL)
        if (message.attachments.size === 0) {
            await message.delete().catch(() => {});
            const warn = await message.channel.send(`⚠️ <@${message.author.id}> Bu kanala sadece Youtube SS gönderebilirsin!`);
            return setTimeout(() => warn.delete().catch(() => {}), 5000);
        }

        const attachment = message.attachments.first();
        if (!attachment.contentType.startsWith('image/')) return;

        // 3. İŞLEM BAŞLIYOR (BEKLEME MESAJI)
        const statusMsg = await message.channel.send(`🔍 <@${message.author.id}> Görsel kontrol ediliyor...`);

        try {
            // Fotoğrafı indir ve Yapay Zekaya hazırla
            const response = await fetch(attachment.url);
            const arrayBuffer = await response.arrayBuffer();
            const base64 = Buffer.from(arrayBuffer).toString('base64');

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = "Bu görseli incele. İçinde 'LuawareScrpt' veya '@LuawareScrpt' yazısı geçiyor mu? Sadece 'EVET' veya 'HAYIR' yaz.";

            const imagePart = { inlineData: { data: base64, mimeType: attachment.contentType } };
            const result = await model.generateContent([prompt, imagePart]);
            const decision = result.response.text().trim().toUpperCase();

            // --- KANALI TEMİZLE (Kritik İstek) ---
            await message.delete().catch(() => {}); // Kullanıcının attığı SS'i sil
            await statusMsg.delete().catch(() => {}); // "Kontrol ediliyor" yazısını sil

            if (decision.includes("EVET")) {
                // 4. ONAYLANIRSA
                const ABONE_ROLU = '1500587633649127445';
                const UNVERIFIED_ROLU = '1500249403443908711';

                await message.member.roles.add(ABONE_ROLU).catch(() => {});
                await message.member.roles.remove(UNVERIFIED_ROLU).catch(() => {});
                
                // Onay mesajı (5 saniye sonra silinir)
                const ok = await message.channel.send(`✅ <@${message.author.id}> SS Onaylandı, abone rolün verildi!`);
                setTimeout(() => ok.delete().catch(() => {}), 5000);

                await message.author.send("🎉 **LUAWARE OS:** Abone SS'in onaylandı! Key alma kanalına erişebilirsin.").catch(() => {});
            } else {
                // 5. REDDEDİLİRSE
                const no = await message.channel.send(`❌ <@${message.author.id}> SS reddedildi! (Geçersiz görsel)`);
                setTimeout(() => no.delete().catch(() => {}), 5000);

                await message.author.send("❌ **LUAWARE OS:** Gönderdiğin SS geçersiz. Lütfen abone olduğunu net gösteren bir fotoğraf at.").catch(() => {});
            }

        } catch (error) {
            console.error("Hata:", error);
            await message.delete().catch(() => {});
            await statusMsg.edit("⚠️ Sistemde bir hata oluştu, lütfen birazdan tekrar dene.").then(m => setTimeout(() => m.delete(), 5000));
        }
    }
};