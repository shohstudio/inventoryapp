const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function debugBackend() {
    try {
        console.log("1. Logging in...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin',
            password: 'admin'
        });

        const token = loginRes.data.token;
        console.log("Logged in.");

        console.log("2. Fetching Items...");
        const itemsRes = await axios.get(`${API_URL}/items`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Response Data Keys:", Object.keys(itemsRes.data));

        let items = [];
        if (Array.isArray(itemsRes.data)) {
            items = itemsRes.data;
        } else if (itemsRes.data.items && Array.isArray(itemsRes.data.items)) {
            items = itemsRes.data.items;
        } else {
            console.log("Unknown structure:", itemsRes.data);
            return;
        }

        console.log(`Found ${items.length} items.`);

        if (items.length === 0) return;

        // Check for specific fields
        const itemWithUser = items.find(i => i.assignedTo);
        const itemWithoutUser = items.find(i => !i.assignedTo && (i.initialOwner || i.initialRole));

        if (itemWithUser) {
            console.log("\n[ITEM WITH USER]");
            console.log("ID:", itemWithUser.id);
            console.log("AssignedTo:", itemWithUser.assignedTo);
            console.log("Position (Should exist):", itemWithUser.assignedTo.position);
        } else {
            console.log("\n[NO ITEM WITH USER FOUND]");
        }

        if (itemWithoutUser) {
            console.log("\n[ITEM WITHOUT USER (Initial Info)]");
            console.log("ID:", itemWithoutUser.id);
            console.log("InitialOwner:", itemWithoutUser.initialOwner);
            console.log("InitialRole (Should exist):", itemWithoutUser.initialRole);
        } else {
            console.log("\n[NO ITEM WITH INITIAL INFO FOUND]");
        }

    } catch (error) {
        console.error("Error:", error.message);
    }
}

debugBackend();
