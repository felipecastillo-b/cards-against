// code from here: https://javascript.info/task/shuffle
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
    let t = array[i];
    array[i] = array[j];
    array[j] = t;
  }
}

function createID() {
  return Math.random()
    .toString(36)
    .toUpperCase()
    .replace(/[^A-Z]+/g, '')
    .substr(0, 4);
}

class Game {
  constructor({ deck, rotation, winCondition }) {
    const id = createID()
    const data = {
      id,
      rotation,
      winCondition,
      deck,
      players: [],
      shuffled: false,
      finished: false,
      cardsPerHand: 5,
      maxWins: null,
      maxRounds: null,
      round: {
        reader: firstPlayerId,
        cards: {
          black: null,
          white: {}
        }
      }
    }
    Object.assign(this, data)
    return this
  }

  edit(data) {
    Object.assign(this, data)
    return this
  }

  addPlayer(player) {
    this.players.push({
      id: player.id,
      name: player.name,
      cards: [],
      wins: []
    })
    this.round.cards.white[player.id] = null
    return this
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId)
    delete this.round.cards.white[playerId]
    if (this.players.length && this.round.reader === playerId) {
      this.round.reader = this.players[0].id
    }
    return this
  }

  shuffle() {
    shuffle(this.deck.cards)
    this.shuffled = true
    return this
  }

  drawBlackCard() {
    const card = this.deck.cards.find(c => c.type === 'black' && !c.used)
    if (!card) {
      return this.gameOver()
    }
    card.used = true
    this.round.cards.black = card
    return this
  }

  drawWhiteCards(playerId) {
    const availableCards = this.deck.cards.filter(c => c.type === 'white' && !c.used)
    if (availableCards.length < this.cardsPerHand) {
      this.recoverWhiteCards()
    }

    const player = this.players.find(p => p.id === playerId)
    const numCards = this.cardsPerHand - player.cards.length
    const cards = this.deck.cards.filter(c => c.type === 'white' && !c.used)
      .slice(0, numCards)
      .map(c => {
        c.used = true
        return c
      })
    player.cards = player.cards.concat(cards)
    return this
  }

  recoverWhiteCards() {
    const whiteCardsInUse = Object.values(this.round.cards.white).map(c => c.id)
    for (const card of this.deck.cards) {
      if (card.type === 'white' && card.used && whiteCardsInUse.indexOf(card.id) === -1) {
        card.used = false
      }
    }
    shuffle(this.deck.cards)
  }

  playWhiteCard(cardId, playerId) {
    const player = this.players.find(p => p.id === playerId)
    player.cards = player.cards.filter(c => c.id !== cardId)
    const card = this.deck.cards.find(c => c.id === cardId)
    card.hidden = true
    this.round.cards.white[player.id] = card
    return this
  }

  revealCard(playerId) {
    const card = this.round.cards.white[playerId]
    if (!card) {
      return null
    }
    card.hidden = false
    return this
  }

  setRoundWinner(playerId, whiteCardId, blackCardId) {
    const player = this.players.find(p => p.id === playerId)
    const cards = {
      white: this.deck.cards.find(c => c.id === whiteCardId),
      black: this.deck.cards.find(c => c.id === blackCardId)
    }
    player.wins.push(cards)
    if (this.maxWins && player.wins.length >= this.maxWins) {
      return this.gameOver()
    }
    if (this.maxRounds) {
      const numRounds = this.deck.cards.filter(c => c.type === 'black' && c.used)
      if (numRounds >= this.maxRounds) {
        return this.gameOver()
      }
    }
    this.createNewRound(playerId)
    return this
  }

  createNewRound(lastWinnerId) {
    this.rotateReader(lastWinnerId)
    this.drawBlackCard()
    for (const player of this.players) {
      this.drawWhiteCards(player.id)
    }
  }

  rotateReader(lastWinnerId) {
    if (this.rotation === 'winner') {
      this.round.reader = lastWinnerId
    }
    if (this.rotation === 'next-in-list') {
      this.players.forEach((p, i) => {
        if (p.id === lastWinnerId) {
          let nextIndex = i + 1
          if (nextIndex >= this.players.length) {
            nextIndex = 0
          }
          const nextPlayer = this.players[nextIndex]
          this.round.reader = nextPlayer.id
        }
      })
    }
  }

  gameOver() {
    this.finished = true
    return this
  }
}

module.exports = Game
