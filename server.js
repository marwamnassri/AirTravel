const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const port = 3000;

// Middleware pour parser les données
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Middleware pour gérer les sessions
app.use(
    session({
        secret: 'votre_secret_de_session',
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false, // En production, mettre à true avec HTTPS
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // Durée : 24 heures
        },
    })
);

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Connexion à la base de données
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'airtravel',
});

db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
        process.exit(1); // Arrête le serveur si la connexion échoue
    } else {
        console.log('Connexion à la base de données réussie');
    }
});

// Vérifier et créer un utilisateur admin
const checkAndCreateAdmin = async () => {
    const adminEmail = 'admin@example.com';  // Définir l'email de l'admin
    const adminPassword = 'adminPassword';  // Définir le mot de passe de l'admin

    // Vérification si l'admin existe déjà dans la base de données
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [adminEmail], async (err, result) => {
        if (err) {
            console.error('Erreur lors de la vérification de l\'admin:', err);
            return;
        }

        if (result.length === 0) {
            // Si l'admin n'existe pas, on le crée avec un mot de passe crypté
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const insertQuery = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
            db.query(insertQuery, ['Admin', adminEmail, hashedPassword, 'admin'], (err) => {
                if (err) {
                    console.error('Erreur lors de la création de l\'admin:', err);
                } else {
                    console.log('Utilisateur admin créé avec succès');
                }
            });
        } else {
            console.log('L\'utilisateur admin existe déjà');
        }
    });
};

// Appeler la vérification de l'admin
checkAndCreateAdmin();

// Routes
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.redirect('/connexion');
    }
});

app.get('/connexion', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'connexion.html'));
});

app.get('/inscription', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'inscription.html'));
});

app.post('/signup', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).send('Les mots de passe ne correspondent pas');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        db.query(query, [name, email, hashedPassword], (err) => {
            if (err) {
                console.error('Erreur lors de l\'inscription:', err);
                return res.status(500).send('Erreur lors de l\'inscription');
            }
            res.redirect('/connexion');
        });
    } catch (err) {
        console.error('Erreur lors du cryptage du mot de passe:', err);
        res.status(500).send('Erreur interne');
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, result) => {
        if (err) {
            console.error('Erreur lors de la connexion:', err);
            return res.status(500).send('Erreur lors de la connexion');
        }

        if (result.length === 0) {
            return res.status(400).send('Utilisateur non trouvé');
        }

        const isMatch = await bcrypt.compare(password, result[0].password);

        if (isMatch) {
            req.session.userId = result[0].id;
            req.session.role = result[0].role;  // Sauvegarder le rôle dans la session
            console.log('Connexion réussie pour l\'utilisateur:', result[0].email);

            if (result[0].role === 'admin') {
                return res.redirect('/dashboard');
            } else {
                return res.redirect('/');
            }
        } else {
            res.status(400).send('Mot de passe incorrect');
        }
    });
});

app.get('/profile', (req, res) => {
    if (req.session.userId) {
        const query = 'SELECT * FROM users WHERE id = ?';
        db.query(query, [req.session.userId], (err, result) => {
            if (err) {
                return res.status(500).send('Erreur lors de la récupération du profil');
            }

            if (result.length > 0) {
                res.json({
                    success: true,
                    id: result[0].id,
                    name: result[0].name,
                    email: result[0].email,
                });
            } else {
                res.json({ success: false });
            }
        });
    } else {
        res.status(401).json({ success: false, message: 'Non authentifié' });
    }
});

app.get('/deconnexion', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Erreur lors de la déconnexion');
        }
        res.redirect('/connexion');
    });
});

app.post('/reserve', (req, res) => {
    const { date, time, persons } = req.body;

    if (!date || !time || !persons) {
        return res.status(400).json({
            success: false,
            message: 'Veuillez remplir tous les champs avant de réserver.',
        });
    }

    const query = 'INSERT INTO reservations (date_reservation, heure_reservation, nombre_personnes) VALUES (?, ?, ?)';
    db.query(query, [date, time, persons], (err) => {
        if (err) {
            console.error('Erreur lors de la réservation :', err);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la réservation.',
            });
        }

        res.json({
            success: true,
            message: 'Réservation réussie!',
        });
    });
});

app.post('/contact', (req, res) => {
    const { full_name, subject, email, message, phone, date, details, address } = req.body;

    const sql = `INSERT INTO contacts (full_name, subject, email, message, phone, date, details, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [full_name, subject, email, message, phone, date, details, address], (err, result) => {
        if (err) {
            console.error('Erreur lors de l\'insertion des données :', err);
            return res.status(500).json({ success: false, message: 'Erreur interne' });
        }
        res.status(200).json({ success: true, message: 'Message envoyé avec succès' });
    });
});

app.get('/dashboard', (req, res) => {
    console.log('Rôle de la session:', req.session.role); // Pour déboguer
    if (req.session.userId && req.session.role === 'admin') {
        res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    } else {
        res.redirect('/connexion');
    }
});

// Lancer le serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
