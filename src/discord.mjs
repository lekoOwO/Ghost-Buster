import Discord from "discord.js";
import { config } from "./env.mjs";

const client = new Discord.Client({ 
    fetchAllMembers: true,
    intents: [Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildPresences, Discord.GatewayIntentBits.GuildMembers, Discord.GatewayIntentBits.GuildMessages, Discord.GatewayIntentBits.GuildMessageReactions]
});

async function sendTaskCompleteLog(logs){
    const body = {
        "content": `Task completed.\n\Time: \`${new Date().toISOString()}\`\n\n`,
        "embeds": [
          {
            "title": "Kicked",
            "description": logs.kicked.map(user => user.toString()).join("\n"),
            "color": 16711680
          },
          {
            "title": "Inactivated",
            "description": logs.setInactive.map(user => user.toString()).join("\n"),
            "color": 36863
          }
        ],
        "attachments": []
      }

    await fetch(config.logWebhook, {
        "method":"POST",
        "headers": {"Content-Type": "application/json"},
        "body": JSON.stringify(body)
    });
};

async function sendErrorLog(error){
    const body = {
        "content": `Task failed.\nTime: \`${new Date().toISOString()}\`\n\n`,
        "embeds": [
          {
            "title": "Error",
            "description": error.message,
            "color": 16711680
          }
        ],
        "attachments": []
    }

    await fetch(config.logWebhook, {
        "method":"POST",
        "headers": {"Content-Type": "application/json"},
        "body": JSON.stringify(body)
    });
}

export {client, sendTaskCompleteLog, sendErrorLog};