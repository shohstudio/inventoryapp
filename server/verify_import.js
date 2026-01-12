const fs = require('fs');
const xlsx = require('xlsx');

const API_URL = 'http://127.0.0.1:5000/api';

async function runTest() {
    console.log("--- Starting Verification ---");

    // 1. Create Test Excel File
    console.log("1. Creating test Excel file...");
    const wb = xlsx.utils.book_new();
    const data = [
        { Nomi: "Test Laptop", Serial: "DUPLICATE-TEST-001", Narx: 500, Soni: 1 }
    ];
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
    xlsx.writeFile(wb, "test_import.xlsx");
    console.log("   test_import.xlsx created.");

    // 2. Login
    console.log("2. Logging in as admin...");
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin' })
    });

    if (!loginRes.ok) {
        throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("   Login success. Token received.");

    // 3. Import First Time (Should success)
    console.log("3. Importing file (First attempt)...");
    const formData = new FormData();
    const fileBuffer = fs.readFileSync('test_import.xlsx');
    const blob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    formData.append('file', blob, 'test_import.xlsx');

    const importRes1 = await fetch(`${API_URL}/items/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    const res1Text = await importRes1.text();
    console.log(`   Attempt 1 Result: ${importRes1.status} - ${res1Text}`);

    // 4. Import Second Time (Should fail with duplicate error)
    console.log("4. Importing file (Second attempt - Expecting Duplicate Error)...");

    // Re-create form data (fetch might consume it?)
    const formData2 = new FormData();
    formData2.append('file', blob, 'test_import.xlsx');

    const importRes2 = await fetch(`${API_URL}/items/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData2
    });

    const res2Text = await importRes2.text();
    console.log(`   Attempt 2 Result: ${importRes2.status} - ${res2Text}`);

    if (importRes2.status === 400 && res2Text.includes("mavjud")) {
        console.log("SUCCESS: Duplicate check is working!");
    } else {
        console.log("FAILURE: Duplicate check NOT triggering as expected.");
    }

    // Cleanup
    fs.unlinkSync('test_import.xlsx');
}

runTest().catch(console.error);
