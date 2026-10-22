const express = require('express');
const session = require('express-session');
const app = express();
const path = require('path');

const mysql = require('mysql2');
const bcrypt = require('bcrypt');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Collo@2005',
    database: 'Car_deals',
    port: 3306,
});

const query = (sql, values = []) => new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => err ? reject(err) : resolve(results));
});

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: "tttttttttttttttttttttttttttttttttttt",//encrypt session data
    resave: false,
    saveUninitialized: false,
}));
app.use((req, res, next) => {
    const user = req.session.user;
    res.locals.isadmin = user ? user.role === 'admin' : false;
    res.locals.user = user || null;
    next();
});

app.use((req, res, next) => {
    if (req.session.user?.role === 'employee' &&
        !['/dashboard', '/profile', '/logout'].includes(req.path)) {
        res.status(403).send('Employees can only view their profile.');
        return;
    }

    next();
});

const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        res.redirect('/login');
        return;
    }

    next();
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const requireAdmin = (req, res, next) => {
    if (req.session.user?.role !== 'admin') {
        res.status(403).send('Admin access required.');
        return;
    }

    next();
};
// create a route for the home page(index.ejs)
app.get('/', (req, res) => {
    res.render('login.ejs', { registered: req.query.registered === '1' });
});

app.get(['/latest', '/latest-additions'], (req, res) => {
    res.render('latest-additions.ejs');
});

app.get('/login', (req, res) => {
    if (req.session.user) {
        res.redirect('/dashboard');
        return;
    }

    res.render('login.ejs', { registered: req.query.registered === '1' });
});


app.post('/login', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    try {
        const users = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
        if (users.length === 0) {
            res.status(401).render('login.ejs', { errorMessage: 'Invalid email or password.' });
            return;
        }

        const user = users[0];
        const hasBcryptPassword = typeof user.password === 'string' && user.password.startsWith('$2');
        const isMatch = hasBcryptPassword
            ? await bcrypt.compare(password, user.password)
            : typeof password === 'string' && password === user.password;

        if (!isMatch) {
            res.status(401).render('login.ejs', { errorMessage: 'Invalid email or password.' });
            return;
        }

        const approvals = await query('SELECT email FROM user_approvals WHERE email = ?', [email]);
        if (approvals.length === 0) {
            res.status(403).render('login.ejs', {
                errorMessage: 'Your account is awaiting Admin approval.',
            });
            return;
        }

        if (!hasBcryptPassword) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
        }

        req.session.user = { email: user.email, role: user.role };
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).render('login.ejs', { errorMessage: 'Unable to log in right now.' });
    }
});

app.get('/clients', (req, res) => {
    db.query('SELECT * FROM clients', (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Unable to load clients');
            return;
        }

        res.render('client.ejs', { clients: results || [], user: req.session.user });
    });
});

app.post('/clients', (req, res) => {
    const sql = `
        INSERT INTO clients (client_id, contact, location)
        VALUES (?, ?, ?)
    `;
    const { client_id, contact, location } = req.body;

    db.query(sql, [client_id, contact, location], (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error: SQL error ' + err.message);
            return;
        }

        res.redirect('/clients');
    });
});

app.get(['/car-types', '/car_types'], (req, res) => {
    const sql = 'SELECT * FROM car_types';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error: SQL error ' + err.message);
            return;
        }

        res.render('car_types.ejs', { car_types: results || [], user: req.session.user });
    });
});

app.post(['/car-types', '/car_types'], (req, res) => {
    const sql = `
        INSERT INTO car_types (car_name, price, warranty, supplier_id)
        VALUES (?, ?, ?, ?)
    `;
    const { car_name, price, warranty, supplier_id } = req.body;

    db.query(sql, [car_name, price, warranty, supplier_id], (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error: SQL error ' + err.message);
            return;
        }

        res.redirect('/car-types');
    });
});

