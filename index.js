require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');

const app = express();
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
    partials: [Partials.Channel]
});

// Komutları Koleksiyona Yükle
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

// Olayları (Events) Yükle
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// --- MONGODB & API AYARLARI ---
mongoose.connect(process.env.MONGO_URI).then(() => console.log('✅ DB Bağlı!'));
// (API verify route'un buraya gelebilir kanka)

app.listen(process.env.PORT || 3000);
client.login(process.env.TOKEN);