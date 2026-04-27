/* jshint esversion: 6 */

const TASK12_MAX_VERTICES = 20;

document.addEventListener('DOMContentLoaded', () => {
    const inputBlockContent = document.querySelector('.input-block .block-content');
    const outputPre = document.querySelector('.output-pre');
    const startButton = document.getElementById('startButton');
    const graphContainer = document.querySelector('.graph-container');

    if (!inputBlockContent || !outputPre || !startButton || !graphContainer) {
        console.error('Не найдены нужные элементы страницы для task_12.js');
        return;
    }

    buildInputUI(inputBlockContent);
    buildGraphArea(graphContainer);

    startButton.addEventListener('click', () => {
        try {
            const verticesCount = parseVerticesCount(
                document.getElementById('verticesCountInput').value
            );

            const rawEdgesText = document.getElementById('edgeListInput').value;
            const adjacency = parseGraphFromEdgeList(rawEdgesText, verticesCount);

            const coloringResult = greedyColoring(adjacency, verticesCount);

            outputPre.textContent = formatColoringResult(coloringResult);
            renderTask12Graph(adjacency, coloringResult);
        } catch (error) {
            outputPre.textContent = `Ошибка:\n${error.message}`;
            renderGraphError('cy', error.message);
        }
    });
});

function buildInputUI(container) {
    container.innerHTML = `
        <div class="task12-input-wrapper">
            <div style="margin-bottom:12px;">
                <label for="verticesCountInput" style="display:block; margin-bottom:8px; font-weight:600;">
                    Введите число вершин
                </label>
                <input
                    id="verticesCountInput"
                    type="text"
                    inputmode="numeric"
                    autocomplete="off"
                    placeholder="Например: 5"
                    style="width:100%; padding:12px; box-sizing:border-box;"
                    value="5"
                >
            </div>

            <label for="edgeListInput" style="display:block; margin-bottom:10px; font-weight:600;">
                Введите граф списком рёбер
            </label>

            <textarea
                id="edgeListInput"
                rows="12"
                style="width:100%; resize:vertical; padding:12px; box-sizing:border-box; font-family:monospace;"
                placeholder="Пример:
1 2
1 3
2 3
3 4
4 5"
            >1 2
1 3
2 3
3 4
4 5</textarea>

            <div style="margin-top:12px; line-height:1.6;">
                <p style="margin:0 0 8px 0;"><b>Формат ввода:</b></p>
                <p style="margin:0;">Каждая строка содержит одно ребро:</p>
                <p style="margin:6px 0 0 0; font-family:monospace;">вершина1 вершина2</p>
                <p style="margin:8px 0 0 0;">Например:</p>
                <pre style="margin:6px 0 0 0; padding:10px; background:#f6f6f6; overflow:auto;">1 2
1 3
2 3
3 4
4 5</pre>
                <p style="margin:8px 0 0 0;">
                    Допустимое число вершин: от 1 до ${TASK12_MAX_VERTICES}.
                </p>
            </div>
        </div>
    `;
}

function buildGraphArea(container) {
    container.innerHTML = '<div id="cy" class="cy-graph-area"></div>';
}

function parseVerticesCount(rawValue) {
    const value = String(rawValue).trim();

    if (value.length === 0) {
        throw new Error('Введите число вершин.');
    }

    if (!/^\d+$/.test(value)) {
        throw new Error('Число вершин должно быть целым положительным числом.');
    }

    const verticesCount = Number(value);

    if (!Number.isSafeInteger(verticesCount) || verticesCount < 1) {
        throw new Error('Число вершин должно быть положительным.');
    }

    if (verticesCount > TASK12_MAX_VERTICES) {
        throw new Error(
            `Число вершин (${verticesCount}) превышает допустимый максимум (${TASK12_MAX_VERTICES}).`
        );
    }

    return verticesCount;
}

function parseGraphFromEdgeList(rawText, verticesCount) {
    const adjacency = Array.from({ length: verticesCount + 1 }, () => new Set());

    const trimmed = String(rawText).trim();

    if (trimmed.length === 0) {
        return adjacency;
    }

    const lines = trimmed
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(/\s+/);

        if (parts.length !== 2) {
            throw new Error(
                `Неверный формат строки ${i + 1}: "${line}". Ожидается формат "u v".`
            );
        }

        const u = Number(parts[0]);
        const v = Number(parts[1]);

        if (!Number.isInteger(u) || !Number.isInteger(v) || u < 1 || v < 1) {
            throw new Error(
                `В строке ${i + 1} вершины должны быть целыми положительными числами.`
            );
        }

        if (u > verticesCount || v > verticesCount) {
            throw new Error(
                `В строке ${i + 1} указана вершина вне диапазона от 1 до ${verticesCount}.`
            );
        }

        if (u === v) {
            throw new Error(`Обнаружена петля в строке ${i + 1}: ${u} ${v}.`);
        }

        adjacency[u].add(v);
        adjacency[v].add(u);
    }

    return adjacency;
}

