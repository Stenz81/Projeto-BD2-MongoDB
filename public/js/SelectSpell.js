
//SELECT DISTINCT Magia.* FROM Magia, crenca, forma_de_combate, crenca_x_magia, forma_de_combate_x_magia 
//WHERE Magia.id = crenca_x_magia.id_magia
//AND Magia.id = forma_de_combate_x_magia.id_magia
//AND forma_de_combate.id = forma_de_combate_x_Magia.id_forma_de_combate
//AND crenca.id = crenca_x_magia.id_crenca
//AND Magia.nivel_base BETWEEN 1 AND 3
//AND (crenca_x_magia.id_crenca = (SELECT id FROM crenca WHERE nome = 'Natureza') OR crenca_x_magia.id_crenca = (SELECT id FROM crenca WHERE nome = 'Anima'))
//AND (forma_de_combate_x_magia.id_forma_de_combate = (SELECT id FROM forma_de_combate WHERE nome = 'Tank') OR (forma_de_combate_x_magia.id_forma_de_combate = (SELECT id FROM forma_de_combate WHERE nome = 'Suporte')))
function selectMagia() {
    const nome_magia = document.getElementById("nome_busca").value.trim()
    const nivel_inferior = document.getElementById("nivel_inferior").value.toString()
    const nivel_superior = document.getElementById("nivel_superior").value.toString()
    const crencas = window.selectedValues
    const formas_de_combate = window.selectedValues1
    const saida = document.getElementById("container2")
    
    saida.innerHTML = ""; //limpar saida

    saida.style.display = "block";

    if (formas_de_combate.length > 2) {
        saida.innerHTML = "<p class='erro'>Por favor, insira de 0 a 2 formas de combate.</p>"
        return;
    }
    if (nivel_superior < nivel_inferior) {
        saida.innerHTML = "<p class='erro'>Nível Inferior não pode ser menor que Nível Superior</p>";
        return;
    }
    fetch('/buscar-magias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nome_magia,
            nivel_inferior,
            nivel_superior,
            crencas,
            formas_de_combate
        })
    })
        .then(res => res.json())
        .then(magias => {
            if (!Array.isArray(magias)) {
                saida.innerHTML = "<p class='erro'>Erro ao buscar magias.</p>";
                return;
            }
            magias.forEach(m => {
                
                const link = document.createElement('a');
                link.href = '/magias/' + m.nome.toString(); // Rota que você criar para mostrar detalhes
                link.textContent = m.nome;
                link.style.display = "block"; // Um embaixo do outro
                saida.appendChild(link)
            });
        })
        .catch(() => {
            saida.innerHTML = "<p class='erro'>Erro na requisição.</p>";
        });
}

const botao_confirm_busca = document.getElementById("Confirm_button")
botao_confirm_busca.addEventListener("click", selectMagia)

