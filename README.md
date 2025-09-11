# Simulador de Rede de Filas G/G/c/K

**Aluno:** Luca Mandelli

## Descrição

Este projeto implementa um simulador completo de sistemas de filas que suporta:

### Modo Individual
- Simulação de uma única fila G/G/c/K
- G/G: Chegadas e atendimentos seguem distribuição uniforme
- c: Número de servidores (configurável)
- K: Capacidade total do sistema (configurável)

### Modo Rede de Filas
- Simulação de múltiplas filas conectadas (rede em tandem)
- Roteamento configurável entre filas
- Suporte a diferentes topologias de rede
- Cada fila com características próprias (servidores, capacidade, tempos)

O simulador utiliza o Método Congruente Linear para geração de números pseudoaleatórios e implementa simulação orientada a eventos discretos.

## Como executar

Para executar o simulador, use o comando:

```bash
node simulador_filas_gg.js
```

## Configuração de parâmetros

### Seleção do modo de simulação

No início do arquivo `simulador_filas_gg.js`, altere a variável:

```javascript
let modoSimulacao = "rede";   // "individual" ou "rede"
```

### Configuração para Fila Individual

Para simular uma única fila, configure `configFilaIndividual`:

```javascript
let configFilaIndividual = {
  numServidores: 1,           // Número de servidores
  capacidade: 5,              // Capacidade da fila
  minChegada: 2.0,           // Tempo mínimo entre chegadas
  maxChegada: 5.0,           // Tempo máximo entre chegadas
  minAtendimento: 3.0,       // Tempo mínimo de atendimento
  maxAtendimento: 5.0        // Tempo máximo de atendimento
};
```

### Configuração para Rede de Filas

Para simular rede de filas, configure `configRede`:

```javascript
let configRede = {
  primeiraChegada: 1.5,      // Tempo da primeira chegada
  
  filas: [
    {
      id: 1,
      nome: "Fila 1",
      numServidores: 2,
      capacidade: 3,
      minChegada: 1.0,        // null = não recebe chegadas externas
      maxChegada: 4.0,
      minAtendimento: 3.0,
      maxAtendimento: 4.0
    },
    {
      id: 2,
      nome: "Fila 2",
      numServidores: 1,
      capacidade: 5,
      minChegada: null,       // Só recebe clientes de outras filas
      maxChegada: null,
      minAtendimento: 2.0,
      maxAtendimento: 3.0
    }
  ],
  
  // Roteamento: probabilidades de destino após sair de cada fila
  roteamento: {
    1: { 2: 1.0 },                    // 100% da Fila 1 vai para Fila 2
    2: { "saida": 1.0 }               // 100% da Fila 2 sai do sistema
  }
};
```

### Exemplos de roteamento:

**Filas em tandem (série):**
```javascript
roteamento: {
  1: { 2: 1.0 },              // Fila 1 → Fila 2 (100%)
  2: { "saida": 1.0 }         // Fila 2 → Saída (100%)
}
```

**Roteamento probabilístico:**
```javascript
roteamento: {
  1: { 2: 0.7, 3: 0.3 },      // Fila 1 → Fila 2 (70%), Fila 3 (30%)
  2: { "saida": 1.0 },        // Fila 2 → Saída (100%)
  3: { "saida": 1.0 }         // Fila 3 → Saída (100%)
}
```

## Resultados

### Para Fila Individual:
- Tempo total de simulação
- Distribuição de probabilidades dos estados da fila
- Número médio de clientes no sistema
- Probabilidade de bloqueio
- Utilização do sistema
- Contagem de clientes perdidos (rejeitados)

### Para Rede de Filas:
- Tempo total de simulação da rede
- Estatísticas detalhadas para cada fila:
  - Distribuição de probabilidades dos estados
  - Número médio de clientes na fila
  - Probabilidade de bloqueio da fila
  - Utilização da fila
  - Contagem de clientes perdidos por fila
- Rastreamento de fluxo entre filas

## Características técnicas

- Gerador de números pseudoaleatórios: Método Congruente Linear
- Parâmetros do gerador: a=1664525, c=1013904223, M=2^32, seed=12345
- Controle exato de 100.000 números pseudoaleatórios utilizados
- Primeira chegada sempre no tempo 2.0
- Sistema inicialmente vazio

## Estrutura do código

O código é organizado com:
- Configuração de parâmetros no início do arquivo
- Gerador de números pseudoaleatórios (Método Congruente Linear)
- Estruturas para eventos e escalonamento
- Procedimentos separados para fila individual e rede
- Funções de inicialização para cada modo
- Sistema de roteamento flexível
- Estatísticas detalhadas por fila
- Função principal com loop de simulação
- Relatórios separados para cada modo de operação

## Flexibilidade do simulador

O simulador suporta:
- **Fila única**: G/G/c/K tradicional
- **Rede em tandem**: Filas conectadas em série
- **Roteamento probabilístico**: Clientes podem seguir diferentes caminhos
- **Configuração flexível**: Cada fila com características próprias
- **Chegadas mistas**: Filas com chegadas externas ou apenas internas