const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());

const studentRoutes = require('./routes/studentroutes');

app.use('/api', studentRoutes);

// Serve built frontend assets
app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(3000, () => {
    console.log('Server is running at http://localhost:3000');
});