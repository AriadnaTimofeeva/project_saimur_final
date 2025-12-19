/**
 * Основной класс приложения для анализа решений
 * Координирует работу всех компонентов системы
 */
class DecisionAnalysisApp {
    /**
     * Конструктор приложения
     */
    constructor() {
        this.currentStep = 1;
        this.selectedCondition = '';
        this.probabilities = [];
        this.alpha = 0.5;
        
        // Инициализация компонентов
        this.matrix = new DecisionMatrix();
        this.uiManager = new UIManager();
        this.resultsAnalyzer = new ResultsAnalyzer();
        
        // Инициализация приложения
        this.initialize();
    }

    /**
     * Инициализация приложения
     */
    initialize() {
        // Добавление CSS анимаций
        this.uiManager.addCSSAnimations();
        
        // Инициализация DOM элементов
        document.addEventListener('DOMContentLoaded', () => {
            this.createMatrix();
            this.uiManager.updateStepIndicator(this.currentStep);
            this.bindEvents();
            this.setupGlobalEventListeners();
        });
    }

    /**
     * Привязка обработчиков событий
     */
    bindEvents() {
        // Обработчик для обновления матрицы при изменении размеров
        document.getElementById('strategies').addEventListener('change', () => this.createMatrix());
        document.getElementById('states').addEventListener('change', () => this.createMatrix());
        
        // Обработчик для параметра оптимизма Гурвица
        document.getElementById('alpha').addEventListener('input', (e) => {
            document.getElementById('alpha-value').textContent = e.target.value;
            this.alpha = parseFloat(e.target.value);
        });
        
        // Обработчик для обновления матрицы при вводе данных
        document.addEventListener('input', (e) => {
            if (e.target.closest('#matrix-table input')) {
                const input = e.target;
                const row = parseInt(input.dataset.row);
                const col = parseInt(input.dataset.col);
                if (!isNaN(row) && !isNaN(col)) {
                    this.updateMatrixValue(row, col, input.value);
                }
            }
            
            // Обновление визуализации вероятностей
            if (e.target.closest('#prob-container input')) {
                this.updateProbabilities();
                this.uiManager.updateProbabilityVisualization();
            }
        });
    }

