/**
 * Service xử lý tải ảnh lên đám mây Cloudinary
 */
export const uploadService = {
  /**
   * Tải file ảnh hoặc chuỗi base64 lên Cloudinary
   * @param {File|Blob|string} fileOrData
   * @returns {Promise<string>} URL HTTPS an toàn từ Cloudinary
   */
  async uploadImage(fileOrData) {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'edavcmw2';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'makeup_booking_preset';

    const formData = new FormData();
    formData.append('file', fileOrData);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok || !data.secure_url) {
      throw new Error(data?.error?.message || 'Không thể tải ảnh lên Cloudinary');
    }

    return data.secure_url;
  },
};
