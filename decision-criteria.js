/**
 * Базовый класс для критериев принятия решений
 * Реализует паттерн Шаблонный метод
 */
class DecisionCriterion {
    /**
     * Конструктор базового класса
     * @param {string} name - название критерия
     * @param {string} description - описание критерия
     */
    constructor(name, description) {
        if (new.target === DecisionCriterion) {
            throw new Error('Cannot instantiate abstract class DecisionCriterion');
        }
        this.name = name;
        this.description = description;
    }

    /**
     * Абстрактный метод расчета критерия
     * @param {DecisionMatrix} matrix - матрица решений
     * @param {object} params - дополнительные параметры
     * @returns {object} - результат расчета
     */
    calculate(matrix, params = {}) {
        throw new Error('Method calculate() must be implemented by subclass');
    }

    /**
     * Форматирование результата для отображения
     * @param {object} result - результат расчета
     * @returns {object} - отформатированный результат
     */
    formatResult(result) {
        return {
            name: this.name,
            description: this.description,
            ...result
        };
    }
}

/**
 * Критерий Вальда (максимин)
 */
class WaldCriterion extends DecisionCriterion {
    constructor() {
        super(
            'Критерий Вальда (максимин)',
            'Критерий крайнего пессимизма, ориентированный на наихудшие условия. Гарантирует, что в наихудших условиях потери будут минимальны.'
        );
    }

    calculate(matrix) {
        const values = [];
        const calculations = [];
        
        for (let i = 0; i < matrix.strategiesCount; i++) {
            const minValue = matrix.getRowMin(i);
            values.push(minValue);
            calculations.push({
                strategy: matrix.strategies[i],
                minValue,
                formula: `min(${matrix.data[i].join(', ')}) = ${minValue}`
            });
        }
        
        const maxValue = Math.max(...values);
        const strategyIndex = values.indexOf(maxValue);
        
        return this.formatResult({
            values,
            calculations,
            optimalIndex: strategyIndex,
            optimalValue: maxValue,
            strategy: matrix.strategies[strategyIndex] || 'Не определено',
            type: 'wald'
        });
    }
}

/**
 * Критерий Максимакс
 */
class MaximaxCriterion extends DecisionCriterion {
    constructor() {
        super(
            'Критерий Максимакс',
            'Критерий крайнего оптимизма, ориентированный на наилучшие условия. Ориентирован на максимально возможный выигрыш.'
        );
    }

    calculate(matrix) {
        const values = [];
        const calculations = [];
        
        for (let i = 0; i < matrix.strategiesCount; i++) {
            const maxValue = matrix.getRowMax(i);
            values.push(maxValue);
            calculations.push({
                strategy: matrix.strategies[i],
                maxValue,
                formula: `max(${matrix.data[i].join(', ')}) = ${maxValue}`
            });
        }
        
        const maxValue = Math.max(...values);
        const strategyIndex = values.indexOf(maxValue);
        
        return this.formatResult({
            values,
            calculations,
            optimalIndex: strategyIndex,
            optimalValue: maxValue,
            strategy: matrix.strategies[strategyIndex] || 'Не определено',
            type: 'maximax'
        });
    }
}

/**
 * Критерий Сэвиджа (минимаксного риска)
 */
class SavageCriterion extends DecisionCriterion {
    constructor() {
        super(
            'Критерий Сэвиджа (минимаксного риска)',
            'Критерий минимизации максимальных потерь (сожалений). Компромиссный подход между оптимизмом и пессимизмом.'
        );
    }

    calculate(matrix) {
        const calculations = [];
        
        // Находим максимумы по столбцам
        const maxByState = [];
        for (let j = 0; j < matrix.statesCount; j++) {
            maxByState.push(matrix.getColumnMax(j));
        }
        
        calculations.push({
            step: 'Максимумы по столбцам',
            values: maxByState,
            formula: maxByState.map((max, idx) => `max(столбец ${idx + 1}) = ${max}`).join(', ')
        });

        // Строим матрицу рисков и находим максимальные риски по строкам
        const riskValues = [];
        for (let i = 0; i < matrix.strategiesCount; i++) {
            let maxRisk = -Infinity;
            const risks = [];
            
            for (let j = 0; j < matrix.statesCount; j++) {
                const risk = maxByState[j] - matrix.data[i][j];
                risks.push(risk);
                if (risk > maxRisk) maxRisk = risk;
            }
            
            riskValues.push(maxRisk);
            calculations.push({
                strategy: matrix.strategies[i],
                risks,
                maxRisk,
                formula: `max(${risks.join(', ')}) = ${maxRisk}`
            });
        }

        const minRisk = Math.min(...riskValues);
        const strategyIndex = riskValues.indexOf(minRisk);
        
        return this.formatResult({
            values: riskValues,
            calculations,
            optimalIndex: strategyIndex,
            optimalValue: minRisk,
            strategy: matrix.strategies[strategyIndex] || 'Не определено',
            type: 'savage'
        });
    }
}

/**
 * Критерий Гурвица
 */
class HurwitzCriterion extends DecisionCriterion {
    constructor(alpha = 0.5) {
        super(
            `Критерий Гурвица (α=${alpha})`,
            'Компромиссный критерий, учитывающий как оптимистичный, так и пессимистичный подходы. Позволяет регулировать степень оптимизма ЛПР.'
        );
        this.alpha = alpha;
    }

