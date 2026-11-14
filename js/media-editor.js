const MediaEditor = (() => {
  const formats = {
    'image/jpeg':'image', 'image/png':'image', 'audio/mpeg':'audio', 'video/mp4':'video'
  };
  const limit = 2 * 1024 * 1024;

  function read(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({name:file.name, type:formats[file.type], url:reader.result});
      reader.onerror = () => reject(new Error('Could not read ' + file.name));
      reader.readAsDataURL(file);
    });
  }

  function bind(selector, fields, existing) {
    const media = structuredClone(existing || {});
    let pending = Promise.resolve();
    document.querySelectorAll(selector).forEach((zone, index) => {
      const [key, role] = fields[index];
      const accept = role ? ['audio/mpeg'] : key === 'hint' ? ['image/jpeg', 'image/png'] : Object.keys(formats);
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept.join(',');
      input.multiple = !role && key !== 'hint';
      input.hidden = true;
      const list = document.createElement('ul');
      const status = document.createElement('p');
      status.setAttribute('role', 'status');
      zone.append(input, list, status);

      function render() {
        list.replaceChildren();
        (media[key] || []).forEach((item, index) => {
          if (item.role !== role) return;
          const row = document.createElement('li');
          row.textContent = (item.name || item.type) + ' ';
          const remove = document.createElement('button');
          remove.type = 'button';
          remove.textContent = 'Remove';
          remove.onclick = () => { media[key].splice(index, 1); render(); };
          row.append(remove);
          list.append(row);
        });
      }

      function select(files) {
        pending = pending.then(async () => {
          status.textContent = '';
          if (!files.length) return;
          if (files.some(file => !accept.includes(file.type))) throw new Error('Choose a supported file type.');
          if (files.reduce((sum, file) => sum + file.size, 0) > limit) throw new Error('Select at most 2 MB of media at a time.');
          const items = await Promise.all((input.multiple ? files : files.slice(0, 1)).map(read));
          const old = media[key] || [];
          media[key] = [...(input.multiple ? old : old.filter(item => item.role !== role)), ...items.map(item => ({...item, role}))];
          render();
        }).catch(error => { status.textContent = error.message; });
      }

      zone.querySelector('button').onclick = event => { event.preventDefault(); input.click(); };
      input.onchange = () => { select([...input.files]); input.value = ''; };
      zone.ondragover = event => event.preventDefault();
      zone.ondrop = event => { event.preventDefault(); select([...event.dataTransfer.files]); };
      render();
    });
    return async () => { await pending; return structuredClone(media); };
  }
  return {bind};
})();
