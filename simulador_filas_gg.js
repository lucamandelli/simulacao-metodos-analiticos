// Simulador de Rede de Filas G/G/c/K
// Suporta filas individuais e redes de filas em tandem

// =================================================================
// CONFIGURAÇÃO DA REDE DE FILAS - ALTERAR AQUI
// =================================================================

// Modo de operação: 'individual' ou 'rede'
let modoSimulacao = "rede"; // ← ALTERAR AQUI: 'individual' ou 'rede'

// CONFIGURAÇÃO PARA FILA INDIVIDUAL (usado quando modoSimulacao = 'individual')
let configFilaIndividual = {
  numServidores: 1,
  capacidade: 5,
  minChegada: 2.0,
  maxChegada: 5.0,
  minAtendimento: 3.0,
  maxAtendimento: 5.0,
};

// CONFIGURAÇÃO PARA REDE DE FILAS (usado quando modoSimulacao = 'rede')
let configRede = {
  // Primeira chegada na rede
  primeiraChegada: 1.5,

  // Definição das filas na rede
  filas: [
    {
      id: 1,
      nome: "Fila 1",
      numServidores: 2,
      capacidade: 3,
      // Chegadas externas (null = não recebe chegadas de fora)
      minChegada: 1.0,
      maxChegada: 4.0,
      // Atendimento
      minAtendimento: 3.0,
      maxAtendimento: 4.0,
    },
    {
      id: 2,
      nome: "Fila 2",
      numServidores: 1,
      capacidade: 5,
      // Sem chegadas externas - só recebe da Fila 1
      minChegada: null,
      maxChegada: null,
      // Atendimento
      minAtendimento: 2.0,
      maxAtendimento: 3.0,
    },
  ],

  // Roteamento: de qual fila para qual fila (probabilidades)
  roteamento: {
    1: { 2: 1.0 }, // 100% da Fila 1 vai para Fila 2
    2: { saida: 1.0 }, // 100% da Fila 2 sai do sistema
  },
};

// Parâmetros gerais
let maxNumeros = 100000; // Números pseudoaleatórios a usar

// =================================================================
// GERADOR DE NÚMEROS PSEUDOALEATÓRIOS
// =================================================================

let a = 1664525;
let c = 1013904223;
let M = Math.pow(2, 32);
let seed = 12345;
let lastRandom = seed;
let numerosUsados = 0;

function NextRandom() {
  lastRandom = (a * lastRandom + c) % M;
  numerosUsados++;
  return lastRandom / M;
}

function gerarUniforme(min, max) {
  return min + NextRandom() * (max - min);
}

// =================================================================
// VARIÁVEIS DA SIMULAÇÃO
// =================================================================

let tempoSimulacao = 0.0;
let tempoUltimoEvento = 0.0;
let escalonador = [];
let proximoIdCliente = 1;

// Para fila individual
let clientesNoSistema = 0;
let servidoresOcupados = 0;
let temposEstados = [];
let clientesPerdidos = 0;

// Para rede de filas
let estadoFilas = {}; // Estado de cada fila
let estatisticasFilas = {}; // Estatísticas de cada fila

// =================================================================
// ESTRUTURA DE EVENTOS
// =================================================================

function criarEvento(tipo, tempo, clienteId, filaId = null, dados = {}) {
  return {
    tipo: tipo,
    tempo: tempo,
    clienteId: clienteId,
    filaId: filaId,
    dados: dados,
  };
}

function agendarEvento(evento) {
  escalonador.push(evento);
  escalonador.sort((a, b) => a.tempo - b.tempo);
}

function proximoEvento() {
  return escalonador.shift();
}

// =================================================================
// INICIALIZAÇÃO
// =================================================================

function inicializarFilaIndividual() {
  let config = configFilaIndividual;
  clientesNoSistema = 0;
  servidoresOcupados = 0;
  temposEstados = new Array(config.capacidade + 1).fill(0.0);
  clientesPerdidos = 0;
}

function inicializarRede() {
  estadoFilas = {};
  estatisticasFilas = {};

  configRede.filas.forEach((fila) => {
    estadoFilas[fila.id] = {
      clientesNoSistema: 0,
      servidoresOcupados: 0,
      tempoUltimaAtualizacao: 0.0,
    };

    estatisticasFilas[fila.id] = {
      temposEstados: new Array(fila.capacidade + 1).fill(0.0),
      clientesPerdidos: 0,
    };
  });
}

