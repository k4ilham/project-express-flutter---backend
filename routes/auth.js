const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const connection = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
// const hashedPassword = bcrypt.hashSync(req.body.password, salt);


/**
 * REGISTER ENDPOINT
 */
router.post('/register', [
    // validation
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password should be at least 6 characters')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    connection.query(
        'CALL UserRegister(?, ?, ?, @result); SELECT @result;',
        [req.body.name, req.body.email, req.body.password],
        (err, results) => {
            if (err) {
                return res.status(500).json({
                    status: false,
                    message: 'Internal Server Error',
                    error: err
                });
            }

            const procedureResult = results[1][0]['@result'];
            if (procedureResult === 'Registration successful') {
                res.status(201).json({
                    status: true,
                    message: procedureResult
                });
            } else {
                res.status(400).json({
                    status: false,
                    message: procedureResult
                });
            }
        }
    );
});

/**
 * LOGIN ENDPOINT
 */
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    connection.query('CALL UserLogin(?, ?, @userIdOut, @resultOut); SELECT @userIdOut, @resultOut;', 
    [email, password], 
    (err, results) => {
        if (err) {
            return res.status(500).json({ status: false, message: 'Internal Server Error', error: err });
        }

        const outputUserId = results[1][0]['@userIdOut'];
        const outputResult = results[1][0]['@resultOut'];

        if (!outputUserId) {
            return res.status(400).json({ status: false, message: outputResult });
        }

        // Setelah mendapatkan user ID, panggil store procedure untuk mendapatkan detail user
        connection.query('CALL UserByIdGet(?)', [outputUserId], (err, userDetails) => {
            if (err) {
                return res.status(500).json({ status: false, message: 'Internal Server Error when fetching user details', error: err });
            }
            
            // Cek jika userDetails ada dan memiliki entri
            if (userDetails && userDetails[0] && userDetails[0][0]) {
                const user = userDetails[0][0];  // Mengambil user detail dari hasil query
        
                const token = jwt.sign({ id: user.id, email: user.email }, process.env.SECRET_KEY, { expiresIn: '1h' });
                
                res.status(200).json({
                    status: true,
                    message: outputResult,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    },
                    token: token
                });
            } else {
                res.status(500).json({
                    status: false,
                    message: "Error: User details not found!"
                });
            }
        });
        
    });
});






module.exports = router;
