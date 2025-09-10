// Simulador de Fila G/G/c/K
// Altere os parâmetros abaixo para testar diferentes cenários

// Para G/G/1/5: numServidores = 1, capacidadeTotal = 5
// Para G/G/2/5: numServidores = 2, capacidadeTotal = 5
let numServidores = 1; // ← ALTERAR AQUI: 1 ou 2 servidores
let capacidadeTotal = 5; // ← Capacidade total do sistema
let maxNumeros = 100000; // Números pseudoaleatórios a usar

// Tempos das distribuições uniformes
let minChegada = 2.0;
let maxChegada = 5.0;
let minAtendimento = 3.0;
let maxAtendimento = 5.0;

// Gerador de números pseudoaleatórios
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

// Gera número uniforme entre min e max
function gerarUniforme(min, max) {
  return min + NextRandom() * (max - min);
}

// Variáveis da simulação
let tempoSimulacao = 0.0;
let clientesNoSistema = 0;
let servidoresOcupados = 0;
let tempoUltimoEvento = 0.0;
let temposEstados = new Array(capacidadeTotal + 1).fill(0.0);
let escalonador = [];
let proximoIdCliente = 1;
let clientesPerdidos = 0;

function criarEvento(tipo, tempo, clienteId) {
  return {
    tipo: tipo,
    tempo: tempo,
    clienteId: clienteId,
  };
}

function agendarEvento(evento) {
  escalonador.push(evento);
  escalonador.sort((a, b) => a.tempo - b.tempo);
}

function proximoEvento() {
  return escalonador.shift();
}

function atualizarEstatisticas() {
  let deltaT = tempoSimulacao - tempoUltimoEvento;
  temposEstados[clientesNoSistema] += deltaT;
  tempoUltimoEvento = tempoSimulacao;
}

function procedimentoChegada(evento) {
  console.log(
    `Tempo ${tempoSimulacao.toFixed(4)}: Cliente ${evento.clienteId} chegou`
  );

  atualizarEstatisticas();

  if (clientesNoSistema < capacidadeTotal) {
    clientesNoSistema++;

    // Se tem servidor livre, atende direto
    if (servidoresOcupados < numServidores) {
      servidoresOcupados++;
      let tempoAtendimento = gerarUniforme(minAtendimento, maxAtendimento);
      let eventoSaida = criarEvento(
        "SAIDA",
        tempoSimulacao + tempoAtendimento,
        evento.clienteId
      );
      agendarEvento(eventoSaida);

      if (numServidores === 1) {
        console.log(
          `  -> Cliente ${
            evento.clienteId
          } iniciou atendimento, sairá em ${tempoAtendimento.toFixed(4)}`
        );
      } else {
        console.log(
          `  -> Cliente ${
            evento.clienteId
          } iniciou atendimento no servidor ${servidoresOcupados}, sairá em ${tempoAtendimento.toFixed(
            4
          )}`
        );
      }
    } else {
      // Vai pra fila
      if (numServidores === 1) {
        console.log(
          `  -> Cliente ${evento.clienteId} entrou na fila de espera (${clientesNoSistema} no sistema)`
        );
      } else {
        console.log(
          `  -> Cliente ${evento.clienteId} entrou na fila de espera (${clientesNoSistema} no sistema, ${servidoresOcupados} servidores ocupados)`
        );
      }
    }
  } else {
    clientesPerdidos++;
    console.log(`  -> Cliente ${evento.clienteId} rejeitado - sistema cheio!`);
  }

  // Agenda próxima chegada se ainda tem números disponíveis
  if (numerosUsados < maxNumeros) {
    let intervaloChegada = gerarUniforme(minChegada, maxChegada);
    let proximaChegada = criarEvento(
      "CHEGADA",
      tempoSimulacao + intervaloChegada,
      proximoIdCliente
    );
    proximoIdCliente++;
    agendarEvento(proximaChegada);
  }
}

function procedimentoSaida(evento) {
  console.log(
    `Tempo ${tempoSimulacao.toFixed(4)}: Cliente ${evento.clienteId} saiu`
  );

  atualizarEstatisticas();
  clientesNoSistema--;

  // Se ainda tem gente na fila, próximo começa o atendimento
  if (clientesNoSistema >= numServidores) {
    let tempoAtendimento = gerarUniforme(minAtendimento, maxAtendimento);
    let proximoClienteId =
      proximoIdCliente - (clientesNoSistema - numServidores + 1);
    let eventoSaida = criarEvento(
      "SAIDA",
      tempoSimulacao + tempoAtendimento,
      proximoClienteId
    );
    agendarEvento(eventoSaida);

    if (numServidores === 1) {
      console.log(
        `  -> Próximo cliente iniciou atendimento, sairá em ${tempoAtendimento.toFixed(
          4
        )}`
      );
    } else {
      console.log(
        `  -> Cliente da fila iniciou atendimento, sairá em ${tempoAtendimento.toFixed(
          4
        )} (${servidoresOcupados} servidores ocupados)`
      );
    }
  } else {
    servidoresOcupados--;
    if (numServidores > 1) {
      console.log(
        `  -> Um servidor ficou livre (${servidoresOcupados} servidores ocupados)`
      );
    }
  }
}

