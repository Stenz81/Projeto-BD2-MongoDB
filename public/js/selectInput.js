function createComboBox(comboId, listId, placeholderText, globalName) {
  const comboInput = document.getElementById(comboId);
  const optionsList = document.getElementById(listId);
  const options = optionsList.querySelectorAll('li');
  const placeholder = comboInput.querySelector('.placeholder');

  window[globalName] = [];

  function updateSelectedTags() {
    comboInput.querySelectorAll('.tag').forEach(tag => tag.remove());

    window[globalName].forEach(value => {
      const option = [...options].find(opt => opt.dataset.value === value);
      const span = document.createElement('span');
      span.classList.add('tag');
      span.textContent = option.textContent;
      comboInput.insertBefore(span, placeholder);
    });

    placeholder.style.display = window[globalName].length ? 'none' : 'inline';
  }

  comboInput.addEventListener('click', () => {
    const isOpen = optionsList.style.display === 'block';
    optionsList.style.display = isOpen ? 'none' : 'block';
  });

  options.forEach(option => {
    option.addEventListener('click', () => {
      const value = option.dataset.value;
      const index = window[globalName].indexOf(value);

      if (index > -1) {
        window[globalName].splice(index, 1);
        option.classList.remove('selected');
      } else {
        window[globalName].push(value);
        option.classList.add('selected');
      }

      updateSelectedTags();
    });
  });

  document.addEventListener('click', (e) => {
    if (!comboInput.contains(e.target) && !optionsList.contains(e.target)) {
      optionsList.style.display = 'none';
    }
  });
}

