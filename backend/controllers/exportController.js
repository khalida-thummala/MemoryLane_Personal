import supabase from '../config/supabase.js';
import archiver from 'archiver';
import axios from 'axios';
import path from 'path';

export const exportDataJson = async (req, res) => {
    try {
        const userId = req.user.id;

        const [{ data: memories }, { data: albums }] = await Promise.all([
            supabase.from('memories').select('*, memory_media(*), memory_tags(tags(name))').eq('user_id', userId),
            supabase.from('albums').select('*, album_memories(memories(*))').eq('user_id', userId),
        ]);

        const data = { memories, albums, exportedAt: new Date() };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=memorylane_export.json');
        res.send(JSON.stringify(data, null, 2));
    } catch (error) {
        res.status(500).json({ message: 'Error exporting JSON data', error: error.message });
    }
};

export const exportDataZip = async (req, res) => {
    try {
        const userId = req.user.id;

        const [{ data: memories }, { data: albums }] = await Promise.all([
            supabase.from('memories').select('*, memory_media(*), memory_tags(tags(name))').eq('user_id', userId),
            supabase.from('albums').select('*, album_memories(memories(*))').eq('user_id', userId),
        ]);

        const data = { memories, albums, exportedAt: new Date() };

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=memorylane_export.zip');

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            if (!res.headersSent) res.status(500).json({ message: 'Archive Error' });
        });

        archive.pipe(res);
        archive.append(JSON.stringify(data, null, 2), { name: 'memorylane_data.json' });

        // Iterate through all media and append them to the ZIP
        const mediaPromises = [];
        let mediaCount = 1;

        if (memories && memories.length > 0) {
            for (const memory of memories) {
                if (memory.memory_media && memory.memory_media.length > 0) {
                    for (const media of memory.memory_media) {
                        if (media.media_url && media.media_url.startsWith('http')) {
                            mediaPromises.push((async () => {
                                try {
                                    const response = await axios.get(media.media_url, { responseType: 'stream' });

                                    // Try to determine an extension from the URL, otherwise default to .bin
                                    const ext = path.extname(new URL(media.media_url).pathname) || (media.media_type === 'image' ? '.jpg' : media.media_type === 'video' ? '.mp4' : media.media_type === 'audio' ? '.mp3' : '.dat');

                                    const filename = `media/memory_${memory.id}_media_${media.id}${ext}`;

                                    archive.append(response.data, { name: filename });
                                } catch (downloadError) {
                                    console.error(`Failed to download media ${media.media_url}:`, downloadError.message);
                                }
                            })());
                        }
                    }
                }
            }
        }

        // Wait for all media downloads/append instructions to complete
        await Promise.all(mediaPromises);

        await archive.finalize();
    } catch (error) {
        if (!res.headersSent) res.status(500).json({ message: 'Error exporting ZIP data', error: error.message });
    }
};
