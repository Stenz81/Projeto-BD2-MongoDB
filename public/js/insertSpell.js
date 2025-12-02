function insertMagia() {
    const nivel_magia = document.getElementById("nivel_magia_unico").value.toString() || null;
    let nome_magia = document.getElementById("nome_magia_unico").value;
    const descricao = document.getElementById("descricao").value;
    const crencas = window.selectedValuesInsert
    const formas_de_combate = window.selectedValuesInsert1
    const custo_inicial = document.getElementById("custo_inicial_unico").value.toString() || null;
    const custo_rodada = document.getElementById("custo_rodada_unico").value.toString() || null;
    const custo_acao = document.getElementById("custo_acao_unico").value
    const escalonamento = document.getElementById("escalonamento").value
    const saida = document.getElementById("container_saida")

    //Padronizar nome para o BD
    let resultado = "";
    let dentroParenteses = false;

    for (const char of nome_magia) {
        if (char === "(") {
      dentroParenteses = true;
      resultado += char;
        } else if (char === ")") {
      dentroParenteses = false;
      resultado += char;
        } else if (!dentroParenteses) {
      resultado += char.toUpperCase();
        } else {
      resultado += char; // mantém original dentro de ()
        }
    }

    nome_magia = resultado;

    //checagem

    if (formas_de_combate.length != 2) {
        saida.innerHTML = "<p class='erro'>Por favor, insira de exatamente 2 formas de combate.</p>"
        return;
    }

    if (crencas.length != 2) {
        saida.innerHTML = "<p class='erro'>Por favor, insira de exatamente 2 crenças.</p>"
        return;
    }

    const crenca1 = crencas[0]
    const crenca2 = crencas[1]
    const forma1 = formas_de_combate[0]
    const forma2 = formas_de_combate[1]

    const response = fetch('/inserir-magias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nivel_magia,
            nome_magia,
            crenca1,
            crenca2,
            forma1,
            forma2,
            custo_inicial,
            custo_rodada,
            custo_acao,
            escalonamento,
            descricao

        })
    })
        .then(async response => {
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.erro);
            }
            return response.json();
        })
        .catch(error => {
            console.error("Erro na requisição:", error); //TAlvez tirar essa linha
            saida.innerHTML = error.message;
        });
        console.log(response)
}

