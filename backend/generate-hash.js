const bcrypt = require('bcryptjs');

// Generate hash for password: admin123
const password = 'admin123';

bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error('Error:', err);
        return;
    }

    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nUse this hash in your database schema.sql file.');
});
