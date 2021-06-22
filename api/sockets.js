module.exports = function (socket, io, db) {
  socket.on('user:id-request', (callback) => callback({
    id: socket.id,
    name: socket.handshake.query.name
  }))

  socket.on('game:new', (data) => {
    const game = db.createGame(data)
    io.to(socket.id).emit('game:new', game)
  })

  socket.on('game:edit', (data) => {
    const room = `game-${data.id}`
    try {
      const game = db.editGame(data)
      io.to(room).emit('game:edit', game)
    } catch (err) {
      console.error(`[sockets.js] error editing game ${data.id}: `, err)
      io.to(socket.id).emit('error', err)
    }
  })

  socket.on('game:join', ({ gameId, user }) => {
    const room = `game-${gameId}`
    socket.join(room, () => {
      try {
        const game = db.addPlayer(gameId, user)
        io.to(room).emit('game:edit', game)
      } catch (err) {
        console.error(`[sockets.js] error joining ${gameId}: `, err)
        io.to(socket.id).emit('error', err)
      }
    })
  })

  socket.on('game:leave', gameId => {
    const room = `game-${gameId}`
    socket.leave(room, () => {
      try {
        const game = db.removePlayer(gameId, socket.id)
        socket.to(room).emit('game:edit', game)
      } catch (err) {
        console.error(`[sockets.js] error leaving ${gameId}: `, err)
        io.to(socket.id).emit('error', { message: err.message, stack: err.stack })
      }
    })
  })

  socket.on('game:shuffle', gameId => {
    const room = `game-${gameId}`
    try {
      const game = db.shuffleGame(gameId)
      io.to(room).emit('game:edit', game)
    } catch (err) {
      console.error(`[sockets.js] error editing game ${gameId}: `, err)
      io.to(socket.id).emit('error', err)
    }
  })

  socket.on('game:draw-black-card', gameId => {
    const room = `game-${gameId}`
    try {
      const game = db.drawBlackCard(gameId)
      io.to(room).emit('game:edit', game)
    } catch (err) {
      console.error(`[sockets.js] error editing game ${gameId}: `, err)
      io.to(socket.id).emit('error', err)
    }
  })

  socket.on('game:draw-white-cards', gameId => {
    const room = `game-${gameId}`
    try {
      const game = db.drawWhiteCards(gameId, socket.id)
      io.to(room).emit('game:edit', game)
    } catch (err) {
      console.error(`[sockets.js] error editing game ${gameId}: `, err)
      io.to(socket.id).emit('error', err)
    }
  })

  socket.on('game:play-white-card', ({ gameId, cardId }) => {
    const room = `game-${gameId}`
    try {
      const game = db.playWhiteCard(gameId, cardId, socket.id)
      io.to(room).emit('game:edit', game)
    } catch (err) {
      console.error(`[sockets.js] error editing game ${gameId}: `, err)
      io.to(socket.id).emit('error', err)
    }
  })

  socket.on('game:reveal-card', ({ gameId, cardId }) => {
    const room = `game-${gameId}`
    try {
      const game = db.revealCard(gameId, cardId)
      io.to(room).emit('game:edit', game)
    } catch (err) {
      console.error(`[sockets.js] error editing game ${gameId}: `, err)
      io.to(socket.id).emit('error', err)
    }
  })

  socket.on('game:set-round-winner', ({ gameId, player, whiteCard, blackCard }) => {
    const room = `game-${gameId}`
    try {
      const game = db.setRoundWinner(gameId, player, whiteCard, blackCard)
      socket.to(room).emit('game:show-round-winner', {
        player: game.players.find(p => p.id === player),
        whiteCard: game.deck.cards.find(c => c.id === whiteCard),
        blackCard: game.deck.cards.find(c => c.id === blackCard)
      })
      io.to(room).emit('game:edit', game)
      io.to(room).emit('alert', { text: 'Comienza una nueva ronda' })
    } catch (err) {
      console.error(`[sockets.js] error editing game ${gameId}: `, err)
      io.to(socket.id).emit('error', err)
    }
  })

  socket.on('disconnect', () => {
    try {
      for (const key in db.games) {
        let game = db.games[key]
        if (game.players.some(p => p.id === socket.id)) {
          game = db.removePlayer(key, socket.id)
          io.to(`game-${key}`).emit('game:edit', game)
        }
      }
    } catch (err) {
      console.error(`[sockets.js] error on disconnect: `, err)
      io.to(socket.id).emit('error', err)
    }
  })
}