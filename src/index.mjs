import { config } from './env.mjs';
import { client, sendTaskCompleteLog, sendErrorLog } from "./discord.mjs"
import { addActive, getMembers, deleteActiveMember, addFirstMet, deleteFirstMet } from './db.mjs';

// ===== Functions ===== //

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function messageHandler(message){
    if (message.author.bot) return;
    return addActive(message.author.id);
}

function messageReactionHandler(_, user){
    if (user.bot) return;
    return addActive(user.id);
}

// ===== Callbacks ===== //

client.on("messageCreate", messageHandler);
client.on("messageDelete", messageHandler);
client.on("messageUpdate", (_, newMessage) => {
    messageHandler(newMessage);
});
client.on("messageReactionAdd", messageReactionHandler);
client.on("messageReactionRemove", messageReactionHandler);
client.on("userUpdate", (_, newUser) => {
    if (newUser.bot) return;
    addActive(newUser.id);
});

await client.login(config.botToken);

// ===== Crons ===== //

await (async() => {
    while(true) {
        try {
            const now = Date.now();
            console.log("Running Crons...")

            const dbMembers = await getMembers();

            const guild = await client.guilds.fetch({guild: config.serverId});
            const members = await guild.members.fetch();
            const activeRole = await guild.roles.fetch(config.activeRoleId);

            console.log("Members: ", members.map(x => ({id: x.user.id, username: x.user.username})));

            const logs = {
                setInactive: [],
                kicked: []
            }

            for(const [id, member] of members){
                if (member.user.bot) continue;
                if (dbMembers.active.includes(id)) continue;
                if (dbMembers.firstMet.includes(id)) continue; // Not yet expired first met members.

                if (id === (await guild.fetchOwner()).id) continue; // Don't kick the owner.
                if (member.roles.cache.some(role => config.VIPRoleIds.includes(role.id))) continue; // Don't kick VIPs.

                if (dbMembers.inactive.includes(id)) {
                    await member.roles.remove(activeRole);
                    await deleteActiveMember(id);
                    await addFirstMet(id);

                    logs.setInactive.push(member.user);
                    continue;
                }

                if (dbMembers.expiredFirstMet.includes(id)) {
                    await member.kick();
                    await deleteFirstMet(id);

                    logs.kicked.push(member.user);
                    continue;
                }

                // Not in DB yet.
                if (now < config.firstRunDeadline) continue;

                await member.roles.remove(activeRole);
                await deleteActiveMember(id);
                await addFirstMet(id);

                logs.setInactive.push(member.user);
                continue;
            }
            
            await sendTaskCompleteLog(logs);
        } catch (e) {
            console.error(e);
            await sendErrorLog(e);
        }

        await sleep(config.cronInterval);
    }
})();