    /**
     * Настройка глобальных обработчиков событий
     */
    setupGlobalEventListeners() {
        // Глобальный обработчик для иконок информации (делегирование событий)
        document.addEventListener('click', (e) => {
            // Проверяем, кликнули ли на иконку информации или на иконку FontAwesome внутри нее
            let infoIcon = null;
            
            if (e.target.classList.contains('info-icon')) {
                infoIcon = e.target;
            } else if (e.target.classList.contains('fa-info-circle') && 
                      e.target.parentElement.classList.contains('info-icon')) {
                infoIcon = e.target.parentElement;
            }
            
            if (infoIcon) {
                const criterionKey = infoIcon.getAttribute('data-criterion');
                if (criterionKey) {
                    this.showCriteriaInfo(criterionKey);
                }
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        // Также добавляем обработчик для динамически созданных элементов
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // ELEMENT_NODE
                            const infoIcons = node.querySelectorAll ? 
                                node.querySelectorAll('.info-icon:not([data-event-bound])') : [];
                            
                            infoIcons.forEach(icon => {
                                icon.setAttribute('data-event-bound', 'true');
                                icon.style.cursor = 'pointer';
                                icon.title = 'Нажмите для информации о методе расчета';
                                
                                icon.addEventListener('click', (e) => {
                                    const criterionKey = icon.getAttribute('data-criterion');
                                    if (criterionKey) {
                                        this.showCriteriaInfo(criterionKey);
                                    }
                                    e.preventDefault();
                                    e.stopPropagation();
                                });
                            });
                        }
                    });
                }
            });
        });
        
        // Начинаем наблюдение за изменениями в контейнере результатов
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer) {
            observer.observe(resultsContainer, { 
                childList: true, 
                subtree: true 
            });
        }
    }

    /**
     * Создание матрицы ввода
     */
    createMatrix() {
        const strategiesCount = parseInt(document.getElementById('strategies').value);
        const statesCount = parseInt(document.getElementById('states').value);
        
        this.matrix.updateDimensions(strategiesCount, statesCount);
        
        // Создание стратегий и состояний как в оригинальном script.js
        const strategies = [];
        const states = [];
        
        // Генерация названий стратегий и состояний как в script.js
        for (let i = 0; i < strategiesCount; i++) {
            strategies.push(`Регион ${String.fromCharCode(65 + i)}`);
        }
        
        for (let j = 0; j < statesCount; j++) {
            states.push(`Показатель ${j + 1}`);
        }
        
        // Создание таблицы как в script.js
        let html = '<thead><tr><th>Стратегии / Состояния</th>';
        
        // Заголовки состояний
        for (let j = 0; j < statesCount; j++) {
            html += `<th>${states[j]}</th>`;
        }
        html += '</tr></thead><tbody>';
        
        // Строки стратегий
        for (let i = 0; i < strategiesCount; i++) {
            html += `<tr><td><strong>${strategies[i]}</strong></td>`;
            
            for (let j = 0; j < statesCount; j++) {
                const value = this.matrix.data[i] && this.matrix.data[i][j] !== undefined 
                    ? this.matrix.data[i][j] 
                    : '';
                html += `<td><input type="number" value="${value}" 
                           data-row="${i}" data-col="${j}"
                           placeholder="0"></td>`;
            }
            html += '</tr>';
        }
        html += '</tbody>';
        
        document.getElementById('matrix-table').innerHTML = html;
        
        // Инициализация матрицы данных если нужно
        if (this.matrix.data.length !== strategiesCount) {
            this.matrix.data = new Array(strategiesCount);
            for (let i = 0; i < strategiesCount; i++) {
                this.matrix.data[i] = new Array(statesCount).fill(0);
            }
        }
    }

    /**
     * Обновление значения в матрице
     * @param {number} i - индекс строки
     * @param {number} j - индекс столбца
     * @param {string} value - новое значение
     */
    updateMatrixValue(i, j, value) {
        this.matrix.updateValue(i, j, value);
    }

    /**
     * Загрузка демонстрационных данных
     */
    loadExampleData() {
        try {
            // Устанавливаем размеры как в оригинальном script.js
            document.getElementById('strategies').value = 4;
            document.getElementById('states').value = 4;
            
            // Создаем матрицу с новыми размерами
            this.createMatrix();
            
            /*const exampleData = [
                [713, 839, 1007, 1133], 
                [857, 8060, 974, 1100],  
                [1049, 998, 930, 1056],  
                [1193, 1142, 1074, 1023], 
            ];*/
            const exampleData = [
                [320, 780, 640, 500],
                [900, 400, 300, 700],
                [600, 950, 200, 450],
                [500, 550, 850, 300]
                ];
            
            
            // Обновление матрицы данными
            for (let i = 0; i < exampleData.length; i++) {
                for (let j = 0; j < exampleData[i].length; j++) {
                    this.matrix.data[i][j] = exampleData[i][j];
                }
            }
            
            // Обновление названий стратегий 
            const regionNames = ['Регион1', 'Регион2', 'Регион3','Регион4'];
            
            // Обновление названий состояний 
            const indicatorNames = ['Индикатор1', 'Индикатор2', 'Индикатор3', 'Индикатор4'];
            
            // Обновление отображения таблицы с новыми названиями
            setTimeout(() => {
                const table = document.getElementById('matrix-table');
                
                // Обновляем заголовки столбцов
                const headerCells = table.querySelectorAll('thead th');
                headerCells[0].textContent = 'Стратегии / Состояния';
                for (let j = 1; j < headerCells.length; j++) {
                    if (indicatorNames[j-1]) {
                        headerCells[j].textContent = indicatorNames[j-1];
                    }
                }
                
                // Обновляем названия стратегий
                const strategyCells = table.querySelectorAll('tbody td:first-child strong');
                strategyCells.forEach((cell, index) => {
                    if (regionNames[index]) {
                        cell.textContent = regionNames[index];
                    }
                });
                
                // Заполняем значениями
                const inputs = table.querySelectorAll('input');
                inputs.forEach((input, index) => {
                    const row = Math.floor(index / exampleData[0].length);
                    const col = index % exampleData[0].length;
                    
                    if (exampleData[row] && exampleData[row][col] !== undefined) {
                        input.value = exampleData[row][col];
                    }
                });
            }, 100);
            
            this.uiManager.showError('Демонстрационные данные загружены успешно!', 'success');
            
        } catch (error) {
            this.uiManager.showError(`Ошибка загрузки демонстрационных данных: ${error.message}`, 'error');
            console.error('Error loading example data:', error);
        }
    }

    /**
     * Выбор условий принятия решений
     * @param {string} condition - тип условий (uncertainty/risk)
     * @param {Event} event - событие клика
     */
    selectCondition(condition, event) {
        this.selectedCondition = condition;
        
        // Сброс предыдущего выбора
        document.querySelectorAll('.condition-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Выделение выбранной карточки
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('selected');
        }
        
        // Показать/скрыть соответствующие элементы
        const hurwitzParam = document.getElementById('hurwitz-param');
        const probInputs = document.getElementById('probability-inputs');
        
        if (condition === 'uncertainty') {
            hurwitzParam.style.display = 'block';
            probInputs.style.display = 'none';
        } else if (condition === 'risk') {
            hurwitzParam.style.display = 'none';
            probInputs.style.display = 'block';
            this.createProbabilityInputs();
        }
        
        this.uiManager.showError(`Выбраны условия: ${condition === 'uncertainty' ? 'Полная неопределенность' : 'Условия риска'}`, 'info');
    }

    /**
     * Создание полей для ввода вероятностей
     */
    createProbabilityInputs() {
        document.getElementById('prob-container').innerHTML = 
            this.uiManager.createProbabilityInputs(this.matrix, this.probabilities);
        this.updateProbabilities();
    }

    /**
     * Обновление вероятностей состояний природы
     */
    updateProbabilities() {
        this.probabilities = [];
        let sum = 0;
        
        for (let j = 0; j < this.matrix.statesCount; j++) {
            const probInput = document.getElementById(`prob-${j}`);
            const value = parseFloat(probInput?.value) || 0;
            this.probabilities.push(value);
            sum += value;
        }
        
        this.uiManager.updateProbabilitySum(sum);
    }

    /**
     * Переход между шагами анализа
     * @param {number} step - номер шага (1, 2, 3)
     */
    goToStep(step) {
        // Валидация перед переходом на шаг 2
        if (step === 2 && !this.matrix.validate()) {
            this.uiManager.showError('Пожалуйста, заполните все значения матрицы корректными числами', 'error');
            return;
        }
        
        // Валидация перед переходом на шаг 3
        if (step === 3) {
            if (!this.selectedCondition) {
                this.uiManager.showError('Пожалуйста, выберите условия принятия решений', 'error');
                return;
            }
            
            if (this.selectedCondition === 'risk') {
                this.updateProbabilities();
                const sum = this.probabilities.reduce((a, b) => a + b, 0);
                if (Math.abs(sum - 1) > 0.01) {
                    this.uiManager.showError('Сумма вероятностей должна равняться 1. Текущая сумма: ' + sum.toFixed(3), 'error');
                    return;
                }
            }
            
            this.alpha = parseFloat(document.getElementById('alpha').value);
            this.calculateResults();
        }
        
        // Анимация перехода между шагами
        const currentStepElement = document.getElementById(`step${this.currentStep}`);
        if (currentStepElement) {
            currentStepElement.classList.add('fade-out');
            
            setTimeout(() => {
                // Скрыть текущий шаг
                document.querySelectorAll('.step').forEach(s => {
                    s.classList.remove('active');
                    s.classList.remove('fade-out');
                });
                
                // Показать выбранный шаг
                const stepElement = document.getElementById(`step${step}`);
                if (stepElement) {
                    stepElement.classList.add('active');
                    this.currentStep = step;
                    this.uiManager.updateStepIndicator(this.currentStep);
                    
                    // Прокрутка к верху шага
                    stepElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
        }
    }

    /**
     * Расчет результатов по всем критериям
     */
    calculateResults() {
        try {
            this.resultsAnalyzer.clear();
            this.resultsAnalyzer.setAnalysisType(this.selectedCondition);
            
            // Создание названий стратегий как в script.js
            const strategiesCount = this.matrix.strategiesCount;
            const strategies = [];
            for (let i = 0; i < strategiesCount; i++) {
                strategies.push(`Регион ${String.fromCharCode(65 + i)}`);
            }
            
            if (this.selectedCondition === 'uncertainty') {
                this.calculateUncertaintyResults(strategies);
            } else {
                this.calculateRiskResults(strategies);
            }
            
            this.displayResults();
            
        } catch (error) {
            this.uiManager.showError(`Ошибка расчета: ${error.message}`, 'error');
            console.error('Calculation error:', error);
        }
    }

    /**
     * Расчет результатов для условий неопределенности
     * @param {Array} strategies - названия стратегий
     */
    calculateUncertaintyResults(strategies) {
        const criteriaConfig = [
            { type: 'wald', params: {} },
            { type: 'maximax', params: {} },
            { type: 'savage', params: {} },
            { type: 'hurwitz', params: { alpha: this.alpha } }
        ];

        criteriaConfig.forEach(config => {
            try {
                const criterion = CriteriaFactory.createCriterion(config.type, config.params);
                const result = criterion.calculate(this.matrix);
                
                // Используем стратегию из результата или получаем по индексу
                let strategyName = result.strategy;
                if (typeof result.strategyIndex === 'number' && strategies[result.strategyIndex]) {
                    strategyName = strategies[result.strategyIndex];
                }
                
                this.resultsAnalyzer.addRecommendation(
                    result.name,
                    strategyName,
                    config.type,
                    result
                );
                
            } catch (error) {
                console.error(`Error calculating ${config.type}:`, error);
                this.resultsAnalyzer.addRecommendation(
                    CriteriaInfo[config.type]?.name || config.type,
                    'Не определено',
                    config.type,
                    { error: error.message }
                );
            }
        });
    }

    /**
     * Расчет результатов для условий риска
     * @param {Array} strategies - названия стратегий
     */
    calculateRiskResults(strategies) {
        // Нормализация вероятностей
        const sumProb = this.probabilities.reduce((a, b) => a + b, 0);
        const normProbs = this.probabilities.map(p => p / sumProb);

        const criteriaConfig = [
            { 
                type: 'bayes', 
                params: { probabilities: normProbs } 
            },
            { 
                type: 'laplace', 
                params: {} 
            }
        ];

        criteriaConfig.forEach(config => {
            try {
                const criterion = CriteriaFactory.createCriterion(config.type, config.params);
                const result = criterion.calculate(this.matrix);
                
                // Используем стратегию из результата или получаем по индексу
                let strategyName = result.strategy;
                if (typeof result.strategyIndex === 'number' && strategies[result.strategyIndex]) {
                    strategyName = strategies[result.strategyIndex];
                }
                
                this.resultsAnalyzer.addRecommendation(
                    result.name,
                    strategyName,
                    config.type,
                    result
                );
                
            } catch (error) {
                console.error(`Error calculating ${config.type}:`, error);
                this.resultsAnalyzer.addRecommendation(
                    CriteriaInfo[config.type]?.name || config.type,
                    'Не определено',
                    config.type,
                    { error: error.message }
                );
            }
        });
    }

    /**
     * Отображение результатов анализа
     */
    displayResults() {
        const recommendations = this.resultsAnalyzer.getAllRecommendations();
        const frequency = this.resultsAnalyzer.getFrequencyAnalysis();
        const final = this.resultsAnalyzer.getFinalRecommendation();
        
        this.uiManager.showResults(recommendations, frequency, final, this.selectedCondition);
        
        // Привязываем обработчики для иконок информации (на всякий случай)
        setTimeout(() => {
            this.bindInfoIconEvents();
        }, 100);
        
        // Показ статистики в консоли для отладки
        console.log('Analysis Results:', {
            matrix: this.matrix.getMatrixData(),
            recommendations,
            frequency,
            final,
            analysisType: this.selectedCondition
        });
    }

    /**
     * Привязка обработчиков событий к иконкам информации
     */
    bindInfoIconEvents() {
        document.querySelectorAll('.info-icon:not([data-bound])').forEach(icon => {
            icon.setAttribute('data-bound', 'true');
            icon.style.cursor = 'pointer';
            icon.title = 'Нажмите для информации о методе расчета';
            
            icon.addEventListener('click', (e) => {
                const criterionKey = icon.getAttribute('data-criterion');
                if (criterionKey) {
                    this.showCriteriaInfo(criterionKey);
                }
                e.preventDefault();
                e.stopPropagation();
            });
        });
    }

    /**
     * Показать информацию о критерии
     * @param {string} criterionKey - ключ критерия
     */
    showCriteriaInfo(criterionKey) {
        console.log('Showing criteria info for:', criterionKey); // Для отладки
        
        const info = CriteriaInfoService.getCriterionInfo(criterionKey);
        if (!info) {
            this.uiManager.showError('Информация о критерии не найдена', 'warning');
            return;
        }
        
        const description = CriteriaInfoService.getFormattedDescription(criterionKey);
        this.uiManager.showModal(info.name, description);
    }

    /**
     * Сброс анализа и возврат к началу
     */
    resetAnalysis() {
        // Подтверждение сброса
        if (!confirm('Вы уверены, что хотите начать новый анализ? Все текущие данные будут потеряны.')) {
            return;
        }
        
        // Сброс состояния
        this.currentStep = 1;
        this.selectedCondition = '';
        this.probabilities = [];
        this.alpha = 0.5;
        
        // Сброс компонентов
        this.matrix = new DecisionMatrix();
        this.resultsAnalyzer.clear();
        
        // Сброс UI элементов
        document.getElementById('strategies').value = 4;
        document.getElementById('states').value = 5;
        document.getElementById('alpha').value = 0.5;
        document.getElementById('alpha-value').textContent = '0.5';
        
        this.createMatrix();
        
        document.querySelectorAll('.condition-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        document.getElementById('hurwitz-param').style.display = 'none';
        document.getElementById('probability-inputs').style.display = 'none';
        
        this.goToStep(1);
        
        this.uiManager.showError('Анализ сброшен. Можно начать новый расчет.', 'info');
    }

    /**
     * Экспорт результатов в файл
     */
    exportResults() {
        try {
            const data = {
                matrix: this.matrix.getMatrixData(),
                analysis: {
                    type: this.selectedCondition,
                    alpha: this.selectedCondition === 'uncertainty' ? this.alpha : null,
                    probabilities: this.selectedCondition === 'risk' ? this.probabilities : null
                },
                results: JSON.parse(this.resultsAnalyzer.exportToJSON()),
                timestamp: new Date().toISOString(),
                version: '2.0.0'
            };
            
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `decision-analysis-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.uiManager.showError('Результаты успешно экспортированы в JSON файл', 'success');
            
        } catch (error) {
            this.uiManager.showError(`Ошибка экспорта: ${error.message}`, 'error');
        }
    }

    /**
     * Получение текущего состояния приложения
     * @returns {object} - состояние приложения
     */
    getState() {
        return {
            currentStep: this.currentStep,
            selectedCondition: this.selectedCondition,
            alpha: this.alpha,
            probabilities: [...this.probabilities],
            matrix: this.matrix.getMatrixData(),
            results: this.resultsAnalyzer.getStatistics()
        };
    }
}

// Инициализация приложения при загрузке страницы
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new DecisionAnalysisApp();
    
    // Добавление кнопки экспорта в интерфейс
    const exportButton = document.createElement('button');
    exportButton.className = 'btn btn-secondary';
    exportButton.style.marginLeft = '10px';
    exportButton.innerHTML = '<i class="fas fa-download"></i> Экспорт';
    exportButton.onclick = () => app.exportResults();
    
    const step3Nav = document.querySelector('#step3 .navigation');
    if (step3Nav) {
        step3Nav.appendChild(exportButton);
    }
    
    // Глобальный обработчик для иконок информации (дополнительная защита)
    document.addEventListener('click', function(e) {
        // Проверяем, кликнули ли на иконку информации
        if (e.target.classList.contains('info-icon')) {
            const criterionKey = e.target.getAttribute('data-criterion');
            if (criterionKey && app) {
                app.showCriteriaInfo(criterionKey);
            }
            e.preventDefault();
            return;
        }
        
        // Проверяем, кликнули ли на иконку FontAwesome внутри .info-icon
        if (e.target.classList.contains('fa-info-circle')) {
            const parentIcon = e.target.closest('.info-icon');
            if (parentIcon) {
                const criterionKey = parentIcon.getAttribute('data-criterion');
                if (criterionKey && app) {
                    app.showCriteriaInfo(criterionKey);
                }
                e.preventDefault();
            }
        }
    });
    
    // Глобальный экспорт для отладки
    window.app = app;
    window.DecisionMatrix = DecisionMatrix;
    window.CriteriaFactory = CriteriaFactory;
    window.CriteriaInfoService = CriteriaInfoService;
    
    console.log('Decision Analysis App initialized successfully');
    console.log('Available commands:');
    console.log('- app.getState() - получить текущее состояние');
    console.log('- app.exportResults() - экспортировать результаты');
    console.log('- CriteriaFactory.getAvailableCriteria() - список критериев');
});