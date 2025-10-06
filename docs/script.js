class RaiParadiseApp {
    constructor() {
        this.currentTab = 'wheel';
        this.tickets = 3;
        this.coins = 0;
        this.stats = {
            spins: 0,
            coinsWon: 0,
            friends: 0,
            tasks: 0
        };
        this.warmupProgress = 0;
        this.isSpinning = false;
        
        this.init();
    }

    init() {
        this.loadData();
        this.initWheel();
        this.setupEvents();
        this.updateUI();
        this.initTelegram();
    }

    loadData() {
        const saved = localStorage.getItem('raiParadise');
        if (saved) {
            const data = JSON.parse(saved);
            this.tickets = data.tickets || 3;
            this.coins = data.coins || 0;
            this.stats = data.stats || { spins: 0, coinsWon: 0, friends: 0, tasks: 0 };
            this.warmupProgress = data.warmupProgress || 0;
        }
    }

    saveData() {
        const data = {
            tickets: this.tickets,
            coins: this.coins,
            stats: this.stats,
            warmupProgress: this.warmupProgress
        };
        localStorage.setItem('raiParadise', JSON.stringify(data));
    }

    initWheel() {
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.drawWheel();
    }

    drawWheel() {
        const ctx = this.ctx;
        const center = this.canvas.width / 2;
        const radius = center - 10;
        
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const prizes = [
            { name: "Коины", color: "#FF6B6B", prob: 60 },
            { name: "Поцелуй", color: "#4ECDC4", prob: 20 },
            { name: "Билет", color: "#45B7D1", prob: 10 },
            { name: "Пиво", color: "#FFD166", prob: 5 },
            { name: "Пхукет", color: "#9B5DE5", prob: 5 }
        ];
        
        let startAngle = 0;
        const total = prizes.reduce((sum, p) => sum + p.prob, 0);
        
        prizes.forEach(prize => {
            const angle = (2 * Math.PI * prize.prob) / total;
            const endAngle = startAngle + angle;
            
            // Рисуем сегмент
            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = prize.color;
            ctx.fill();
            
            // Текст
            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(startAngle + angle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(prize.name, radius - 15, 0);
            ctx.restore();
            
            startAngle = endAngle;
        });
        
        // Центральный круг
        ctx.beginPath();
        ctx.arc(center, center, 20, 0, 2 * Math.PI);
        ctx.fillStyle = 'white';
        ctx.fill();
    }

    setupEvents() {
        // Навигация
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // Колесо
        document.getElementById('spinButton').addEventListener('click', () => {
            this.spinWheel();
        });
    }

    switchTab(tab) {
        this.currentTab = tab;
        
        // Обновляем кнопки навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
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
        const prizes = [
            { type: 'coins', prob: 60 },
            { type: 'kiss', prob: 20 },
            { type: 'ticket', prob: 10 },
            { type: 'beer', prob: 5 },
            { type: 'trip', prob: 5 }
        ];
        
        let sum = 0;
        let prize = null;
        
        for (const p of prizes) {
            sum += p.prob;
            if (random <= sum) {
                prize = p;
                break;
            }
        }
        
        this.animateSpin(prize.type);
    }

    animateSpin(prizeType) {
        const wheel = document.getElementById('wheelCanvas');
        const duration = 3000;
        const startTime = Date.now();
        const startRot = 0;
        const extraRotations = 5;
        const targetRot = extraRotations * 360 + Math.random() * 360;
        
        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            
            // Эффект easeOut
            const ease = 1 - Math.pow(1 - progress, 3);
            const rotation = startRot + (targetRot - startRot) * ease;
            
            wheel.style.transform = `rotate(${rotation}deg)`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isSpinning = false;
                this.processPrize(prizeType);
                this.updateUI();
            }
        };
        
        animate();
    }

    processPrize(prizeType) {
        let message = '';
        let title = '🎉 Поздравляем!';
        
        switch(prizeType) {
            case 'coins':
                const coins = Math.floor(Math.random() * 41) + 10;
                this.coins += coins;
                this.stats.coinsWon += coins;
                message = `Вы выиграли ${coins} рай коинов!`;
                break;
            case 'ticket':
                this.tickets++;
                message = 'Вы выиграли дополнительный спин-билет!';
                break;
            case 'kiss':
                message = 'Вы выиграли поцелуй от Рай райского!';
                break;
            case 'beer':
                message = 'Вы выиграли бутыль пива!';
                break;
            case 'trip':
                message = 'Вы выиграли поездку на Пхукет!';
                break;
        }
        
        this.saveData();
        this.showModal(title, message);
    }

    completeTask(taskType) {
        this.tickets += 3;
        this.coins += 50;
        this.stats.tasks++;
        this.updateUI();
        this.saveData();
        this.showModal('✅ Задание выполнено!', '+3 билета и +50 рай коинов');
    }

    startWarmup() {
        this.warmupProgress = 100;
        this.tickets += 10;
        this.coins += 1000;
        this.stats.tasks++;
        this.updateUI();
        this.saveData();
        this.showModal('🔥 Прогрев завершен!', '+10 спин-билетов и +1000 рай коинов');
    }

    buyTicket(event, cost) {
        if (this.coins >= cost) {
            this.coins -= cost;
            this.updateUI();
            this.saveData();
            this.showModal('🎫 Успех!', 'Билет куплен! Жди розыгрыша 20 ноября');
        } else {
            this.showModal('❌ Недостаточно', 'Не хватает рай коинов для покупки билета');
        }
    }

    shareReferral() {
        this.tickets += 3;
        this.coins += 50;
        this.stats.friends++;
        this.stats.tasks++;
        this.updateUI();
        this.saveData();
        
        const link = 'https://t.me/your_bot';
        const message = `Присоединяйся к Rai Paradise! 🎰

🎫 Крути колесо и выигрывай призы
🪙 Зарабатывай рай коины
🎁 Участвуй в розыгрышах
🔥 Знакомься с уникальной атмосферой

${link}`;

        if (navigator.share) {
            navigator.share({
                title: 'Rai Paradise',
                text: message,
                url: link
            });
        } else {
            navigator.clipboard.writeText(message);
            this.showModal('📋 Ссылка скопирована', 'Поделись с друзьями и получай бонусы!');
        }
    }

    showModal(title, text) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalText').textContent = text;
        document.getElementById('modal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('modal').style.display = 'none';
    }

    updateUI() {
        // Баланс
        document.getElementById('ticketCount').textContent = this.tickets;
        document.getElementById('coinBalance').textContent = this.coins.toLocaleString();
        
        // Статистика
        document.getElementById('totalSpins').textContent = this.stats.spins;
        document.getElementById('totalCoins').textContent = this.stats.coinsWon.toLocaleString();
        document.getElementById('friendsCount').textContent = this.stats.friends;
        document.getElementById('tasksCount').textContent = this.stats.tasks;
        
        // Прогресс
        document.getElementById('warmupProgress').textContent = this.warmupProgress + '%';
        document.getElementById('progressFill').style.width = this.warmupProgress + '%';
        
        // Кнопка спина
        document.getElementById('spinButton').disabled = this.tickets <= 0 || this.isSpinning;
    }

    initTelegram() {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
        }
    }
}

// Запуск приложения
const app = new RaiParadiseApp();

// Закрытие модалки по клику на бэкдроп
document.querySelector('.modal-backdrop').addEventListener('click', () => {
    app.closeModal();
});