function multInsere() {
  // Divide o texto em blocos — cada habilidade começa com um nome e termina antes da próxima linha vazia dupla
  const texto = document.getElementById("multi_insert").value;
  const saida = document.getElementById("container_saida");
  const blocos = texto.trim().split(
  /(?=^(?:[A-ZÁÉÍÓÚÇ ,]+(?:\([^)]*\))*\s*$))/m
);

  console.log(blocos.length)
  const resultados = [];
  let contagem = 1;
  for (const bloco of blocos) {
    const linhas = bloco.trim().split(/\n/).map(l => l.trim()).filter(l => l);

    // Extrai nome (primeira linha)
    const nome_magia = linhas[0];

    // Segunda linha: crenças e formas
    const segundaLinha = linhas[1] || "";
    //pega TODA a segunda linha
    const matchLinha2 = segundaLinha.match(/^(.+?) ou (.+?) - (.+?) ou (.+)$/i);
    //o (.+?), em regex indica posição de match entre o anterior e o que vem depois, 
    const crenca1 = matchLinha2 ? matchLinha2[1].trim() : null;
    const crenca2 = matchLinha2 ? matchLinha2[2].trim() : null;
    const forma1 = matchLinha2 ? matchLinha2[3].trim() : null;
    //(.+) é 
    const forma2 = matchLinha2 ? matchLinha2[4].trim() : null;

    // Terceira Linha, Lvl X
    const terceiraLinha = linhas[2] || "";
    const lvlMatch = terceiraLinha.match(/Lvl\s*(\d+)/i);
    const nivel_magia = lvlMatch ? parseInt(lvlMatch[1]) : null;

    // Encontra blocos de texto por palavras-chave
    const textoJunto = bloco.trim();

    // Pega descrição (entre "Lvl" e "Custo:")
    const descricaoMatch = textoJunto.match(/Lvl\s*\d+[\s\S]*?(?=Custo:)/i);
    const descricao = descricaoMatch ? descricaoMatch[0]
      .replace(/Lvl\s*\d+\s*/i, "")
      .trim() : null;

      // Regra: primeiro é inicial, o segundo pode ser "por rodada"
    const custoMatch = textoJunto.match(/Custo:\s*([^\n]*)/i);
    let custo_inicial = null, 
    custo_rodada = null, 
    custo_acao = null,
    custo_raw = null;

    if (custoMatch) {
        custo_raw = custoMatch[1].trim();

            // Divide por vírgulas (geralmente separa energia / rodadas / ações)
        const partes = custo_raw.split(",").map(p => p.trim());

        for (const parte of partes) {
        // 1️⃣ Detecta custos em E.h
        const ehMatch = parte.match(/(\d+)\s*E\.h/i);
          if (ehMatch) {
            const valor = parseInt(ehMatch[1]);

            if (/E\.h por/i.test(parte)) {
            // Sempre possuí "E.h por (algo) em geral rodada"
            custo_rodada = valor;
            } else if (custo_inicial === null) {
            // Primeiro E.h encontrado — assume como custo inicial
            custo_inicial = valor;
            } else {
            // Caso raro: talvez seja outro custo E.h não categorizado
            // (pode guardar ou ignorar)
            console.warn('E.h extra encontrado:', parte);
            }

  continue;
}

// Se não for E.h, é o custo de ação
if (!custo_acao && parte.length > 0) {
  custo_acao = parte;
}
        }
    }

    // Pega escalonamento (após "Nível:")
    const escalonamentoMatch = textoJunto.match(/(?:Nível|Escalonamento):\s*([\s\S]*?)(?=\n[A-ZÁÉÍÓÚÇ ]+[A-Z]\s|\n*$)/i);

    const escalonamento = escalonamentoMatch ? escalonamentoMatch[1].trim() : null;
    
    //CHECAGENS DE ERRO
    
    if (!matchLinha2) {
        console.error(`Erro no texto! Verifique as crenças/formas de combate do bloco "${nome || '(sem nome)'}", o de número "${contagem}"`);
        return; // encerra
    }

    if(!custoMatch) {
      console.error(`Erro no texto! Verifique os custos do bloco "${nome_magia || '(sem nome)'}", o de número "${contagem}"`);
        return;
    }

    if(nivel_magia % 3 != 0) {
      if(nivel_magia != 1){
        console.error(`Erro no texto! Verifique o nivel do bloco "${nome_magia || '(sem nome)'}", o de número "${contagem}"`);
        return;
      }
    }

    if(custo_inicial == 0){
        console.error(`Erro no texto! Verifique o custo inicial do bloco "${nome_magia || '(sem nome)'}", o de número "${contagem}"`);
        return;
    }
    
    const response = fetch('/inserir-magias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nivel_magia,
            nome_magia,
            crenca1,
            crenca2,
            forma1,
            forma2,
            custo_inicial,
            custo_rodada,
            custo_acao,
            escalonamento,
            descricao
        })
    })
      .then(async response => {
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.erro);
            }
            return response.json();
        })
        .catch(error => {
            console.error("Erro na requisição:", error);
            saida.innerHTML = error.message;
            return;
        });
        console.log(response)

        

     // PUSH RESULTADO
        resultados.push({
            nivel_magia,
            nome_magia,
            crenca1,
            crenca2,
            forma1,
            forma2,
            custo_inicial,
            custo_rodada,
            custo_acao,
            escalonamento,
            descricao
        });

        console.log(resultados)

    contagem = contagem + 1;
  }
  //console.log(resultados);
  return resultados;
}

const botao_confirm_insert = document.getElementById("Confirm_button_single")
botao_confirm_insert.addEventListener("click", insertMagia)
const botao_confirm_insert_mult = document.getElementById("Confirm_button_mult")
botao_confirm_insert_mult.addEventListener("click", multInsere)
