export function openJsonFile(cb: (content: string) => void) {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('style', 'opacity:0;height:0;');
  input.setAttribute('accept', 'application/json');
  document.body.appendChild(input);

  input.addEventListener('change', () => {
    if (input.files && input.files.length > 0) {
      const reader = new FileReader();
      reader.onload = function() {
        cb(reader.result as string);
      };
      reader.readAsText(input.files[0]);
    }
    document.body.removeChild(input);
  });
  input.click();
}

export function saveJsonFile(fileName: string, content: string) {
  const url = window.URL.createObjectURL(new Blob([ JSON.stringify(content) ], { type : 'application/json' }));
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}