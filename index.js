const express = require('express')
const app = express()

app.use(express.static(__dirname + '/rosy.day'))

app.get('/', (req, res) => {
	res.send('Hello, world!!!')
})

app.listen(80, () => {
	console.log(`Example app listening on port 80`)
})
