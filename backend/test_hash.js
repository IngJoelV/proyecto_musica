// test_hash.js
const bcrypt = require('bcrypt');
const password = 'admin123'; // ¡Esta es la contraseña de texto plano!
bcrypt.hash(password, 10, function(err, hash) {
    console.log("NUEVO HASH:", hash); // <-- COPIA ESTE VALOR
});