<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Спасибо за заявку | ООО «АМНИС»</title>
    <meta name="description" content="Ваша заявка принята. Наш специалист свяжется с вами в ближайшее время.">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%232c5aa0'/><text x='50' y='70' font-size='60' text-anchor='middle' fill='white' font-family='Arial'>А</text></svg>" type="image/svg+xml">
    <link rel="stylesheet" href="styles.css">
    <style>
        .thank-you-section {
            min-height: 80vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 60px 20px;
            background: var(--gradient-primary);
        }
        .thank-you-container {
            background: white;
            border-radius: 20px;
            padding: 60px 40px;
            max-width: 600px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }
        .thank-you-icon {
            font-size: 80px;
            margin-bottom: 30px;
            animation: scaleIn 0.5s ease-out;
        }
        @keyframes scaleIn {
            from {
                transform: scale(0);
                opacity: 0;
            }
            to {
                transform: scale(1);
                opacity: 1;
            }
        }
        .thank-you-title {
            font-size: 36px;
            color: var(--primary-color);
            margin-bottom: 20px;
            font-weight: bold;
        }
        .thank-you-message {
            font-size: 18px;
            color: var(--text-light);
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .thank-you-details {
            background: var(--bg-light);
            border-radius: 10px;
            padding: 25px;
            margin: 30px 0;
            text-align: left;
        }
        .thank-you-details h3 {
            color: var(--primary-color);
            margin-bottom: 15px;
            font-size: 20px;
        }
        .thank-you-details ul {
            list-style: none;
            padding: 0;
        }
        .thank-you-details li {
            padding: 10px 0;
            padding-left: 30px;
            position: relative;
            color: var(--text-color);
        }
        .thank-you-details li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: var(--success-color);
            font-weight: bold;
            font-size: 20px;
        }
        .thank-you-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 30px;
        }
        .thank-you-button {
            padding: 15px 30px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            transition: all 0.3s;
            display: inline-block;
        }
        .thank-you-button.primary {
            background: var(--gradient-primary);
            color: white;
        }
        .thank-you-button.primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(44, 90, 160, 0.3);
        }
        .thank-you-button.secondary {
            background: var(--bg-light);
            color: var(--primary-color);
            border: 2px solid var(--primary-color);
        }
        .thank-you-button.secondary:hover {
            background: var(--primary-color);
            color: white;
        }
        @media (max-width: 768px) {
            .thank-you-container {
                padding: 40px 20px;
            }
            .thank-you-title {
                font-size: 28px;
            }
            .thank-you-message {
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <!-- Top Bar -->
    <div class="top-bar">
        <div class="container">
            <div class="top-bar-content">
                <div class="top-bar-left">
                    <span class="company-name">ООО «АМНИС»</span>
                    <span class="top-bar-text">Геодезические услуги и лазерное сканирование с 2019 года</span>
                </div>
                <div class="top-bar-right">
                    <div class="contact-info">
                        <a href="tel:+79216253441" class="phone">+7 (921) 625–34–41</a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Header -->
    <header>
        <nav class="navbar">
            <div class="container">
                <a href="/" class="logo">
                    <img src="LOGO AMNIS.png" alt="ООО «АМНИС»">
                </a>
                <ul class="nav-menu">
                    <li><a href="/" class="nav-link">Главная</a></li>
                    <li><a href="/#services" class="nav-link">Услуги</a></li>
                    <li><a href="/#about" class="nav-link">О компании</a></li>
                    <li><a href="/#contacts" class="nav-link">Контакты</a></li>
                </ul>
            </div>
        </nav>
    </header>

    <!-- Thank You Section -->
    <section class="thank-you-section">
        <div class="container">
            <div class="thank-you-container">
                <div class="thank-you-icon">✅</div>
                <h1 class="thank-you-title">Спасибо за вашу заявку!</h1>
                <p class="thank-you-message">
                    Ваша заявка успешно отправлена. Наш специалист свяжется с вами в ближайшее время для уточнения деталей и расчета стоимости работ.
                </p>
                
                <div class="thank-you-details">
                    <h3>Что дальше?</h3>
                    <ul>
                        <li>Мы обработаем вашу заявку в течение 30 минут</li>
                        <li>Подготовим расчет стоимости работ</li>
                        <li>Свяжемся с вами по указанному телефону или email</li>
                        <li>Ответим на все ваши вопросы</li>
                    </ul>
                </div>

                <div class="thank-you-actions">
                    <a href="/" class="thank-you-button primary">Вернуться на главную</a>
                    <a href="/#services" class="thank-you-button secondary">Посмотреть услуги</a>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>ООО «АМНИС»</h3>
                    <p>Геодезические услуги и лазерное сканирование с 2019 года</p>
                </div>
                <div class="footer-section">
                    <h3>Контакты</h3>
                    <p>Телефон: <a href="tel:+79216253441">+7 (921) 625–34–41</a></p>
                    <p>Адрес: г. Санкт-Петербург, Митрофаньевское ш., д. 27 лит. А</p>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 ООО «АМНИС». Все права защищены.</p>
            </div>
        </div>
    </footer>
</body>
</html>



