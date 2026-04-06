const { EmbedBuilder, MessageFlags } = require('discord.js');
const KeyModel = require('../models/Key');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        
        // --- 1. SLASH KOMUTLAR ---
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Bir hata oluştu!', flags: [MessageFlags.Ephemeral] });
            }
        }

        // --- 2. BUTON TIKLAMALARI (KEY ALMA) ---
        else if (interaction.isButton()) {
            if (interaction.customId === 'generate_key') {
                try {
                    // Rastgele Key Üret
                    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
                    const newKeyString = `KANKA-${randomString}`;

                    // Veritabanına Kaydet
                    const newKey = new KeyModel({
                        key: newKeyString,
                        userId: interaction.user.id
                    });
                    
                    await newKey.save();

                    // Kullanıcıya DM At
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('🔑 İşte Script Keyin!')
                        .setDescription(`Scripti kullanmak için keyin: \`${newKeyString}\` \n\n*İyi oyunlar kanka!*`)
                        .setColor('#00ff00');

                    await interaction.user.send({ embeds: [dmEmbed] });

                    // Kanala Bilgi Ver
                    await interaction.reply({ 
                        content: '✅ Keyin başarıyla oluşturuldu ve DM kutuna gönderildi!', 
                        flags: [MessageFlags.Ephemeral] 
                    });

                } catch (error) {
                    console.error('❌ Key Kaydetme Hatası:', error);
                    
                    if (error.code === 50007) {
                        return interaction.reply({ 
                            content: '❌ DM kutun kapalı olduğu için keyi gönderemedim!', 
                            flags: [MessageFlags.Ephemeral] 
                        });
                    }

                    await interaction.reply({ 
                        content: '❌ Key oluşturulurken bir hata oluştu. Lütfen tekrar dene.', 
                        flags: [MessageFlags.Ephemeral] 
                    });
                }
            }
        }
    },
};