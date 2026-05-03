const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ComponentType } = require('discord.js');
const KeyModel = require('../models/key'); // Bulduğumuz kesin yol

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mevcutkeyler')
        .setDescription('Sistemdeki tüm Luaware lisanslarını listeler.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
        
    async execute(interaction) {
        
        //  İLK ONAY EKRANI
        const confirmEmbed = new EmbedBuilder()
            .setTitle('🔍 LUAWARE | Veritabanı Sorgusu')
            .setColor('#1aff00') // Neon Yeşil
            .setDescription(
                `⚙️ **İşlem:** \`Aktif Lisansları Listeleme\`\n` +
                `⚠️ **Uyarı:** \`Veritabanındaki tüm veriler sayfalar halinde çekilecektir.\`\n` +
                `📝 **Durum:** \`Devam etmek için aşağıdaki butondan onay verin.\``
            )
            .setFooter({ text: 'Luaware OS Database Security' })
            .setTimestamp();

        const confirmRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_list')
                .setLabel('Onaylıyorum')
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('cancel_list')
                .setLabel('İptal')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Danger)
        );

        const response = await interaction.reply({ embeds: [confirmEmbed], components: [confirmRow], ephemeral: true, fetchReply: true });
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async (i) => {
            if (i.customId === 'cancel_list') {
                return i.update({ content: '❌ İşlem iptal edildi.', embeds: [], components: [] });
            }

            if (i.customId === 'confirm_list') {
                
                // MongoDB'den gerçek verileri çekiyoruz
                const dbKeys = await KeyModel.find({});

                if (!dbKeys || dbKeys.length === 0) {
                    return i.update({ content: '⚠️ Veritabanında kayıtlı lisans bulunamadı.', embeds: [], components: [] });
                }

                // 📄 SAYFALAMA SİSTEMİ
                let currentPage = 0;
                const itemsPerPage = 5; 
                const totalPages = Math.ceil(dbKeys.length / itemsPerPage);

                const generateEmbed = (page) => {
                    const start = page * itemsPerPage;
                    const currentItems = dbKeys.slice(start, start + itemsPerPage);

                    const descriptionData = currentItems.map(item => {
                        const gosterilenID = item.licenseId ? `#${item.licenseId}` : 'ID Yok';
                        const sahip = item.owner ? `<@${item.owner}>` : '\`Sahipsiz\`';
                        return `🆔 **ID:** \`${gosterilenID}\`\n👤 **Sahip:** ${sahip}\n🔑 **Key:** \`${item.key}\`\n⌛ **Süre:** \`${item.expiry}\`\n───────────────`;
                    }).join('\n');

                    return new EmbedBuilder()
                        .setTitle('🔑 LUAWARE | Lisans Havuzu')
                        .setColor('#1aff00')
                        .setDescription(`📊 **Toplam Key Sayısı:** \`${dbKeys.length}\`\n\n${descriptionData}`)
                        .setFooter({ text: `Sayfa: ${page + 1} / ${totalPages} | Luaware Security` })
                        .setTimestamp();
                };

                const generateButtons = (page) => {
                    return new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev_page')
                            .setLabel('◀')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === 0),
                        new ButtonBuilder()
                            .setCustomId('next_page')
                            .setLabel('▶')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page === totalPages - 1)
                    );
                };

                await i.update({ embeds: [generateEmbed(currentPage)], components: [generateButtons(currentPage)] });

                const pageCollector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

                pageCollector.on('collect', async (pageInteraction) => {
                    if (pageInteraction.customId === 'prev_page') currentPage--;
                    else if (pageInteraction.customId === 'next_page') currentPage++;

                    await pageInteraction.update({ 
                        embeds: [generateEmbed(currentPage)], 
                        components: [generateButtons(currentPage)] 
                    });
                });
            }
        });
    },
};