CREATE DATABASE ooe;

\c ooe;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50),
    email VARCHAR(50)
);

INSERT INTO users (name, email) VALUES
('John Doe', 'john@example.com'),
('Jane Doe', 'jane@example.com');