    calculate(matrix) {
        const values = [];
        const calculations = [];
        
        for (let i = 0; i < matrix.strategiesCount; i++) {
            const minVal = matrix.getRowMin(i);
            const maxVal = matrix.getRowMax(i);
            const hurwitzValue = this.alpha * maxVal + (1 - this.alpha) * minVal;
            
            values.push(hurwitzValue);
            calculations.push({
                strategy: matrix.strategies[i],
                minValue: minVal,
                maxValue: maxVal,
                hurwitzValue,
                formula: `${this.alpha} × ${maxVal} + ${(1 - this.alpha).toFixed(1)} × ${minVal} = ${hurwitzValue}`
            });
        }
        
        const maxValue = Math.max(...values);
        const strategyIndex = values.indexOf(maxValue);
        
        return this.formatResult({
            values,
            calculations,
            optimalIndex: strategyIndex,
            optimalValue: maxValue,
            strategy: matrix.strategies[strategyIndex] || 'Не определено',
            type: 'hurwitz'
        });
    }
}

/**
 * Критерий Байеса (максимум математического ожидания)
 */
class BayesCriterion extends DecisionCriterion {
    constructor(probabilities) {
        super(
            'Критерий Байеса (максимум математического ожидания)',
            'Критерий для условий риска, максимизирующий ожидаемый выигрыш. Обеспечивает максимальный средний выигрыш при многократном повторении ситуации.'
        );
        this.probabilities = probabilities;
    }

    calculate(matrix) {
        const values = [];
        const calculations = [];
        
        for (let i = 0; i < matrix.strategiesCount; i++) {
            let expected = 0;
            const terms = [];
            
            for (let j = 0; j < matrix.statesCount; j++) {
                const term = matrix.data[i][j] * this.probabilities[j];
                expected += term;
                terms.push(`${matrix.data[i][j]} × ${this.probabilities[j].toFixed(3)}`);
            }
            
            values.push(expected);
            calculations.push({
                strategy: matrix.strategies[i],
                expectedValue: expected,
                formula: `${terms.join(' + ')} = ${expected.toFixed(2)}`
            });
        }
        
        const maxValue = Math.max(...values);
        const strategyIndex = values.indexOf(maxValue);
        
        return this.formatResult({
            values,
            calculations,
            optimalIndex: strategyIndex,
            optimalValue: maxValue,
            strategy: matrix.strategies[strategyIndex] || 'Не определено',
            type: 'bayes'
        });
    }
}

/**
 * Критерий Лапласа (равновозможных событий)
 */
class LaplaceCriterion extends DecisionCriterion {
    constructor() {
        super(
            'Критерий Лапласа (равновозможных событий)',
            'Частный случай критерия Байеса при равных вероятностях всех состояний. Используется при полном отсутствии информации о вероятностях.'
        );
    }

    calculate(matrix) {
        const laplaceProb = 1 / matrix.statesCount;
        const values = [];
        const calculations = [];
        
        for (let i = 0; i < matrix.strategiesCount; i++) {
            let expected = 0;
            const terms = [];
            
            for (let j = 0; j < matrix.statesCount; j++) {
                const term = matrix.data[i][j] * laplaceProb;
                expected += term;
                terms.push(`${matrix.data[i][j]} × ${laplaceProb.toFixed(3)}`);
            }
            
            values.push(expected);
            calculations.push({
                strategy: matrix.strategies[i],
                expectedValue: expected,
                formula: `${terms.join(' + ')} = ${expected.toFixed(2)}`
            });
        }
        
        const maxValue = Math.max(...values);
        const strategyIndex = values.indexOf(maxValue);
        
        return this.formatResult({
            values,
            calculations,
            optimalIndex: strategyIndex,
            optimalValue: maxValue,
            strategy: matrix.strategies[strategyIndex] || 'Не определено',
            type: 'laplace'
        });
    }
}

/**
 * Фабрика для создания критериев
 */
class CriteriaFactory {
    /**
     * Создание критерия по типу
     * @param {string} type - тип критерия
     * @param {object} params - параметры критерия
     * @returns {DecisionCriterion} - экземпляр критерия
     */
    static createCriterion(type, params = {}) {
        switch(type.toLowerCase()) {
            case 'wald':
                return new WaldCriterion();
            case 'maximax':
                return new MaximaxCriterion();
            case 'savage':
                return new SavageCriterion();
            case 'hurwitz':
                return new HurwitzCriterion(params.alpha || 0.5);
            case 'bayes':
                if (!params.probabilities) {
                    throw new Error('Probabilities required for Bayes criterion');
                }
                return new BayesCriterion(params.probabilities);
            case 'laplace':
                return new LaplaceCriterion();
            default:
                throw new Error(`Unknown criterion type: ${type}`);
        }
    }

    /**
     * Получение списка доступных критериев
     * @returns {Array} - массив объектов с информацией о критериях
     */
    static getAvailableCriteria() {
        return [
            { type: 'wald', name: 'Критерий Вальда' },
            { type: 'maximax', name: 'Критерий Максимакс' },
            { type: 'savage', name: 'Критерий Сэвиджа' },
            { type: 'hurwitz', name: 'Критерий Гурвица' },
            { type: 'bayes', name: 'Критерий Байеса' },
            { type: 'laplace', name: 'Критерий Лапласа' }
        ];
    }
}