function atualizarEstatisticasFilaIndividual() {
  let deltaT = tempoSimulacao - tempoUltimoEvento;
  temposEstados[clientesNoSistema] += deltaT;
  tempoUltimoEvento = tempoSimulacao;
}

function atualizarEstatisticasFila(filaId) {
  let estado = estadoFilas[filaId];
  let stats = estatisticasFilas[filaId];
  let deltaT = tempoSimulacao - estado.tempoUltimaAtualizacao;

  stats.temposEstados[estado.clientesNoSistema] += deltaT;
  estado.tempoUltimaAtualizacao = tempoSimulacao;
}

// =================================================================
// PROCEDIMENTOS PARA FILA INDIVIDUAL
// =================================================================

function procedimentoChegadaIndividual(evento) {
  let config = configFilaIndividual;

  console.log(
    `Tempo ${tempoSimulacao.toFixed(4)}: Cliente ${evento.clienteId} chegou`
  );

  atualizarEstatisticasFilaIndividual();

  if (clientesNoSistema < config.capacidade) {
    clientesNoSistema++;

    if (servidoresOcupados < config.numServidores) {
      servidoresOcupados++;
      let tempoAtendimento = gerarUniforme(
        config.minAtendimento,
        config.maxAtendimento
      );
      let eventoSaida = criarEvento(
        "SAIDA_INDIVIDUAL",
        tempoSimulacao + tempoAtendimento,
        evento.clienteId
      );
      agendarEvento(eventoSaida);

      console.log(
        `  -> Cliente ${
          evento.clienteId
        } iniciou atendimento, sairá em ${tempoAtendimento.toFixed(4)}`
      );
    } else {
      console.log(
        `  -> Cliente ${evento.clienteId} entrou na fila de espera (${clientesNoSistema} no sistema)`
      );
    }
  } else {
    clientesPerdidos++;
    console.log(`  -> Cliente ${evento.clienteId} rejeitado - sistema cheio!`);
  }

  // Agenda próxima chegada
  if (numerosUsados < maxNumeros) {
    let intervaloChegada = gerarUniforme(config.minChegada, config.maxChegada);
    let proximaChegada = criarEvento(
      "CHEGADA_INDIVIDUAL",
      tempoSimulacao + intervaloChegada,
      proximoIdCliente
    );
    proximoIdCliente++;
    agendarEvento(proximaChegada);
  }
}

function procedimentoSaidaIndividual(evento) {
  console.log(
    `Tempo ${tempoSimulacao.toFixed(4)}: Cliente ${evento.clienteId} saiu`
  );

  atualizarEstatisticasFilaIndividual();
  clientesNoSistema--;

  if (clientesNoSistema >= configFilaIndividual.numServidores) {
    let tempoAtendimento = gerarUniforme(
      configFilaIndividual.minAtendimento,
      configFilaIndividual.maxAtendimento
    );
    let eventoSaida = criarEvento(
      "SAIDA_INDIVIDUAL",
      tempoSimulacao + tempoAtendimento,
      proximoIdCliente - clientesNoSistema
    );
    agendarEvento(eventoSaida);
    console.log(
      `  -> Próximo cliente iniciou atendimento, sairá em ${tempoAtendimento.toFixed(
        4
      )}`
    );
  } else {
    servidoresOcupados--;
  }
}

// =================================================================
// PROCEDIMENTOS PARA REDE DE FILAS
// =================================================================

function encontrarFila(filaId) {
  return configRede.filas.find((f) => f.id === filaId);
}

function determinarProximaFila(filaIdAtual) {
  let roteamento = configRede.roteamento[filaIdAtual];
  if (!roteamento) return "saida";

  let rand = NextRandom();
  let acumulado = 0;

  for (let destino in roteamento) {
    acumulado += roteamento[destino];
    if (rand <= acumulado) {
      return destino === "saida" ? "saida" : parseInt(destino);
    }
  }

  return "saida";
}

