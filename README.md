# Collins Deals

Collins Deals is a small car-dealership management web application built with
Node.js, Express, EJS, and MySQL. It provides pages for viewing and managing
car types, clients, suppliers, employees, and sales, with dashboards for
administrators, managers, and sales employees.

## Features

- Role-specific dashboards and account profiles
- Registration with a requested role and Admin email approval before sign-in
- Admin account approval by registered email only
- MySQL connection through `mysql2`
- Car type, client, employee, supplier, and sales forms
- Static styling served from `public/`

Employee accounts can view only their dashboard and profile.

## Requirements

- Node.js and npm
- MySQL Server
- A MySQL database named `car_deals`, with tables and columns matching the
  queries in `auth.js`

## Setup

1. Install the Node.js dependencies:

   ```sh
   npm install
   ```

2. Create and configure the MySQL database. The application expects a
   `Car_deals` database. The application expects a `users` table with
   `email`, `password`, and `role` columns, plus the operational tables
   described by the queries in `auth.js`.

   On startup, the application creates its account-approval and migration
   tables. Existing Admin accounts are approved once during this migration.

3. Configure the MySQL connection settings in `auth.js` for your local
   database. Avoid committing real credentials to source control.

4. Start the application:

   ```sh
   node auth.js
   ```

5. Open [http://localhost:3001](http://localhost:3001) in your browser.

## Routes

| Path | Description |
| --- | --- |
| `/` | Login page |
| `/login` | Login form |
| `/register` | Register and request a role |
| `/dashboard` | Role-specific dashboard; redirects to login when signed out |
| `/profile` | Signed-in user's profile |
| `/add-user` | Admin-only email approval page |
| `/clients` | Clients page |
| `/car_types` | Car types page backed by a database query |
| `/car-types` | Car types page |
| `/employees` | Employees page |
| `/sales` | Sales page |
| `/suppliers` | Suppliers page |
| `/latest` | Latest additions page |
| `/logout` | End the current session |

## Project structure

```text
.
├── auth.js           # Express app, routes, session handling, and DB connection
├── schema.sql        # MySQL console output (not an executable setup script)
├── public/
│   ├── images/
│   └── style.css
└── views/            # EJS templates
```
