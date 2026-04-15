// Configuration Admin Polyclinique Kennedy
// Développé par W2K-Digital

const CONFIG = {
    // Code PIN Admin (4 chiffres)
    PIN: '2025',
    
    // Supabase
    SUPABASE_URL: 'https://ilycnutphhmuvaonkrsa.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlseWNudXRwaGhtdXZhb25rcnNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjY5NDcsImV4cCI6MjA5MDEwMjk0N30.80ipBwMVvAkC2f0Oz2Wzl8E6GjMwlLCoE72XbePtmnM',
    
    // Cloudflare R2
    R2_PUBLIC_URL: 'https://medias.w2k-digital.com',
    R2_BUCKET_PATH: 'polyclinique-kennedy',
    
    // Site principal
    SITE_URL: 'https://polycliniquekennedy.com',
    
    // Tables Supabase
    TABLES: {
        ACTUALITES: 'actualites',
        TEMOIGNAGES: 'temoignages'
    }
};

// Fonctions utilitaires Supabase
const supabase = {
    async select(table, options = {}) {
        let url = `${CONFIG.SUPABASE_URL}/rest/v1/${table}?select=*`;
        if (options.order) url += `&order=${options.order}`;
        if (options.filter) url += `&${options.filter}`;
        
        const res = await fetch(url, {
            headers: {
                'apikey': CONFIG.SUPABASE_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
            }
        });
        return res.json();
    },
    
    async insert(table, data) {
        const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': CONFIG.SUPABASE_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        return res.json();
    },
    
    async update(table, id, data) {
        const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': CONFIG.SUPABASE_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(data)
        });
        return res.json();
    },
    
    async delete(table, id) {
        const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': CONFIG.SUPABASE_KEY,
                'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
            }
        });
        return res.ok;
    }
};

// Upload image vers Supabase Storage
async function uploadImage(file, folder) {
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const filePath = `${CONFIG.R2_BUCKET_PATH}/${folder}/${fileName}`;
    
    const res = await fetch(`${CONFIG.SUPABASE_URL}/storage/v1/object/${filePath}`, {
        method: 'POST',
        headers: {
            'apikey': CONFIG.SUPABASE_KEY,
            'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
            'Content-Type': file.type
        },
        body: file
    });
    
    if (res.ok) {
        return `${CONFIG.R2_PUBLIC_URL}/${filePath}`;
    }
    return null;
}
