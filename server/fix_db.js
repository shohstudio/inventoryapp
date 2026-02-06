const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function fix() {
    console.log("Starting DB Health Check...");
    
    // 1. Check .env
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('file:./dev.db')) {
            console.log("Updating .env to point to prisma/dev.db...");
            envContent = envContent.replace('file:./dev.db', 'file:./prisma/dev.db');
            fs.writeFileSync(envPath, envContent);
        }
    }

    // 2. Run Prisma sync
    try {
        console.log("Running prisma generate...");
        execSync('npx prisma generate', { stdio: 'inherit' });
        console.log("Running prisma db push...");
        execSync('npx prisma db push', { stdio: 'inherit' });
        console.log("DB Sync Successful!");
    } catch (e) {
        console.error("Prisma Sync Failed:", e.message);
    }
}

fix();
