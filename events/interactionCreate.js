const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const KeyModel = require('../models/key'); // Yolun doğru olduğundan emin ol kanka
const moment = require('moment');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // 1. SLASH KOMUTLAR
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Komut çalıştırılırken hata oluştu!', ephemeral: true });
            }
        }

        // 2. BUTONLAR (KEY ALMA)
        if (interaction.isButton()) {
            const isEnglish = interaction.customId === 'get_key_en';
            const generatedKey = `TURKEY-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

            // Zaten keyi var mı kontrolü
            const existingKey = await KeyModel.findOne({ createdBy: interaction.user.id });
            if (existingKey) {
                const msg = isEnglish ? "You already have a key!" : "Zaten bir keyin var kanka!";
                return interaction.reply({ content: `❌ ${msg} Key: \`${existingKey.key}\``, ephemeral: true });
            }

            const newKey = new KeyModel({
                key: generatedKey,
                createdBy: interaction.user.id
            });

            try {
                await newKey.save();
                const dmEmbed = new EmbedBuilder()
                    .setTitle(isEnglish ? '🇺🇸 TURKEY HUB | LICENSE' : '🇹🇷 TURKEY HUB | LİSANS')
                    .setColor('#FF0000')
                    .addFields(
                        { name: isEnglish ? '🔑 YOUR KEY' : '🔑 ANAHTARIN', value: `\`${generatedKey}\``, inline: false },
                        { name: isEnglish ? '⚠️ WARNING' : '⚠️ UYARI', value: isEnglish ? 'If you leave the server, your key will be deleted!' : 'Sunucudan çıkarsan keyin silinir!', inline: false }
                    );

                await interaction.user.send({ embeds: [dmEmbed] });
                await interaction.reply({ content: isEnglish ? '✅ Check your DMs!' : '✅ Keyin DM kutuna atıldı!', ephemeral: true });
            } catch (err) {
                await interaction.reply({ content: '❌ DM Closed!', ephemeral: true });
            }
        }
    },
};