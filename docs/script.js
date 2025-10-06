document.getElementById('spin').addEventListener('click', function() {
    const prizes = ['10-50 коинов', 'Поцелуй', 'Билет', 'Пиво', 'Пхукет'];
    const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
    document.getElementById('result').textContent = `Вы выиграли: ${randomPrize}!`;
});