function greedyColoring(adjacency, verticesCount) {
    const colors = Array(verticesCount + 1).fill(-1);
    const steps = [];

    if (verticesCount >= 1) {
        colors[1] = 1;
        steps.push({ vertex: 1, color: 1 });
    }

    for (let v = 2; v <= verticesCount; v++) {
        const used = Array(verticesCount + 1).fill(false);

        for (const neighbor of adjacency[v]) {
            if (colors[neighbor] !== -1) {
                used[colors[neighbor]] = true;
            }
        }

        let color = 1;
        while (color <= verticesCount && used[color]) {
            color++;
        }

        colors[v] = color;
        steps.push({ vertex: v, color: color });
    }

    const maxColor = Math.max(...colors.slice(1));

    return {
        colors,
        steps,
        totalColors: maxColor
    };
}

function formatColoringResult(coloringResult) {
    const lines = [];

    lines.push('Результат раскраски:');
    for (let i = 1; i < coloringResult.colors.length; i++) {
        lines.push(`Вершина ${i} -> Цвет ${coloringResult.colors[i]}`);
    }

    lines.push('');
    lines.push(`Всего использовано цветов: ${coloringResult.totalColors}`);

    return lines.join('\n');
}

function buildCytoscapeElements(adjacency) {
    const elements = [];
    const addedEdges = new Set();

    for (let v = 1; v < adjacency.length; v++) {
        elements.push({
            data: {
                id: String(v),
                label: String(v)
            }
        });
    }

    for (let v = 1; v < adjacency.length; v++) {
        for (const u of adjacency[v]) {
            const a = Math.min(v, u);
            const b = Math.max(v, u);
            const edgeId = `${a}-${b}`;

            if (!addedEdges.has(edgeId)) {
                addedEdges.add(edgeId);
                elements.push({
                    data: {
                        id: edgeId,
                        source: String(a),
                        target: String(b)
                    }
                });
            }
        }
    }

    return elements;
}

function getTask12Style() {
    const style = getDefaultCytoscapeStyle().slice();

    style.push({
        selector: 'node',
        style: {
            'label': 'data(label)',
            'text-wrap': 'none',
            'background-color': '#E36D6D',
            'border-color': '#c45a5a',
            'border-width': 3
        }
    });

    return style;
}

function renderTask12Graph(adjacency, coloringResult) {
    const elements = buildCytoscapeElements(adjacency);

    const cy = renderGraphInContainer('cy', elements, {
        style: getTask12Style()
    });

    if (!cy) {
        return;
    }

    animateColoring(cy, coloringResult.steps);
}

function animateColoring(cy, steps) {
    const palette = getColorPalette();
    const delay = 800;

    cy.nodes().forEach(node => {
        node.style({
            'background-color': '#E36D6D',
            'border-color': '#c45a5a',
            'border-width': 3,
            'color': '#ffffff'
        });
    });

    steps.forEach((step, index) => {
        setTimeout(() => {
            const node = cy.getElementById(String(step.vertex));
            if (!node) {
                return;
            }

            const fillColor = palette[(step.color - 1) % palette.length];
            const borderColor = darkenColor(fillColor);

            node.style({
                'background-color': fillColor,
                'border-color': borderColor,
                'border-width': 5,
                'label': `${step.vertex}`,
                'color': '#ffffff'
            });
        }, index * delay);
    });
}

function getColorPalette() {
    return [
        '#E36D6D', '#6DA7E3', '#6DCB8B', '#E3C56D', '#B06DE3',
        '#E38F6D', '#5EC7C7', '#D96DB4', '#8BC34A', '#FF8A65',
        '#6D8FE3', '#E3A16D', '#6DE3D6', '#C76DE3', '#E36DA7',
        '#AEE36D', '#6DE3A1', '#E3D66D', '#D6A4E3', '#6DE3C7'
    ];
}

function darkenColor(hex) {
    const rgb = hexToRgb(hex);
    const factor = 0.78;

    const r = Math.max(0, Math.floor(rgb.r * factor));
    const g = Math.max(0, Math.floor(rgb.g * factor));
    const b = Math.max(0, Math.floor(rgb.b * factor));

    return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
    const normalized = hex.replace('#', '');

    return {
        r: parseInt(normalized.substring(0, 2), 16),
        g: parseInt(normalized.substring(2, 4), 16),
        b: parseInt(normalized.substring(4, 6), 16)
    };
}
