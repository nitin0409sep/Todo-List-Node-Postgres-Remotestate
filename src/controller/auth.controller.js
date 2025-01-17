const dbHelper = require('../database/db-helper/authquery');
const bcrypt = require('bcrypt');
const jwtTokens = require('../utils/jwt-helper');

// GET ALL USERS
module.exports.getUsers = async (req, res, next) => {
    try {
        const users = await dbHelper.getUsers();

        const userData = users.map((user) => {
            const { user_name, email, created_at } = user;
            return { user_name, email, created_at };
        });

        return res.status(200).json({ users: userData, error: null, status: "OK" })
    } catch (err) {
        return res.status(500).json({ error: "Something Went Wrong" });
    }
}

// LOGIN USERS
module.exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            const missingFields = [];
            if (!email) missingFields.push('email');
            if (!password) missingFields.push('password');

            return res.status(400).json({ error: `Please provide ${missingFields.join(', ')}` });
        }

        // Check if user exists with the provided email
        const isUser = await dbHelper.checkUserExists(email);

        // Error handling for checkUserExists
        if (!isUser) return res.status(401).json({ error: "Invalid email" });

        // Check if the provided password is valid
        const isValidPassword = await dbHelper.loginUser(email, password);

        // Error handling for loginUser
        if (!isValidPassword) return res.status(401).json({ error: "Invalid Password" });

        // Tokens
        let tokens = jwtTokens.jwtTokens(isUser);

        // Set Refresh Token's Cookie
        res.cookie('refresh_token', 'refresh_token', {
            maxAge: new Date() * 0.001 + 300,
            domain: 'mydomain.com',
            secure: true,
            sameSite: 'none',
        });

        // Successful login response
        return res.status(200).json({ message: "User Logged In Successfully!", token: tokens.accessToken, error: null, status: "OK" });
    } catch (err) {
        // Generic error handling for any unexpected errors
        res.status(500).json({ error: "Failed to login" });
    }
}

// REGISTER USERS
module.exports.registerUser = async (req, res, next) => {
    try {
        const { user_name, email, password } = req.body;

        if (!user_name || !email || !password) {
            const missingFields = [];
            if (!user_name) missingFields.push('user name');
            if (!email) missingFields.push('email');
            if (!password) missingFields.push('password');

            return res.status(400).json({ error: `Please provide ${missingFields.join(', ')}` });
        }

        // Check if email already exists
        const emailExists = await dbHelper.checkUserExists(email);

        if (emailExists) {
            return res.status(400).json({ error: "Email already exists" });
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const registered = await dbHelper.registerUser(user_name, email, hashedPassword);

            if (registered) {
                // Generate Token
                const tokens = jwtTokens.jwtTokens(registered); // Access Token & Refresh Token

                // Set Refresh Token's Cookie
                res.cookie('refresh_token', tokens.refreshToken, { httpOnly: true, sameSite: 'none', secure: true })

                // Successful registered response
                return res.status(200).json({
                    message: "User registered successfully",
                    token: tokens.accessToken,
                    error: null,
                    status: "ok"
                });

            } else {
                return res.status(500).json({ error: "Failed to register user" });
            }
        }
    } catch (err) {
        return res.status(500).json({ error: "Failed to register user" });
    }
}