export function readImageFile(file: File, maxBytes = 400_000) {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new Error('请选择图片'));
  }
  if (file.size > maxBytes) {
    return Promise.reject(new Error('图片需小于 400KB'));
  }
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(file);
  });
}
