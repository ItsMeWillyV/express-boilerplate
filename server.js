// Load dependencies

const path = require('path');
const { fileURLToPath } = require('url');
const fs = require('fs');

// For password hashing, tokens, etc
const { randomBytes, pbkdf2Sync } = require('node:crypto');

// Express & Express Middleware
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Simple database module
const { QuickDB } = require('quick.db');

// Setup
const app = express();
const port = 8080;
const db = new QuickDB({ filePath: 'database.sqlite' });

app.set('view engine', 'ejs');
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


// Initialize database
(async () => {
	if (!await db.get('users')){
		await db.set('users', {});
	}
})();

// 404 page
const error404 = function(req, res) {
	res.status(404);

	if (req.accepts('html')) {
		res.render('404', { url: req.url });
		return;
	}

	if (req.accepts('json')) {
		res.json({ error: 'Not found' });
		return;
	}

	res.type('txt').send('Not found');
}

// CDN
app.use('/cdn', express.static(`${__dirname}/cdn`));

// Robots.txt
app.get('/robots.txt', (req, res) => {
	res.sendFile(`${__dirname}/robots.txt`);
});

// Auto render
app.use((req, res, next) => {
	if (req.accepts('html')) {
		let url = req.url.split("/").slice(1);
		if (url[0] != "private" && url[0] != "favicon.ico") {
			url = url.join("/");
			if (url == "") url = "home";
			if (fs.existsSync(`${__dirname}/views/${url}.ejs`)) {
				res.status(200);
				res.render(url.toLowerCase(), { url: req.url });
				return;
			}
		}
	}
	next();
});

// Not found
app.use((req, res) => error404(req, res));

// Start server
app.listen(port, () => console.log('\x1b[31m%s\x1b[0m', `Server listening to port ${port}`));