function procedimentoChegadaRede(evento) {
  let filaId = evento.filaId;
  let fila = encontrarFila(filaId);
  let estado = estadoFilas[filaId];
  let stats = estatisticasFilas[filaId];

  console.log(
    `Tempo ${tempoSimulacao.toFixed(4)}: Cliente ${
      evento.clienteId
    } chegou na ${fila.nome}`
  );

  atualizarEstatisticasFila(filaId);

  if (estado.clientesNoSistema < fila.capacidade) {
    estado.clientesNoSistema++;

    if (estado.servidoresOcupados < fila.numServidores) {
      estado.servidoresOcupados++;
      let tempoAtendimento = gerarUniforme(
        fila.minAtendimento,
        fila.maxAtendimento
      );
      let eventoSaida = criarEvento(
        "SAIDA_REDE",
        tempoSimulacao + tempoAtendimento,
        evento.clienteId,
        filaId
      );
      agendarEvento(eventoSaida);

      console.log(
        `  -> Cliente ${evento.clienteId} iniciou atendimento na ${
          fila.nome
        }, sairá em ${tempoAtendimento.toFixed(4)}`
      );
    } else {
      console.log(
        `  -> Cliente ${evento.clienteId} entrou na fila de espera da ${fila.nome} (${estado.clientesNoSistema} clientes)`
      );
    }
  } else {
    stats.clientesPerdidos++;
    console.log(
      `  -> Cliente ${evento.clienteId} rejeitado na ${fila.nome} - fila cheia!`
    );
  }

  // Agenda próxima chegada externa (só se a fila recebe chegadas de fora)
  if (fila.minChegada !== null && numerosUsados < maxNumeros) {
    let intervaloChegada = gerarUniforme(fila.minChegada, fila.maxChegada);
    let proximaChegada = criarEvento(
      "CHEGADA_REDE",
      tempoSimulacao + intervaloChegada,
      proximoIdCliente,
      filaId
    );
    proximoIdCliente++;
    agendarEvento(proximaChegada);
  }
}

function procedimentoSaidaRede(evento) {
  let filaId = evento.filaId;
  let fila = encontrarFila(filaId);
  let estado = estadoFilas[filaId];

  console.log(
    `Tempo ${tempoSimulacao.toFixed(4)}: Cliente ${evento.clienteId} saiu da ${
      fila.nome
    }`
  );

  atualizarEstatisticasFila(filaId);
  estado.clientesNoSistema--;

  // Se ainda tem gente na fila, próximo inicia atendimento
  if (estado.clientesNoSistema >= fila.numServidores) {
    let tempoAtendimento = gerarUniforme(
      fila.minAtendimento,
      fila.maxAtendimento
    );
    let proximoClienteId =
      proximoIdCliente - (estado.clientesNoSistema - fila.numServidores + 1);
    let eventoSaida = criarEvento(
      "SAIDA_REDE",
      tempoSimulacao + tempoAtendimento,
      proximoClienteId,
      filaId
    );
    agendarEvento(eventoSaida);
    console.log(
      `  -> Próximo cliente iniciou atendimento na ${
        fila.nome
      }, sairá em ${tempoAtendimento.toFixed(4)}`
    );
  } else {
    estado.servidoresOcupados--;
  }

  // Determina próximo destino do cliente
  let proximoDestino = determinarProximaFila(filaId);

  if (proximoDestino === "saida") {
    console.log(`  -> Cliente ${evento.clienteId} deixou o sistema`);
  } else {
    // Cliente vai para próxima fila
    let eventoChegada = criarEvento(
      "CHEGADA_REDE",
      tempoSimulacao,
      evento.clienteId,
      proximoDestino
    );
    agendarEvento(eventoChegada);
  }
}

// =================================================================
// FUNÇÃO PRINCIPAL
// =================================================================

