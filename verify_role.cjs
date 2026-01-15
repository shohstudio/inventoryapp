const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://213.230.99.253:5000/api';
// const API_URL = 'http://localhost:5000/api'; // Use local if running locally
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin';

async function run() {
    try {
        console.log("1. Logging in...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: ADMIN_USER,
            password: ADMIN_PASS
        }, { timeout: 5000 });
        const token = loginRes.data.token;
        console.log("Logged in.");

        console.log("2. Fetching Items...");
        const itemsRes = await axios.get(`${API_URL}/items`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000
        });

        // Find existing Test1 item or use a known one.
        // Or create one if not exists?
        // Let's use ID 39 from user logs if possible, or search by name.
        let testItem = itemsRes.data.find(i => i.name === 'Test1' || i.name === 'test1');

        if (!testItem) {
            console.log("Test1 not found, creating it.");
            const createForm = new FormData();
            createForm.append('name', 'Test1');
            createForm.append('model', 'TestModel');
            createForm.append('status', 'working');
            createForm.append('assignedRole', 'InitialRole');
            createForm.append('assignedTo', 'InitialOwner');
            // Add required
            createForm.append('inn', '111222');
            createForm.append('purchaseDate', '2023-01-01');
            createForm.append('price', '100');
            createForm.append('category', 'TestCat');
            createForm.append('building', 'TestBuild');
            createForm.append('location', 'TestLoc');

            const createRes = await axios.post(`${API_URL}/items`, createForm, {
                headers: { Authorization: `Bearer ${token}`, ...createForm.getHeaders() }
            });
            testItem = createRes.data;
            console.log("Created Item ID:", testItem.id);
        } else {
            console.log("Found Item ID:", testItem.id);
        }

        console.log("3. Updating Item with NEW Role...");
        const form = new FormData();
        // Required fields updates
        form.append('name', 'Test1');
        form.append('model', 'TestModel');
        form.append('assignedTo', 'Ali Valiyev');
        form.append('assignedRole', 'SUPER_ADMIN_TEST'); // CHECK THIS
        form.append('assignedPINFL', '12345678898766'); // Does not exist

        // Pass other fields to satisfy backend validation/partial updates
        form.append('inn', '111222');
        form.append('purchaseDate', '2023-01-01');
        form.append('price', '100');
        form.append('category', 'TestCat');
        form.append('building', 'TestBuild');
        form.append('location', 'TestLoc');
        form.append('status', 'working');
        form.append('quantity', '1');

        // We expect backend to see PINFL, fail to find user, and save to initialRole

        const updateRes = await axios.put(`${API_URL}/items/${testItem.id}`, form, {
            headers: { Authorization: `Bearer ${token}`, ...form.getHeaders() }
        });

        // console.log("Update Body:", updateRes.data);

        console.log("4. Verifying persistence...");
        const verifyRes = await axios.get(`${API_URL}/items/${testItem.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("VERIFY RESULT:");
        console.log("Initial Role:", verifyRes.data.initialRole);
        console.log("Initial Owner:", verifyRes.data.initialOwner);
        console.log("Initial PINFL:", verifyRes.data.initialPinfl);

        if (verifyRes.data.initialRole === 'SUPER_ADMIN_TEST') {
            console.log("✅ SUCCESS: Role persisted!");
        } else {
            console.log("❌ FAILURE: Role mismatch.");
        }

    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) console.error("Response data:", error.response.data);
    }
}

run();
