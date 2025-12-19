/**
 * Анализатор результатов принятия решений
 * Отвечает за агрегацию и анализ результатов всех критериев
 */
class ResultsAnalyzer {
    constructor() {
        this.recommendations = [];
        this.timestamp = null;
        this.analysisType = '';
    }

    /**
     * Добавление рекомендации от критерия
     * @param {string} criterionName - название критерия
     * @param {string} strategy - рекомендуемая стратегия
     * @param {string} criterionType - тип критерия
     * @param {object} details - дополнительные детали расчета
     */
    addRecommendation(criterionName, strategy, criterionType, details = {}) {
        const recommendation = {
            id: this.recommendations.length + 1,
            criterion: criterionName,
            strategy: strategy || 'Не определено',
            type: criterionType,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.recommendations.push(recommendation);
    }

    /**
     * Получение частотного анализа рекомендаций
     * @returns {object} - объект с частотами стратегий
     */
    getFrequencyAnalysis() {
        const frequency = {};
        
        this.recommendations.forEach(rec => {
            if (rec.strategy && rec.strategy !== 'Не определено') {
                frequency[rec.strategy] = (frequency[rec.strategy] || 0) + 1;
            }
        });
        
        return frequency;
    }

    /**
     * Получение итоговой рекомендации на основе частотного анализа
     * @returns {object} - объект с итоговой рекомендацией
     */
    getFinalRecommendation() {
        const frequency = this.getFrequencyAnalysis();
        const entries = Object.entries(frequency);
        
        if (entries.length === 0) {
            return {
                strategy: null,
                frequency: 0,
                total: this.recommendations.length,
                percentage: 0,
                confidence: 'low'
            };
        }

        // Сортировка по убыванию частоты
        entries.sort((a, b) => b[1] - a[1]);
        
        const [strategy, count] = entries[0];
        const percentage = (count / this.recommendations.length * 100);
        
        // Определение уровня уверенности
        let confidence = 'medium';
        if (percentage >= 70) confidence = 'high';
        if (percentage <= 30) confidence = 'low';
        
        // Проверка на ничью
        const hasTie = entries.length > 1 && entries[1][1] === count;
        
        return {
            strategy,
            frequency: count,
            total: this.recommendations.length,
            percentage: Math.round(percentage),
            confidence,
            hasTie,
            alternatives: hasTie ? entries.filter(([_, freq]) => freq === count).map(([strat]) => strat) : []
        };
    }

    /**
     * Получение статистики анализа
     * @returns {object} - статистическая информация
     */
    getStatistics() {
        const validRecommendations = this.recommendations.filter(
            rec => rec.strategy && rec.strategy !== 'Не определено'
        );
        
        const frequency = this.getFrequencyAnalysis();
        const uniqueStrategies = Object.keys(frequency);
        
        return {
            totalCriteria: this.recommendations.length,
            validRecommendations: validRecommendations.length,
            uniqueStrategies: uniqueStrategies.length,
            mostFrequent: this.getFinalRecommendation(),
            distribution: frequency,
            analysisType: this.analysisType,
            timestamp: this.timestamp || new Date().toISOString()
        };
    }

    /**
     * Установка типа анализа
     * @param {string} type - тип анализа (uncertainty/risk)
     */
    setAnalysisType(type) {
        this.analysisType = type;
        this.timestamp = new Date().toISOString();
    }

    /**
     * Получение всех рекомендаций
     * @returns {Array} - массив рекомендаций
     */
    getAllRecommendations() {
        return [...this.recommendations];
    }

    /**
     * Получение рекомендаций по типу критерия
     * @param {string} criterionType - тип критерия
     * @returns {Array} - отфильтрованные рекомендации
     */
    getRecommendationsByType(criterionType) {
        return this.recommendations.filter(rec => rec.type === criterionType);
    }

    /**
     * Проверка наличия конфликтующих рекомендаций
     * @returns {boolean} - true если есть конфликты
     */
    hasConflicts() {
        const frequency = this.getFrequencyAnalysis();
        const values = Object.values(frequency);
        
        // Если более одной стратегии с максимальной частотой
        const maxFreq = Math.max(...values);
        return values.filter(freq => freq === maxFreq).length > 1;
    }

    /**
     * Очистка всех результатов
     */
    clear() {
        this.recommendations = [];
        this.timestamp = null;
        this.analysisType = '';
    }

    /**
     * Экспорт результатов в JSON
     * @returns {string} - JSON строка с результатами
     */
    exportToJSON() {
        const data = {
            statistics: this.getStatistics(),
            recommendations: this.recommendations,
            timestamp: this.timestamp,
            analysisType: this.analysisType
        };
        
        return JSON.stringify(data, null, 2);
    }
}