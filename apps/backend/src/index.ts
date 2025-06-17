import express from 'express'
import http from 'http'
import { setupWebSocketServer } from './websocket/connection'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const server = http.createServer(app)

setupWebSocketServer(server)

app.get('/', (_req, res) => {
  res.send('PollGen Backend is running.')
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
