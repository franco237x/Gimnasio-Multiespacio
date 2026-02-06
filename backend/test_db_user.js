require('dotenv').config();
const User = require('./models/User');
const { testConnection } = require('./config/database');

async function testUserCreation() {
    try {
        console.log("Testing DB Connection...");
        await testConnection();
        console.log("DB Connected.");

        console.log("Attempting to create user...");
        const newUser = await User.create({
            name: "Test User",
            email: "test_" + Date.now() + "@example.com",
            password: "password123",
            phone: "1234567890"
        });
        console.log("User created successfully:", newUser);

        console.log("Attempting to create email verification...");
        const token = await User.createEmailVerification(newUser.id);
        console.log("Verification token created:", token);

    } catch (error) {
        console.error("CAPTURE THIS ERROR:");
        console.error(error);
    } finally {
        process.exit();
    }
}

testUserCreation();