app.get('/employees', (req, res) => {
    const sql = 'SELECT * FROM employees';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).render('employees.ejs', {
                employees: [],
                user: req.session.user,
                errorMessage: 'Could not load employees. Check the database connection and table.',
            });
            return;
        }

        res.render('employees.ejs', { employees: results || [], user: req.session.user, errorMessage: null });
    });
});

app.post('/employees', (req, res) => {
    const sql = `
        INSERT INTO employees (employee_id, phone, work_position)
        VALUES (?, ?, ?)
    `;

    const { employee_id, phone, work_position } = req.body;

    db.query(sql, [employee_id, phone, work_position], (err) => {
        if (err) {
            console.error(err);
            res.status(500).render('employees.ejs', {
                employees: [],
                user: req.session.user,
                errorMessage: 'Could not save employee. Check the ID and database connection.',
            });
            return;
        }

        res.redirect('/employees');
    });
});

app.get('/sales', async (req, res) => {
    try {
        const [sales, clients, employees] = await Promise.all([
            query('SELECT * FROM sales'),
            query('SELECT client_id FROM clients'),
            query('SELECT employee_id FROM employees'),
        ]);

        res.render('sales.ejs', {
            sales,
            clients,
            employees,
            user: req.session.user,
            errorMessage: null,
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('sales.ejs', {
            sales: [],
            clients: [],
            employees: [],
            user: req.session.user,
            errorMessage: 'Could not load sales. Check the database connection and required tables.',
        });
    }
});

app.post('/sales', (req, res) => {
    const sql = `
        INSERT INTO sales (sales_id, price, durabilty, client_id, employee_id)
        VALUES (?, ?, ?, ?, ?)
    `;
    const { sales_id, price, durabilty, client_id, employee_id } = req.body;

    db.query(sql, [sales_id, price, durabilty, client_id, employee_id], (err) => {
        if (err) {
            console.error(err);
            res.status(500).render('sales.ejs', {
                sales: [],
                clients: [],
                employees: [],
                user: req.session.user,
                errorMessage: 'Could not save sale. Check the IDs and database connection.',
            });
            return;
        }

        res.redirect('/sales');
    });
});

app.get('/suppliers', (req, res) => {
    const sql = 'SELECT * FROM suppliers';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).render('suppliers.ejs', {
                suppliers: [],
                user: req.session.user,
                errorMessage: 'Could not load suppliers. Check the database connection and table.',
            });
            return;
        }

        res.render('suppliers.ejs', { suppliers: results || [], user: req.session.user, errorMessage: null });
    });
});

app.post('/suppliers', (req, res) => {
    const sql = `
        INSERT INTO suppliers (supplier_id, name, phone)
        VALUES (?, ?, ?)
    `;
    const { supplier_id, name, phone } = req.body;

    db.query(sql, [supplier_id, name, phone], (err) => {
        if (err) {
            console.error(err);
            res.status(500).render('suppliers.ejs', {
                suppliers: [],
                user: req.session.user,
                errorMessage: 'Could not save supplier. Check the ID and database connection.',
            });
            return;
        }

        res.redirect('/suppliers');
    });
});


app.get('/admin', requireAuth, requireAdmin, (req, res) => {
    res.render('admin.ejs');
});


app.get('/register', (req, res) => {
    res.render('register.ejs');
});

app.post('/register', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password, role } = req.body;
    const allowedRoles = ['admin', 'manager', 'employee'];

    if (!isValidEmail(email) || typeof password !== 'string' || password.length < 8 || !allowedRoles.includes(role)) {
        res.status(400).render('register.ejs', {
            errorMessage: 'Enter a valid email, a password with at least 8 characters, and a role.',
        });
        return;
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await query(
            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [email, hashedPassword, role]
        );
        res.redirect('/login?registered=1');
    } catch (err) {
        console.error(err);
        const duplicate = err.code === 'ER_DUP_ENTRY';
        res.status(duplicate ? 409 : 500).render('register.ejs', {
            errorMessage: duplicate
                ? 'An account with that email already exists.'
                : 'Unable to register. Check the database and try again.',
        });
    }
});

