const { REST, Routes } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`🤖 Bot başarıyla aktif edildi: ${client.user.tag}`);

        const commands = client.commands.map(cmd => cmd.data);
        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

        try {
            await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
            console.log('✅ Bütün komutlar Discorda yüklendi!');
        } catch (error) {
            console.error('❌ Komut yükleme hatası:', error);
        }
    },
};