function parseImageManifest(raw, currentImages, fileCount) {
    let entries;
    try { entries = JSON.parse(raw); } catch { throw new Error('Image selection is invalid. Reopen the editor and try again.'); }
    if (!Array.isArray(entries) || entries.length < 1 || entries.length > 10) {
        throw new Error('Keep between 1 and 10 product images.');
    }
    const seen = new Set();
    let uploads = 0;
    for (const entry of entries) {
        if (!entry || typeof entry !== 'object' || Object.keys(entry).length !== 1) throw new Error('Invalid image reference.');
        let key;
        if (typeof entry.url === 'string' && currentImages.includes(entry.url)) {
            key = `url:${entry.url}`;
        } else if (Number.isInteger(entry.upload) && entry.upload >= 0 && entry.upload < fileCount) {
            key = `upload:${entry.upload}`;
            uploads++;
        } else {
            throw new Error('An image no longer belongs to this product or an upload is missing. Reopen the editor.');
        }
        if (seen.has(key)) throw new Error('Each image can only appear once.');
        seen.add(key);
    }
    if (uploads !== fileCount) throw new Error('Every uploaded image must be included in the gallery.');
    return entries;
}

async function updateProductGallery({ sql, id, product, manifest, files, uploadImages, deleteBlobImages }) {
    const oldImages = await sql`SELECT url, blob_pathname FROM product_images WHERE product_id = ${id}`;
    // Check ownership again against the rows actually being replaced.
    parseImageManifest(JSON.stringify(manifest), oldImages.map(image => image.url), files.length);
    const uploaded = [];
    let committed = false;
    try {
        // Wait for every upload so a failed sibling cannot leave unnoticed new blobs behind.
        const results = await Promise.allSettled(files.map(file => uploadImages([file])));
        for (const result of results) if (result.status === 'fulfilled') uploaded.push(result.value[0]);
        const failed = results.find(result => result.status === 'rejected');
        if (failed) throw failed.reason;
        const gallery = manifest.map(entry => entry.url
            ? { url: entry.url, pathname: oldImages.find(image => image.url === entry.url).blob_pathname }
            : uploaded[entry.upload]);
        await sql.transaction([
            sql`UPDATE products SET name = ${product.name}, price = ${product.price}, stock = ${product.stock},
                category = ${product.category}, specs = ${product.specs}, is_featured = ${product.isFeatured}, updated_at = NOW()
                WHERE id = ${id}`,
            sql`DELETE FROM product_images WHERE product_id = ${id}`,
            ...gallery.map((image, index) => sql`
                INSERT INTO product_images (product_id, url, blob_pathname, alt_text, sort_order, is_main)
                VALUES (${id}, ${image.url}, ${image.pathname}, ${product.name}, ${index}, ${index === 0})
            `)
        ]);
        committed = true;
        const removed = oldImages.filter(image => !gallery.some(retained => retained.url === image.url));
        if (removed.length) {
            // A cleanup failure must not report a committed edit as failed or delete retained images.
            await deleteBlobImages(removed).catch(error => console.error('[Products] Removed image cleanup failed:', error.message));
        }
    } catch (error) {
        if (!committed && uploaded.length) {
            await deleteBlobImages(uploaded).catch(cleanup => console.error('[Products] New image cleanup failed:', cleanup.message));
        }
        throw error;
    }
}

module.exports = { parseImageManifest, updateProductGallery };