function main() {
  console.log("=".repeat(70));

  if (modoSimulacao === "individual") {
    console.log(
      `SIMULADOR FILA INDIVIDUAL G/G/${configFilaIndividual.numServidores}/${configFilaIndividual.capacidade}`
    );
    console.log("=".repeat(70));
    console.log(`Configurações:`);
    console.log(`- Servidores: ${configFilaIndividual.numServidores}`);
    console.log(`- Capacidade: ${configFilaIndividual.capacidade} clientes`);
    console.log(
      `- Chegadas: Uniforme[${configFilaIndividual.minChegada}, ${configFilaIndividual.maxChegada}]`
    );
    console.log(
      `- Atendimento: Uniforme[${configFilaIndividual.minAtendimento}, ${configFilaIndividual.maxAtendimento}]`
    );

    inicializarFilaIndividual();

    // Primeira chegada no tempo 2.0
    tempoSimulacao = 2.0;
    agendarEvento(criarEvento("CHEGADA_INDIVIDUAL", 2.0, proximoIdCliente));
    proximoIdCliente++;
  } else {
    console.log(`SIMULADOR REDE DE FILAS - ${configRede.filas.length} FILAS`);
    console.log("=".repeat(70));
    console.log(`Configurações da Rede:`);
    console.log(`- Primeira chegada: ${configRede.primeiraChegada}`);

    configRede.filas.forEach((fila) => {
      console.log(
        `- ${fila.nome}: G/G/${fila.numServidores}/${fila.capacidade}`
      );
      if (fila.minChegada !== null) {
        console.log(
          `  Chegadas: Uniforme[${fila.minChegada}, ${fila.maxChegada}]`
        );
      } else {
        console.log(`  Chegadas: Apenas internas`);
      }
      console.log(
        `  Atendimento: Uniforme[${fila.minAtendimento}, ${fila.maxAtendimento}]`
      );
    });

    console.log(`Roteamento:`);
    for (let origem in configRede.roteamento) {
      let destinos = configRede.roteamento[origem];
      let filaOrigem = encontrarFila(parseInt(origem));
      console.log(`  ${filaOrigem.nome}:`);
      for (let destino in destinos) {
        if (destino === "saida") {
          console.log(
            `    -> Sair do sistema: ${(destinos[destino] * 100).toFixed(1)}%`
          );
        } else {
          let filaDestino = encontrarFila(parseInt(destino));
          console.log(
            `    -> ${filaDestino.nome}: ${(destinos[destino] * 100).toFixed(
              1
            )}%`
          );
        }
      }
    }

    inicializarRede();

    // Primeira chegada na primeira fila que recebe chegadas externas
    tempoSimulacao = configRede.primeiraChegada;
    let primeiraFila = configRede.filas.find((f) => f.minChegada !== null);
    if (primeiraFila) {
      agendarEvento(
        criarEvento(
          "CHEGADA_REDE",
          configRede.primeiraChegada,
          proximoIdCliente,
          primeiraFila.id
        )
      );
      proximoIdCliente++;
    }
  }

  console.log(`- Números aleatórios: ${maxNumeros}`);
  console.log(`- Semente: ${seed}`);
  console.log("=".repeat(70));

  console.log("\nINÍCIO DA SIMULAÇÃO:");
  console.log("-".repeat(50));

  // Loop principal
  while (numerosUsados < maxNumeros && escalonador.length > 0) {
    let evento = proximoEvento();
    tempoSimulacao = evento.tempo;

    if (evento.tipo === "CHEGADA_INDIVIDUAL") {
      procedimentoChegadaIndividual(evento);
    } else if (evento.tipo === "SAIDA_INDIVIDUAL") {
      procedimentoSaidaIndividual(evento);
    } else if (evento.tipo === "CHEGADA_REDE") {
      procedimentoChegadaRede(evento);
    } else if (evento.tipo === "SAIDA_REDE") {
      procedimentoSaidaRede(evento);
    }

    // Mostra progresso
    if (numerosUsados % 10000 === 0 && numerosUsados > 0) {
      console.log(
        `Progresso: ${numerosUsados}/${maxNumeros} números usados, tempo: ${tempoSimulacao.toFixed(
          4
        )}`
      );
    }

    if (numerosUsados >= maxNumeros) {
      break;
    }
  }

  console.log("-".repeat(50));
  console.log("FIM DA SIMULAÇÃO");
  console.log("=".repeat(70));

  // Atualiza estatísticas finais e mostra resultados
  if (modoSimulacao === "individual") {
    atualizarEstatisticasFilaIndividual();
    mostrarResultadosFilaIndividual();
  } else {
    configRede.filas.forEach((fila) => {
      atualizarEstatisticasFila(fila.id);
    });
    mostrarResultadosRede();
  }
}

function mostrarResultadosFilaIndividual() {
  let config = configFilaIndividual;
  let tipo = `G/G/${config.numServidores}/${config.capacidade}`;

  console.log(`\nRESULTADOS DA SIMULAÇÃO ${tipo}:`);
  console.log("=".repeat(70));
  console.log(
    `Tempo total de simulação: ${tempoSimulacao.toFixed(4)} unidades`
  );
  console.log(`Números pseudoaleatórios utilizados: ${numerosUsados}`);
  console.log(`Clientes perdidos: ${clientesPerdidos}`);

  mostrarDistribuicaoEstados(temposEstados, "Sistema", tempoSimulacao);
  mostrarAnalise(
    temposEstados,
    clientesPerdidos,
    config.numServidores,
    tempoSimulacao
  );
}

