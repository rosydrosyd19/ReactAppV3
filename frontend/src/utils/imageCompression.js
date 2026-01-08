/**
 * Mengompres file gambar menggunakan HTML Canvas
 * @param {File} file - File gambar asli
 * @param {number} quality - Kualitas kompresi (0.0 - 1.0), default 0.7
 * @param {number} maxWidth - Lebar maksimum, default 1920
 * @param {number} maxHeight - Tinggi maksimum, default 1920
 * @returns {Promise<File>} - Promise yang me-resolve ke File gambar yang sudah dikompres
 */
export const compressImage = (file, quality = 0.7, maxWidth = 1920, maxHeight = 1920) => {
    return new Promise((resolve, reject) => {
        // Cek jika file bukan gambar
        if (!file.type.match(/image.*/)) {
            reject(new Error("File bukan gambar"));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Hitung dimensi baru jika melebihi batas
                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Konversi canvas kembali ke blob/file
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("Gagal mengompres gambar"));
                            return;
                        }

                        // Buat File baru dari blob
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });

                        console.log(`Kompresi Gambar: ${file.name}`);
                        console.log(`Sebelum: ${(file.size / 1024).toFixed(2)} KB`);
                        console.log(`Sesudah: ${(compressedFile.size / 1024).toFixed(2)} KB`);
                        console.log(`Rasio: ${((1 - compressedFile.size / file.size) * 100).toFixed(2)}% lebih kecil`);

                        resolve(compressedFile);
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = (error) => {
                reject(error);
            };
        };

        reader.onerror = (error) => {
            reject(error);
        };
    });
};
