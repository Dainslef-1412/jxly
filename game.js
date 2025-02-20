// 定义扑克牌
class Card {
    constructor(suit, value) {
        this.suit = suit;    // 花色
        this.value = value;  // 点数
    }
}

// 游戏类
class Game {
    constructor() {
        this.deck = [];
        this.players = [[], [], []];
        this.landlordCards = [];
        this.currentPlayer = 0;
        this.lastPlayedCards = [];    // 上一次打出的牌
        this.lastPlayer = null;       // 上一个出牌的玩家
        this.landlord = null;         // 地主玩家
        this.selectedCards = [];      // 当前选中的牌
        this.initializeDeck();
    }

    // 初始化牌组
    initializeDeck() {
        const suits = ['♠', '♥', '♣', '♦'];
        const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
        
        // 生成普通牌
        for (let suit of suits) {
            for (let value of values) {
                this.deck.push(new Card(suit, value));
            }
        }
        
        // 添加大小王
        this.deck.push(new Card('', '小王'));
        this.deck.push(new Card('', '大王'));
    }

    // 洗牌
    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    // 发牌
    dealCards() {
        this.shuffle();
        // 每人17张牌
        for (let i = 0; i < 51; i++) {
            this.players[i % 3].push(this.deck[i]);
        }
        // 剩余3张为地主牌
        this.landlordCards = this.deck.slice(51);
    }

    // 开始游戏
    start() {
        this.dealCards();
        this.displayCards();
    }

    // 获取牌的权重值
    getCardValue(card) {
        const valueMap = {
            '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15, '小王': 16, '大王': 17
        };
        return valueMap[card.value];
    }

    // 判断牌型
    getCardPattern(cards) {
        if (!cards.length) return null;
        
        const values = cards.map(card => this.getCardValue(card)).sort((a, b) => a - b);
        
        if (cards.length === 1) return { type: 'single', value: values[0] };
        if (cards.length === 2 && values[0] === values[1]) return { type: 'pair', value: values[0] };
        if (cards.length === 4 && values[0] === values[3]) return { type: 'bomb', value: values[0] };
        
        // 判断顺子
        if (cards.length >= 5) {
            let isSequence = true;
            for (let i = 1; i < values.length; i++) {
                if (values[i] !== values[i-1] + 1) {
                    isSequence = false;
                    break;
                }
            }
            if (isSequence) return { type: 'sequence', value: values[0], length: values.length };
        }
        
        return null;
    }

    // 判断是否可以出牌
    canPlayCards(cards) {
        if (!cards.length) return false;
        
        const pattern = this.getCardPattern(cards);
        if (!pattern) return false;
        
        // 如果没有上一手牌，可以任意出牌
        if (!this.lastPlayedCards.length) return true;
        
        const lastPattern = this.getCardPattern(this.lastPlayedCards);
        
        // 炸弹可以打任何牌
        if (pattern.type === 'bomb') {
            if (lastPattern.type === 'bomb') {
                return pattern.value > lastPattern.value;
            }
            return true;
        }
        
        // 其他情况需要牌型相同且大小更大
        if (pattern.type === lastPattern.type) {
            if (pattern.type === 'sequence') {
                return pattern.length === lastPattern.length && pattern.value > lastPattern.value;
            }
            return pattern.value > lastPattern.value;
        }
        
        return false;
    }

    // 出牌
    playCards(cards) {
        if (!this.canPlayCards(cards)) return false;
        
        // 从玩家手中移除打出的牌
        cards.forEach(card => {
            const index = this.players[this.currentPlayer].findIndex(c => 
                c.suit === card.suit && c.value === card.value);
            if (index !== -1) {
                this.players[this.currentPlayer].splice(index, 1);
            }
        });
        
        this.lastPlayedCards = cards;
        this.lastPlayer = this.currentPlayer;
        this.currentPlayer = (this.currentPlayer + 1) % 3;
        
        // 更新显示
        this.displayCards();
        this.displayPlayedCards();
        
        // 检查是否获胜
        if (this.players[this.lastPlayer].length === 0) {
            this.gameOver(this.lastPlayer);
        }
        
        return true;
    }

    // 显示打出的牌
    displayPlayedCards() {
        const playedCardsArea = document.querySelector('.played-cards');
        playedCardsArea.innerHTML = '';
        this.lastPlayedCards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.textContent = card.suit + card.value;
            playedCardsArea.appendChild(cardElement);
        });
    }

    // 游戏结束
    gameOver(winner) {
        alert(`玩家 ${winner + 1} 获胜！`);
        // 可以在这里添加重新开始游戏的逻辑
    }

    // 修改现有的 displayCards 方法，添加点击事件
    displayCards() {
        for (let i = 0; i < 3; i++) {
            const playerArea = document.querySelector(`#player${i + 1} .cards`);
            playerArea.innerHTML = '';
            this.players[i].forEach(card => {
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                cardElement.textContent = card.suit + card.value;
                
                // 只有当前玩家的牌可以点击
                if (i === this.currentPlayer) {
                    cardElement.addEventListener('click', () => this.selectCard(card));
                }
                
                playerArea.appendChild(cardElement);
            });
        }
    }

    // 选择牌
    selectCard(card) {
        const index = this.selectedCards.findIndex(c => 
            c.suit === card.suit && c.value === card.value);
            
        if (index === -1) {
            this.selectedCards.push(card);
        } else {
            this.selectedCards.splice(index, 1);
        }
    }
}

// 初始化游戏
document.getElementById('start-game').addEventListener('click', () => {
    const game = new Game();
    game.start();
});