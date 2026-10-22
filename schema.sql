mysql> show tables;
+---------------------+
| Tables_in_car_deals |
+---------------------+
| car_types           |
| clients             |
| employees           |
| sales               |
| suppliers           |
+---------------------+
5 rows in set (0.02 sec)

mysql> describe car_types;
+--------------+-------------+------+-----+---------+-------+
| Field        | Type        | Null | Key | Default | Extra |
+--------------+-------------+------+-----+---------+-------+
| car_types_id | int         | NO   | PRI | NULL    |       |
| price        | int         | YES  |     | NULL    |       |
| warranty     | varchar(50) | YES  |     | NULL    |       |
| supplier_id  | int         | YES  | MUL | NULL    |       |
+--------------+-------------+------+-----+---------+-------+
4 rows in set (0.03 sec)

mysql> describe clients;
+-----------+--------------+------+-----+---------+-------+
| Field     | Type         | Null | Key | Default | Extra |
+-----------+--------------+------+-----+---------+-------+
| client_id | int          | NO   | PRI | NULL    |       |
| contact   | varchar(50)  | YES  |     | NULL    |       |
| location  | varchar(100) | YES  |     | NULL    |       |
+-----------+--------------+------+-----+---------+-------+
3 rows in set (0.00 sec)

mysql> describe employees;
+---------------+-------------+------+-----+---------+-------+
| Field         | Type        | Null | Key | Default | Extra |
+---------------+-------------+------+-----+---------+-------+
| employee_id   | int         | NO   | PRI | NULL    |       |
| phone         | varchar(20) | YES  |     | NULL    |       |
| work_position | varchar(30) | YES  |     | NULL    |       |
+---------------+-------------+------+-----+---------+-------+
3 rows in set (0.02 sec)

mysql> describe sales;
+-------------+-------------+------+-----+---------+-------+
| Field       | Type        | Null | Key | Default | Extra |
+-------------+-------------+------+-----+---------+-------+
| sales_id    | int         | NO   | PRI | NULL    |       |
| price       | int         | YES  |     | NULL    |       |
| durabilty   | varchar(50) | YES  |     | NULL    |       |
| client_id   | int         | YES  | UNI | NULL    |       |
| employee_id | int         | YES  | MUL | NULL    |       |
+-------------+-------------+------+-----+---------+-------+
5 rows in set (0.00 sec)

mysql> describe suppliers;
+-------------+-------------+------+-----+---------+-------+
| Field       | Type        | Null | Key | Default | Extra |
+-------------+-------------+------+-----+---------+-------+
| supplier_id | int         | NO   | PRI | NULL    |       |
| phone       | varchar(20) | YES  |     | NULL    |       |
| name        | varchar(30) | YES  |     | NULL    |       |
+-------------+-------------+------+-----+---------+-------+
3 rows in set (0.02 sec)

mysql>