function mostrarResultadosRede() {
  console.log("=========================================================");
  console.log("======================    REPORT   ======================");
  console.log("=========================================================");

  configRede.filas.forEach((fila) => {
    let stats = estatisticasFilas[fila.id];

    console.log("*********************************************************");
    console.log(
      `Queue:   ${fila.nome} (G/G/${fila.numServidores}/${fila.capacidade})`
    );

    // Show arrival info only for queues that receive external arrivals
    if (fila.minChegada !== null) {
      console.log(
        `Arrival: ${fila.minChegada.toFixed(1)} ... ${fila.maxChegada.toFixed(
          1
        )}`
      );
    }

    console.log(
      `Service: ${fila.minAtendimento.toFixed(
        1
      )} ... ${fila.maxAtendimento.toFixed(1)}`
    );
    console.log("*********************************************************");

    mostrarTabelaEstadosFormatada(stats.temposEstados, tempoSimulacao);

    console.log("");
    console.log(`Number of losses: ${stats.clientesPerdidos}`);
    console.log("");
  });

  console.log("=========================================================");
  console.log(`Simulation average time: ${tempoSimulacao.toFixed(4)}`);
  console.log("=========================================================");
}

function mostrarTabelaEstadosFormatada(temposEstados, tempoTotal) {
  console.log("   State               Time               Probability");

  for (let i = 0; i < temposEstados.length; i++) {
    let probabilidade = (temposEstados[i] / tempoTotal) * 100;
    let estado = i.toString().padStart(6);
    let tempo = temposEstados[i].toFixed(4).padStart(15);
    let prob = probabilidade.toFixed(2).padStart(15) + "%";

    console.log(`${estado}${tempo}${prob}`);
  }
}

function mostrarDistribuicaoEstados(temposEstados, nomeFila, tempoTotal) {
  console.log(`\nDISTRIBUIÇÃO DE PROBABILIDADES - ${nomeFila}:`);
  console.log("-".repeat(60));
  console.log("Estado\t| Tempo Acumulado\t| Probabilidade");
  console.log("-".repeat(60));

  let somaTempos = 0;
  for (let i = 0; i < temposEstados.length; i++) {
    somaTempos += temposEstados[i];
  }

  for (let i = 0; i < temposEstados.length; i++) {
    let probabilidade = temposEstados[i] / tempoTotal;
    console.log(
      `${i} cliente(s)\t| ${temposEstados[i].toFixed(4)}\t\t| ${(
        probabilidade * 100
      ).toFixed(2)}%`
    );
  }

  console.log("-".repeat(60));
  console.log(
    `Verificação: Soma = ${somaTempos.toFixed(
      4
    )} (deve ser ≈ ${tempoTotal.toFixed(4)})`
  );
}

function mostrarAnalise(temposEstados, perdidos, numServidores, tempoTotal) {
  let probVazio = temposEstados[0] / tempoTotal;
  let probCheio = temposEstados[temposEstados.length - 1] / tempoTotal;

  let numeroMedio = 0;
  for (let i = 0; i < temposEstados.length; i++) {
    numeroMedio += i * (temposEstados[i] / tempoTotal);
  }

  let utilizacao = 1 - probVazio;

  console.log(`\nANÁLISE:`);
  console.log(
    `Probabilidade do sistema vazio: ${(probVazio * 100).toFixed(2)}%`
  );
  console.log(`Probabilidade de bloqueio: ${(probCheio * 100).toFixed(2)}%`);
  console.log(`Número médio de clientes: ${numeroMedio.toFixed(4)}`);
  console.log(`Utilização do sistema: ${(utilizacao * 100).toFixed(2)}%`);

  if (numServidores > 1) {
    let utilizacaoServidor = 0;
    for (let i = 1; i < temposEstados.length; i++) {
      let servidoresUsados = Math.min(i, numServidores);
      utilizacaoServidor += servidoresUsados * (temposEstados[i] / tempoTotal);
    }
    utilizacaoServidor = utilizacaoServidor / numServidores;
    console.log(
      `Utilização média por servidor: ${(utilizacaoServidor * 100).toFixed(2)}%`
    );
  }
}

console.log("\n" + "=".repeat(70));
console.log("INSTRUÇÕES DE USO:");
console.log("=".repeat(70));
console.log(
  "Para alterar o modo de simulação, mude a variável 'modoSimulacao':"
);
console.log("- 'individual': simula uma única fila");
console.log("- 'rede': simula rede de filas em tandem");
console.log("");
console.log("Para fila individual, configure 'configFilaIndividual'");
console.log("Para rede de filas, configure 'configRede'");
console.log("=".repeat(70));

main();
