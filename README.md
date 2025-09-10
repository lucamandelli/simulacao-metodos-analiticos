# Simulador de Filas G/G/c/K

**Aluno:** Luca Mandelli

## Descrição

Este projeto implementa um simulador de sistemas de filas do tipo G/G/c/K, onde:
- G/G: Chegadas e atendimentos seguem distribuição uniforme
- c: Número de servidores (configurável)
- K: Capacidade total do sistema (configurável)

O simulador utiliza o Método Congruente Linear para geração de números pseudoaleatórios e implementa simulação orientada a eventos discretos.

## Como executar

Para executar o simulador, use o comando:

```bash
node simulador_filas_gg.js
```

## Configuração de parâmetros

Para alterar o tipo de sistema simulado, edite as variáveis no início do arquivo `simulador_filas_gg.js`:

### Configuração básica do sistema:
```javascript
let numServidores = 1;        // Altere aqui: 1 ou 2 servidores
let capacidadeTotal = 5;      // Capacidade total do sistema
let maxNumeros = 100000;      // Números pseudoaleatórios a usar
```

### Exemplos de configuração:

**Para simular G/G/1/5:**
```javascript
let numServidores = 1;
let capacidadeTotal = 5;
```

**Para simular G/G/2/5:**
```javascript
let numServidores = 2;
let capacidadeTotal = 5;
```

### Outros parâmetros configuráveis:

```javascript
// Tempos das distribuições uniformes
let minChegada = 2.0;         // Tempo mínimo entre chegadas
let maxChegada = 5.0;         // Tempo máximo entre chegadas
let minAtendimento = 3.0;     // Tempo mínimo de atendimento
let maxAtendimento = 5.0;     // Tempo máximo de atendimento
```

## Resultados

O simulador produz:
- Tempo total de simulação
- Distribuição de probabilidades dos estados da fila
- Número médio de clientes no sistema
- Probabilidade de bloqueio
- Utilização do sistema
- Contagem de clientes perdidos (rejeitados)

## Características técnicas

- Gerador de números pseudoaleatórios: Método Congruente Linear
- Parâmetros do gerador: a=1664525, c=1013904223, M=2^32, seed=12345
- Controle exato de 100.000 números pseudoaleatórios utilizados
- Primeira chegada sempre no tempo 2.0
- Sistema inicialmente vazio

## Estrutura do código

O código é organizado de forma simples com:
- Configuração de parâmetros no início do arquivo
- Gerador de números pseudoaleatórios
- Funções de criação e manipulação de eventos
- Procedimentos de chegada e saída
- Função principal com loop de simulação
- Cálculo e exibição de resultados