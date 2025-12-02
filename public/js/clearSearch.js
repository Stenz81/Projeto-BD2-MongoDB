


function clearComboBox(comboId, optionsId, selectedArrayName) {
  window[selectedArrayName] = [];
  const comboInput = document.getElementById(comboId);
  const placeholder = comboInput.querySelector('.placeholder');
  const optionsList = document.getElementById(optionsId);

  comboInput.querySelectorAll('.tag').forEach(tag => tag.remove());
  optionsList.querySelectorAll('li.selected').forEach(opt => opt.classList.remove('selected'));
  placeholder.style.display = 'inline';
}

function clearSearch() {
    const nivel_inferior = document.getElementById("nivel_inferior")
    const nivel_superior = document.getElementById("nivel_superior")

    const saida = document.getElementById("container2")

    nivel_inferior.value = nivel_inferior.placeholder
    nivel_superior.value = nivel_superior.placeholder

    clearComboBox('comboInput', 'optionsList', 'selectedValues')
    clearComboBox('comboInputFC', 'optionsListFC', 'selectedValues1')

    saida.innerHTML = "";
    saida.style.display = "none";
}

const botaoLimpa = document.getElementById("Clear_button")
botaoLimpa.addEventListener("click", clearSearch)