app.get('/add-user', requireAuth, requireAdmin, async (req, res) => {
    try {
        const pendingUsers = await query(`
            SELECT users.email, users.role
            FROM users
            LEFT JOIN user_approvals ON user_approvals.email = users.email
            WHERE user_approvals.email IS NULL
            ORDER BY users.email
        `);
        res.render('add-user.ejs', { pendingUsers, errorMessage: null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Unable to load registered accounts.');
    }
});

app.post('/add-user', requireAuth, requireAdmin, async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const role = req.body.role;

    try {
        if (!['manager', 'employee'].includes(role)) {
            const pendingUsers = await query(`
                SELECT users.email, users.role
                FROM users
                LEFT JOIN user_approvals ON user_approvals.email = users.email
                WHERE user_approvals.email IS NULL
                ORDER BY users.email
            `);
            res.status(400).render('add-user.ejs', {
                pendingUsers,
                errorMessage: 'Choose Manager or Employee as the approved role.',
            });
            return;
        }

        const users = await query(`
            SELECT users.email
            FROM users
            LEFT JOIN user_approvals ON user_approvals.email = users.email
            WHERE users.email = ? AND user_approvals.email IS NULL
            LIMIT 1
        `, [email]);
        if (!isValidEmail(email) || users.length === 0) {
            const pendingUsers = await query(`
                SELECT users.email, users.role
                FROM users
                LEFT JOIN user_approvals ON user_approvals.email = users.email
                WHERE user_approvals.email IS NULL
                ORDER BY users.email
            `);
            res.status(400).render('add-user.ejs', {
                pendingUsers,
                errorMessage: 'Enter the email address of a registered account that is still pending approval.',
            });
            return;
        }

        await query('UPDATE users SET role = ? WHERE email = ?', [role, email]);
        await query('INSERT IGNORE INTO user_approvals (email) VALUES (?)', [email]);
        res.redirect('/add-user');
    } catch (err) {
        console.error(err);
        res.status(500).send('Unable to approve this account.');
    }
});

//create a dashboard route for the page
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        res.redirect('/login');
        return;
    }

    if (req.session.user.role === 'admin') {
        res.render('admin.ejs');
    } else if (req.session.user.role === 'manager') {
        res.render('manager.ejs');
    }else if (req.session.user.role === 'employee') {
        res.render('employee.ejs', { user: req.session.user });
    }else {
        res.status(403).send('Access denied');
    }
});

app.get('/profile', requireAuth, (req, res) => {
    res.render('profile.ejs', { user: req.session.user });
});

app.get('/manager', requireAuth, (req, res) => {
    if (req.session.user.role !== 'manager') {
        res.redirect('/dashboard');
        return;
    }

    res.render('manager.ejs');
});
// destroy the session when the user logs out
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout failed:', err);
            res.status(500).send('Unable to log out');
            return;
        }

        res.redirect('/login');
    });
});
const startServer = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS user_approvals (
                email VARCHAR(255) PRIMARY KEY,
                approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await query(`
            CREATE TABLE IF NOT EXISTS app_migrations (
                migration_key VARCHAR(100) PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const migrations = await query(
            'SELECT migration_key FROM app_migrations WHERE migration_key = ?',
            ['approve-existing-admins']
        );
        if (migrations.length === 0) {
            await query(
                'INSERT IGNORE INTO user_approvals (email) SELECT email FROM users WHERE role = ?',
                ['admin']
            );
            await query(
                'INSERT INTO app_migrations (migration_key) VALUES (?)',
                ['approve-existing-admins']
            );
        }

        app.listen(3001, () => {
            console.log('Server is running on http://localhost:3001');
        });
    } catch (err) {
        console.error('Unable to initialize user approvals:', err);
        process.exitCode = 1;
    }
};

startServer();
