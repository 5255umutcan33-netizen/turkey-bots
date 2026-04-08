const { Events, AuditLogEvent } = require('discord.js');

// Kimin kaç işlem yaptığını aklımızda tutacağımız harita
const actionTracker = new Map(); 

module.exports = {
    name: Events.GuildAuditLogEntryCreate,
    async execute(auditLogEntry, guild, client) {
        const { action, executorId } = auditLogEntry;

        // Botun kendi yaptığı işlemleri görmezden gel
        if (!executorId || executorId === client.user.id) return;

        // Sadece BAN ve KICK işlemlerini takip et
        if (action === AuditLogEvent.MemberBanAdd || action === AuditLogEvent.MemberKick) {
            
            // Kullanıcının mevcut ceza puanını al
            let data = actionTracker.get(executorId) || { count: 0 };
            data.count++;

            // Eğer 3 veya daha fazla işlem yaptıysa FİŞİNİ ÇEK!
            if (data.count >= 3) {
                try {
                    const member = await guild.members.fetch(executorId);
                    if (member && member.kickable) {
                        await member.kick("Ryphera Guard: Kısa sürede 3'ten fazla Ban/Kick işlemi yapıldı. Güvenlik ihlali!");
                        console.log(`🚨 [KORUMA] ${member.user.tag} çok fazla ban/kick attığı için sunucudan atıldı!`);
                    }
                } catch (err) {
                    console.error("Yetkiliyi atarken hata:", err);
                }
                // Cezasını kestikten sonra sicilini temizle
                actionTracker.delete(executorId);
            } else {
                // 3'ü bulmadıysa puanını kaydet ve 60 saniye sonra sıfırla (Süre sayacı)
                actionTracker.set(executorId, data);
                setTimeout(() => {
                    actionTracker.delete(executorId);
                }, 60000); // 1 Dakika içinde 3 ban/kick atarsa yanar
            }
        }
    },
};