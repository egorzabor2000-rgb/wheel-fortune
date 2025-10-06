class SimpleApp {
    constructor() {
        this.currentTab = 'wheel';
        this.tickets = 3;
        this.coins = 0;
        this.stats = {
            spins: 0,
            coinsWon: 0,
            friends: 0
        };
        this.init();
    }

    init() {
        this.loadData();
        this.initWheel();
        this.setupEvents();
        this.updateUI();
    }

    loadData() {
        const saved = localStorage.getItem('raiApp');
        if (saved) {
            const data = JSON.parse(saved);
            this.tickets = data.tickets || 3;
            this.coins = data.coins || 0;
            this.stats = data.stats || { spins: 0, coinsWon: 0, friends: 0 };
        }
    }

    saveData() {
        const data = {
            tickets: this.tickets,
            coins: this.coins,
            stats: this.stats
        };
        localStorage.setItem('raiApp', JSON.stringify(data));
    }

    initWheel() {
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isSpinning = false;
        
        this.prizes = [
            { name: "Коины", prob: 60, color: "#FF6B6B", type: "coins" },
            { name: "Поцелуй", prob: 20, color: "#4ECDC4", type: "kiss" },
            { name: "Билет", prob: 10, color: "#45B7D1", type: "ticket" },
            { name: "Пиво", prob: 5, color: "#FFD166", type: "beer" },
            { name: "Пхукет", prob: 5, color: "#9B5DE5", type: "trip" }
        ];
        
        this.drawWheel();
    }

    drawWheel() {
        const ctx = this.ctx;
        const center = this.canvas.width / 2;
        const radius = center - 10;
        
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        let startAngle = 0;
        const total = this.prizes.reduce((sum, p) => sum + p.prob, 0);
        
        this.prizes.forEach(prize => {
            const angle = (2 * Math.PI * prize.prob) / total;
            const endAngle = startAngle + angle;
            
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = prize.color;
            ctx.fill();
            
            startAngle = endAngle;
        });
    }

    setupEvents() {
        // Вкладки
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Колесо
        document.getElementById('spinButton').addEventListener('click', () => {
            this.spinWheel();
        });

        // Реферальные кнопки
        document.getElementById('shareButton').addEventListener('click', () => {
            this.share();
        });

        document.getElementById('copyButton').addEventListener('click', () => {
            this.copy();
        });
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Обновляем активные кнопки
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Показываем активную вкладку
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tab + '-tab');
        });
    }

    spinWheel() {
        if (this.isSpinning || this.tickets <= 0) return;
        
        this.isSpinning = true;
        this.tickets--;
        this.stats.spins++;
        
        this.updateUI();
        
        // Выбор приза
        const random = Math.random() * 100;
        let sum = 0;
        let prize = null;
        
        for (const p of this.prizes) {
            sum += p.prob;
            if (random <= sum) {
                prize = p;
                break;
            }
        }
        
        this.animateSpin(prize);
    }

    animateSpin(prize) {
        const duration = 3000;
        const startTime = Date.now();
        const startRot = 0;
        const extra = 5;
        const targetRot = extra * 360 + Math.random() * 360;
        
        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const rotation = startRot + (targetRot - startRot) * ease;
            
            this.canvas.style.transform = `rotate(${rotation}deg)`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isSpinning = false;
                this.processPrize(prize);
            }
        };
        
        animate();
    }

    processPrize(prize) {
        let message = '';
        
        switch(prize.type) {
            case 'coins':
                const coinAmount = Math.floor(Math.random() * 41) + 10;
                this.coins += coinAmount;
                this.stats.coinsWon += coinAmount;
                message = `Выиграно ${coinAmount} коинов!`;
                break;
            case 'ticket':
                this.tickets++;
                message = 'Выиграли дополнительный билет!';
                break;
            case 'kiss':
                message = 'Выиграли поцелуй от Рай райского!';
                break;
            case 'beer':
                message = 'Выиграли бутыль пива!';
                break;
            case 'trip':
                message = 'Выиграли поездку на Пхукет!';
                break;
        }
        
        this.saveData();
        this.updateUI();
        this.showModal(message);
    }

    completeTask(task) {
        this.tickets += 3;
        this.coins += 50;
        this.updateUI();
        this.saveData();
        this.showModal('Задание выполнено! +3 билета, +50 коинов');
    }

    buyTicket(event, cost) {
        if (this.coins >= cost) {
            this.coins -= cost;
            this.updateUI();
            this.saveData();
            this.showModal('Билет куплен!');
        } else {
            this.showModal('Недостаточно коинов');
        }
    }

    openWarmup() {
        this.tickets += 10;
        this.coins += 1000;
        this.updateUI();
        this.saveData();
        this.showModal('Прогрев пройден! +10 билетов, +1000 коинов');
    }

    share() {
        const link = 'https://t.me/your_bot';
        if (navigator.share) {
            navigator.share({
                title: 'Rai Paradise',
                text: 'Присоединяйся!',
                url: link
            });
        } else {
            this.showModal('Ссылка скопирована: ' + link);
        }
    }

    copy() {
        const link = 'https://t.me/your_bot';
        navigator.clipboard.writeText(link);
        this.showModal('Ссылка скопирована');
    }

    showModal(text) {
        document.getElementById('modalText').textContent = text;
        document.getElementById('modal').style.display = 'flex';
    }

    closeModal() {
        document.getElementById('modal').style.display = 'none';
    }

    updateUI() {
        document.getElementById('ticketCount').textContent = this.tickets;
        document.getElementById('coinBalance').textContent = this.coins;
        document.getElementById('totalSpins').textContent = this.stats.spins;
        document.getElementById('totalCoins').textContent = this.stats.coinsWon;
        document.getElementById('friendsCount').textContent = this.stats.friends;
        
        document.getElementById('spinButton').disabled = this.tickets <= 0 || this.isSpinning;
    }
}

// Запуск приложения
const app = new SimpleApp();
