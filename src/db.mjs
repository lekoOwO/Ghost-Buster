import { createClient } from 'redis';
import {config} from './env.mjs';

const HASH_KEYS = {
    ACTIVE_TIMES: "activeTimes",
    FIRST_MET: "firstMet",
}
Object.freeze(HASH_KEYS);

const client = createClient({
    url: config.db
});

await client.connect();

async function addActive(id, time=Date.now()) {
    console.log("Adding active member: ", id);
    await client.hSet(HASH_KEYS.ACTIVE_TIMES, id, time);
}

async function getMembers(){
    const now = Date.now();

    const allMembers = await client.hGetAll(HASH_KEYS.ACTIVE_TIMES);
    const firstMetMembers = await client.hGetAll(HASH_KEYS.FIRST_MET);

    const members = {
        active: [],
        inactive: [],
        firstMet: [],
        expiredFirstMet: []
    }

    for(const [id, time] of Object.entries(allMembers)){
        if (now - parseInt(time) > config.inactivityTime) {
            members.inactive.push(id);
        } else {
            members.active.push(id);
        }
    }

    // clear first mets
    for(const [id, time] of Object.entries(firstMetMembers)){
        if (Object.keys(allMembers).includes(id)) {
            await client.hDel(HASH_KEYS.FIRST_MET, id);
        } else {
            if (now - parseInt(time) > config.firstMetExpireTime) {
                members.expiredFirstMet.push(id);
            } else members.firstMet.push(id);
        }
    }

    return members;
}

async function deleteActiveMember(id){
    await client.hDel(HASH_KEYS.ACTIVE_TIMES, id);
}

async function addFirstMet(id, time=Date.now()){
    await client.hSet(HASH_KEYS.FIRST_MET, id, time);
}

async function deleteFirstMet(id){
    await client.hDel(HASH_KEYS.FIRST_MET, id);
}

export {
    addActive,
    getMembers,
    deleteActiveMember,
    addFirstMet,
    deleteFirstMet
}