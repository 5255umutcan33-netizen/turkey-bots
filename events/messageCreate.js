const { createWorker } = require('tesseract.js');
const AboneChannel = require('../models/aboneChannel');
const { EmbedBuilder } = require('discord.js');

// OCR Motorunu globalde bir kez başlatıyoruz ki hızlı olsun
let worker = null;
(async () => {
    worker = await createWorker('eng+tur');
})();

// NÜKLEER KİLİT SİSTEMİ (Mesaja değil, KULLANICIYA kilit vuruyoruz)
const activeProcessing = new Set();

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // 1. KORUMA: Botları engelle ve eğer bu KULLANICI şu an işlemdeyse mesajını yok say!
        // İşte seni kurtaracak olan satır burası: message.author.id
        if (message.author.bot || activeProcessing.has(message.author.id)) return;

        // 2. KORUMA: Kanalın abone kanalı olup olmadığını kontrol et
        const channelData = await AboneChannel.findOne({ channelId: message.channelId });
        if (!channelData) return;

        // 3. KORUMA: Resim (SS) yoksa işlem yapma
        const attachment = message.attachments.first();
        if (!attachment || !attachment.contentType.startsWith('image')) return;

        // --- KULLANICIYI KİLİTLE ---
        // Kullanıcı SS attığı an 10 saniye boyunca başka SS atsa da bot okumayacak (Çiftlemeyi bitirir)
        activeProcessing.add(message.author.id);

        const isEn = channelData.lang === 'en';
        const ROLE_ID = '1490996828974612530';
        const LOG_ID = '1490998881553743932';

        const pMsg = await message.reply(isEn ? '`⚡ Analyzing...`' : '`⚡ Analiz ediliyor...`');

        try {
            const { data: { text } } = await worker.recognize(attachment.url);
            const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            const hasRyphera = cleanText.includes('ryphera');
            const hasScript = cleanText.includes('scr1pt') || cleanText.includes('script') || cleanText.includes('scrpt') || cleanText.includes('scrlpt');

            if (hasRyphera && hasScript) {
                // ROL VER
                await message.member.roles.add(ROLE_ID).catch(() => {});
                await pMsg.edit(isEn ? '`✅ VERIFIED!`' : '`✅ ONAYLANDI!`');
                
                // DM GÖNDER
                try { await message.author.send(isEn ? '🚀 Verified! Welcome.' : '🚀 Onaylandın! Ailemize hoş geldin.'); } catch(e){}
                
                // LOGA AT
                const logChannel = client.channels.cache.get(LOG_ID);
                if (logChannel) {
                    const log = new EmbedBuilder()
                        .setTitle('✅ ONAY')
                        .setColor('#00FF00')
                        .addFields({name:'Kullanıcı', value:`<@${message.author.id}>`})
                        .setImage(attachment.url);
                    logChannel.send({ embeds: [log] });
                }
            } else {
                await pMsg.edit(isEn ? '`❌ FAILED!`' : '`❌ BAŞARISIZ!`');
                try { await message.author.send(isEn ? '❌ Failed. Name not found.' : '❌ Başarısız. Resimde isim bulunamadı.'); } catch(e){}
            }
        } catch (e) { 
            console.error(e);
            await pMsg.edit('`SYSTEM ERROR`'); 
        }

        // --- TEMİZLİK VE KİLİDİ AÇMA ---
        // 10 saniye sonra kanaldaki mesajı siler ve adamın kilidini açar.
        setTimeout(async () => {
            try { 
                await message.delete(); 
                await pMsg.delete(); 
            } catch (e) {}
            // İşlem bitti, kullanıcının kilidini kaldır
            activeProcessing.delete(message.author.id); 
        }, 10000); 
    }
};