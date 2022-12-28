require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const i18n = require('i18n')

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')))
i18n.configure({
	locales: ['en', 'vi'],
	directory: path.join(__dirname, 'locales'),
	defaultLocale: 'vi',
	cookie: 'lang'
})
app.use(i18n.init)

app.get('/home', (req, res) => {
	res.cookie('lang', 'vi', {
		httpOnly: true,
		maxAge: 999999
	})

	return res.render('index', {
		'http_host': 'http://localhost/',
		'wedding_date': process.env.WEDDING_DATE,
		'google_map_link': 'https://goo.gl/maps/3bmVTUaG4tXNyXQC7',
		'map_link': ''
	})
})

app.listen(80, () => {
	console.log(`Example app listening on port 80`)
})
