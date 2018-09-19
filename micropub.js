const fetch = require('node-fetch')
const sqlite = require('sqlite')
const express = require('express')
const bodyParser = require('body-parser')

const getDB = require('./data')

const app = express()
app.use(bodyParser.json())

app.get('/', async (req, res) => {
  if (req.query['q'] === 'config') {
    return res.json({
      "media-endpoint": "https://img.koddsson.com/upload"
    })
  }
  return res.status(404).send('Not found')
})

app.post('/', async (req, res) => {
  const response = await fetch('https://tokens.indieauth.com/token', {
    headers: {
      Accept: 'application/json',
      Authorization: req.header('Authorization')
    }
  })
  const json = await response.json()

  if (json.me !== 'https://koddsson.com/') {
    return res.status(401).send('Unauthorized')
  }

  const db = await getDB()

  if (req.body['like-of']) {
    // TODO: Try and get metadata and add to the table.
    const timestamp = Math.floor(new Date() / 1000)
    await db.run(
      "INSERT INTO favorites VALUES (?, DateTime('now'), ?)",
      req.body['like-of'],
      timestamp
    );
    // TODO: Set this header more correctly
    res.header('Location', 'https://koddsson.com/favorites')
    return res.status(201).send('Favorited')
  } else if (req.body['h'] === 'entry') {
    const timestamp = Math.floor(new Date() / 1000)
    await db.run(
      "INSERT INTO notes VALUES (?, ?)",
      timestamp,
      req.body['content']
    );
    // TODO: Set this header more correctly
    res.header('Location', `https://koddsson.com/notes/${timestamp}`)
    return res.status(201).send('Note posted')
  } else if (req.body['type'] && req.body['type'].includes('h-entry')) {
    const timestamp = Math.floor(new Date() / 1000)
    const properties = req.body.properties
    const photo = properties.photo[0]
    const content = properties.content[0]

    await db.run(
      "INSERT INTO photos VALUES (?, ?, ?)",
      timestamp,
      photo.value,
      photo.alt 
    );

    await db.run(
      "INSERT INTO notes VALUES (?, ?)",
      timestamp,
      content
    );
    // TODO: Set this header more correctly
    res.header('Location', `https://koddsson.com/notes/${timestamp}`)
    return res.status(201).send('Note posted')
  }

  return res.status(404).send('Not found')
})

module.exports = app
