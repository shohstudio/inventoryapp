const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://213.230.99.253:5000/api';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin';

async function run() {
    try {
        console.log("1. Logging in...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: ADMIN_USER,
            password: ADMIN_PASS
        });
        const token = loginRes.data.token;
        console.log("Logged in.");

        console.log("2. Fetching Items to find Test1...");
        const itemsRes = await axios.get(`${API_URL}/items`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const testItem = itemsRes.data.find(i => i.name === 'Test1' || i.name === 'test1');
        if (!testItem) {
            console.error("Test1 item not found! Cannot debug update.");
            return;
        }
        console.log("Found Test1 Item ID:", testItem.id);
        console.log("Current Initial Role:", testItem.initialRole);

        console.log("3. Updating Test1 Item with new Role...");
        const form = new FormData();
        form.append('name', 'Test1');
        form.append('assignedRole', 'DebugRole123');
        form.append('assignedTo', 'DebugUser');
        // Add other required fields to avoid validation errors if any
        form.append('model', 'test1');
        form.append('status', 'working');
        form.append('price', '1000');

        const updateRes = await axios.put(`${API_URL}/items/${testItem.id}`, form, {
            headers: {
                Authorization: `Bearer ${token}`,
                ...form.getHeaders()
            }
        });

        console.log("Update Response Status:", updateRes.status);
        console.log("Update Response Body:", JSON.stringify(updateRes.data, null, 2));

        console.log("4. Fetching Test1 Item again to verify...");
        const verifyRes = await axios.get(`${API_URL}/items/${testItem.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("New Initial Role:", verifyRes.data.initialRole);

        if (verifyRes.data.initialRole === 'DebugRole123') {
            console.log("SUCCESS: Initial Role updated correctly!");
        } else {
            console.log("FAILURE: Initial Role did NOT update.");
        }

    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
}

run();