function main() {
  let tipoSistema = `G/G/${numServidores}/${capacidadeTotal}`;

  console.log("=".repeat(70));
  console.log(`SIMULADOR ${tipoSistema}`);
  console.log("=".repeat(70));
  console.log(`Configurações:`);
  console.log(`- Tipo do sistema: ${tipoSistema}`);
  console.log(`- Servidores: ${numServidores}`);
  console.log(`- Capacidade total: ${capacidadeTotal} clientes`);
  console.log(`- Chegadas: Uniforme[${minChegada}, ${maxChegada}]`);
  console.log(`- Atendimento: Uniforme[${minAtendimento}, ${maxAtendimento}]`);
  console.log(`- Números aleatórios: ${maxNumeros}`);
  console.log(`- Semente: ${seed}`);
  console.log("=".repeat(70));

  // Primeira chegada sempre no tempo 2.0
  tempoSimulacao = 2.0;
  agendarEvento(criarEvento("CHEGADA", 2.0, proximoIdCliente));
  proximoIdCliente++;

  console.log("\nINÍCIO DA SIMULAÇÃO:");
  console.log("-".repeat(50));

  // Loop principal - para quando usar todos os números aleatórios
  while (numerosUsados < maxNumeros && escalonador.length > 0) {
    let evento = proximoEvento();
    tempoSimulacao = evento.tempo;

    if (evento.tipo === "CHEGADA") {
      procedimentoChegada(evento);
    } else if (evento.tipo === "SAIDA") {
      procedimentoSaida(evento);
    }

    // Mostra progresso a cada 10000 números
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

  atualizarEstatisticas();

  console.log("-".repeat(50));
  console.log("FIM DA SIMULAÇÃO");
  console.log("=".repeat(70));

  // Mostra os resultados
  console.log(`\nRESULTADOS DA SIMULAÇÃO ${tipoSistema}:`);
  console.log("=".repeat(70));
  console.log(
    `Tempo total de simulação: ${tempoSimulacao.toFixed(4)} unidades`
  );
  console.log(`Números pseudoaleatórios utilizados: ${numerosUsados}`);
  console.log(`Clientes perdidos (rejeitados): ${clientesPerdidos}`);
  console.log();

  console.log("DISTRIBUIÇÃO DE PROBABILIDADES DOS ESTADOS:");
  console.log("-".repeat(60));
  console.log("Estado\t| Tempo Acumulado\t| Probabilidade");
  console.log("-".repeat(60));

  let somaTempos = 0;
  for (let i = 0; i <= capacidadeTotal; i++) {
    somaTempos += temposEstados[i];
  }

  for (let i = 0; i <= capacidadeTotal; i++) {
    let probabilidade = temposEstados[i] / tempoSimulacao;
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
    )} (deve ser ≈ ${tempoSimulacao.toFixed(4)})`
  );

  console.log("\nANÁLISE:");
  console.log("=".repeat(70));

  let probSistemaVazio = temposEstados[0] / tempoSimulacao;
  let probSistemaCheio = temposEstados[capacidadeTotal] / tempoSimulacao;

  console.log(
    `Probabilidade do sistema vazio: ${(probSistemaVazio * 100).toFixed(2)}%`
  );
  console.log(
    `Probabilidade de bloqueio: ${(probSistemaCheio * 100).toFixed(2)}%`
  );

  let numeroMedioClientes = 0;
  for (let i = 0; i <= capacidadeTotal; i++) {
    numeroMedioClientes += i * (temposEstados[i] / tempoSimulacao);
  }
  console.log(
    `Número médio de clientes no sistema: ${numeroMedioClientes.toFixed(4)}`
  );

  let utilizacao = 1 - probSistemaVazio;
  console.log(`Utilização do sistema: ${(utilizacao * 100).toFixed(2)}%`);

  if (numServidores > 1) {
    let utilizacaoServidor = 0;
    for (let i = 1; i <= capacidadeTotal; i++) {
      let servidoresUsados = Math.min(i, numServidores);
      utilizacaoServidor +=
        servidoresUsados * (temposEstados[i] / tempoSimulacao);
    }
    utilizacaoServidor = utilizacaoServidor / numServidores;
    console.log(
      `Utilização média por servidor: ${(utilizacaoServidor * 100).toFixed(2)}%`
    );
  }

  console.log("=".repeat(70));
  console.log(`SIMULAÇÃO ${tipoSistema} CONCLUÍDA!`);

  console.log("\n" + "=".repeat(70));
  console.log("COMO USAR:");
  console.log("=".repeat(70));
  console.log(
    "Para testar diferentes configurações, mude no início do código:"
  );
  console.log("");
  console.log("Para G/G/1/5: numServidores = 1, capacidadeTotal = 5");
  console.log("Para G/G/2/5: numServidores = 2, capacidadeTotal = 5");
  console.log("");
  console.log("Outros parâmetros que você pode alterar:");
  console.log("- maxNumeros: quantos números aleatórios usar");
  console.log("- minChegada/maxChegada: tempo entre chegadas");
  console.log("- minAtendimento/maxAtendimento: tempo de atendimento");
}

main();
