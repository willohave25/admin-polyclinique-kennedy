// Admin Polyclinique Kennedy - JavaScript
// Développé par W2K-Digital

(function() {
    'use strict';

    // Éléments DOM
    const loginScreen = document.getElementById('login-screen');
    const adminPanel = document.getElementById('admin-panel');
    const pinInputs = document.querySelectorAll('.pin-input');
    const pinError = document.getElementById('pin-error');
    const logoutBtn = document.getElementById('logout-btn');
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.admin-section');
    const toastContainer = document.getElementById('toast-container');

    // =========================================
    // AUTHENTIFICATION PIN
    // =========================================

    function initPinLogin() {
        pinInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                if (value.length === 1) {
                    if (index < pinInputs.length - 1) {
                        pinInputs[index + 1].focus();
                    } else {
                        checkPin();
                    }
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    pinInputs[index - 1].focus();
                }
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const digits = paste.replace(/\D/g, '').slice(0, 4);
                
                digits.split('').forEach((digit, i) => {
                    if (pinInputs[i]) pinInputs[i].value = digit;
                });
                
                if (digits.length === 4) checkPin();
            });
        });

        pinInputs[0].focus();
    }

    function checkPin() {
        const pin = Array.from(pinInputs).map(i => i.value).join('');
        
        if (pin === CONFIG.PIN) {
            localStorage.setItem('pk_admin_auth', Date.now());
            showAdminPanel();
        } else {
            pinError.textContent = 'Code PIN incorrect';
            pinInputs.forEach(i => {
                i.value = '';
                i.classList.add('error');
            });
            pinInputs[0].focus();
            
            setTimeout(() => {
                pinInputs.forEach(i => i.classList.remove('error'));
                pinError.textContent = '';
            }, 2000);
        }
    }

    function checkSession() {
        const auth = localStorage.getItem('pk_admin_auth');
        if (auth) {
            const elapsed = Date.now() - parseInt(auth);
            if (elapsed < 24 * 60 * 60 * 1000) {
                showAdminPanel();
                return;
            }
        }
        loginScreen.style.display = 'flex';
    }

    function showAdminPanel() {
        loginScreen.style.display = 'none';
        adminPanel.style.display = 'block';
        loadActualites();
        loadTemoignages();
    }

    function logout() {
        localStorage.removeItem('pk_admin_auth');
        adminPanel.style.display = 'none';
        loginScreen.style.display = 'flex';
        pinInputs.forEach(i => i.value = '');
        pinInputs[0].focus();
    }

    // =========================================
    // NAVIGATION
    // =========================================

    function initNavigation() {
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                
                navItems.forEach(n => n.classList.remove('active'));
                item.classList.add('active');
                
                sections.forEach(s => {
                    s.classList.remove('active');
                    if (s.id === `section-${section}`) {
                        s.classList.add('active');
                    }
                });
            });
        });
    }

    // =========================================
    // ACTUALITÉS
    // =========================================

    async function loadActualites() {
        const grid = document.getElementById('actualites-grid');
        grid.innerHTML = '<div class="loading"><i class="fa-solid fa-spinner fa-spin"></i> Chargement...</div>';
        
        try {
            const data = await supabase.select(CONFIG.TABLES.ACTUALITES, { order: 'date_publication.desc' });
            renderActualites(data);
        } catch (err) {
            grid.innerHTML = '<div class="empty">Erreur de chargement</div>';
        }
    }

    function renderActualites(actualites) {
        const grid = document.getElementById('actualites-grid');
        
        if (!actualites || actualites.length === 0) {
            grid.innerHTML = `
                <div class="empty">
                    <i class="fa-solid fa-newspaper"></i>
                    <p>Aucune actualité</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = actualites.map(actu => `
            <div class="card">
                <div class="card-image">
                    <img src="${actu.image}" alt="${actu.titre}" onerror="this.src='https://via.placeholder.com/400x200?text=Image'">
                    <span class="badge ${actu.actif ? 'badge-success' : 'badge-warning'}">
                        ${actu.actif ? 'Publié' : 'Brouillon'}
                    </span>
                </div>
                <div class="card-body">
                    <h4>${actu.titre}</h4>
                    <p class="card-date"><i class="fa-solid fa-calendar"></i> ${formatDate(actu.date_publication)}</p>
                    <p class="card-excerpt">${truncate(actu.extrait, 80)}</p>
                </div>
                <div class="card-actions">
                    <button class="btn btn-sm btn-primary" onclick="editActualite(${actu.id})">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteItem(${actu.id}, 'actualites')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    document.getElementById('add-actu-btn').addEventListener('click', () => {
        document.getElementById('modal-actu-title').innerHTML = '<i class="fa-solid fa-newspaper"></i> Nouvelle Actualité';
        document.getElementById('form-actu').reset();
        document.getElementById('actu-id').value = '';
        document.getElementById('actu-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('actu-image-preview').innerHTML = '<i class="fa-solid fa-cloud-upload"></i><span>Cliquez pour uploader</span>';
        openModal('modal-actu');
    });

    window.editActualite = async function(id) {
        const data = await supabase.select(CONFIG.TABLES.ACTUALITES, { filter: `id=eq.${id}` });
        if (data && data[0]) {
            const actu = data[0];
            document.getElementById('modal-actu-title').innerHTML = '<i class="fa-solid fa-pen"></i> Modifier l\'Actualité';
            document.getElementById('actu-id').value = actu.id;
            document.getElementById('actu-titre').value = actu.titre;
            document.getElementById('actu-date').value = actu.date_publication;
            document.getElementById('actu-image-url').value = actu.image;
            document.getElementById('actu-extrait').value = actu.extrait;
            document.getElementById('actu-contenu').value = actu.contenu || '';
            document.getElementById('actu-statut').value = actu.actif.toString();
            document.getElementById('actu-image-preview').innerHTML = `<img src="${actu.image}" alt="Preview">`;
            openModal('modal-actu');
        }
    };

    document.getElementById('form-actu').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('actu-id').value;
        const imageUrl = document.getElementById('actu-image-url').value;
        
        if (!imageUrl) {
            showToast('Veuillez uploader une image', 'error');
            return;
        }
        
        const data = {
            titre: document.getElementById('actu-titre').value,
            date_publication: document.getElementById('actu-date').value,
            image: imageUrl,
            extrait: document.getElementById('actu-extrait').value,
            contenu: document.getElementById('actu-contenu').value,
            actif: document.getElementById('actu-statut').value === 'true'
        };
        
        try {
            if (id) {
                await supabase.update(CONFIG.TABLES.ACTUALITES, id, data);
                showToast('Actualité modifiée', 'success');
            } else {
                await supabase.insert(CONFIG.TABLES.ACTUALITES, data);
                showToast('Actualité ajoutée', 'success');
            }
            closeModal('modal-actu');
            loadActualites();
        } catch (err) {
            showToast('Erreur lors de l\'enregistrement', 'error');
        }
    });

    // =========================================
    // TÉMOIGNAGES
    // =========================================

    async function loadTemoignages() {
        const grid = document.getElementById('temoignages-grid');
        grid.innerHTML = '<div class="loading"><i class="fa-solid fa-spinner fa-spin"></i> Chargement...</div>';
        
        try {
            const data = await supabase.select(CONFIG.TABLES.TEMOIGNAGES, { order: 'created_at.desc' });
            renderTemoignages(data);
        } catch (err) {
            grid.innerHTML = '<div class="empty">Erreur de chargement</div>';
        }
    }

    function renderTemoignages(temoignages) {
        const grid = document.getElementById('temoignages-grid');
        
        if (!temoignages || temoignages.length === 0) {
            grid.innerHTML = `
                <div class="empty">
                    <i class="fa-solid fa-quote-right"></i>
                    <p>Aucun témoignage</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = temoignages.map(temoin => `
            <div class="card">
                <div class="card-avatar">
                    <img src="${temoin.photo}" alt="${temoin.nom}" onerror="this.src='https://via.placeholder.com/100?text=Photo'">
                </div>
                <div class="card-body">
                    <h4>${temoin.nom}</h4>
                    <p class="card-function">${temoin.fonction}</p>
                    <div class="card-rating">${renderStars(temoin.note || 5)}</div>
                    <p class="card-excerpt">"${truncate(temoin.texte, 100)}"</p>
                </div>
                <div class="card-actions">
                    <button class="btn btn-sm btn-primary" onclick="editTemoignage(${temoin.id})">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteItem(${temoin.id}, 'temoignages')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    document.getElementById('add-temoin-btn').addEventListener('click', () => {
        document.getElementById('modal-temoin-title').innerHTML = '<i class="fa-solid fa-quote-right"></i> Nouveau Témoignage';
        document.getElementById('form-temoin').reset();
        document.getElementById('temoin-id').value = '';
        document.getElementById('temoin-note').value = '5';
        document.getElementById('temoin-photo-preview').innerHTML = '<i class="fa-solid fa-user"></i><span>Cliquez pour uploader</span>';
        updateStars(5);
        openModal('modal-temoin');
    });

    window.editTemoignage = async function(id) {
        const data = await supabase.select(CONFIG.TABLES.TEMOIGNAGES, { filter: `id=eq.${id}` });
        if (data && data[0]) {
            const temoin = data[0];
            document.getElementById('modal-temoin-title').innerHTML = '<i class="fa-solid fa-pen"></i> Modifier le Témoignage';
            document.getElementById('temoin-id').value = temoin.id;
            document.getElementById('temoin-nom').value = temoin.nom;
            document.getElementById('temoin-fonction').value = temoin.fonction;
            document.getElementById('temoin-photo-url').value = temoin.photo;
            document.getElementById('temoin-note').value = temoin.note || 5;
            document.getElementById('temoin-texte').value = temoin.texte;
            document.getElementById('temoin-statut').value = (temoin.actif !== false).toString();
            document.getElementById('temoin-photo-preview').innerHTML = `<img src="${temoin.photo}" alt="Preview">`;
            updateStars(temoin.note || 5);
            openModal('modal-temoin');
        }
    };

    document.getElementById('form-temoin').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('temoin-id').value;
        const photoUrl = document.getElementById('temoin-photo-url').value;
        
        if (!photoUrl) {
            showToast('Veuillez uploader une photo', 'error');
            return;
        }
        
        const data = {
            nom: document.getElementById('temoin-nom').value,
            fonction: document.getElementById('temoin-fonction').value,
            photo: photoUrl,
            note: parseInt(document.getElementById('temoin-note').value),
            texte: document.getElementById('temoin-texte').value,
            actif: document.getElementById('temoin-statut').value === 'true'
        };
        
        try {
            if (id) {
                await supabase.update(CONFIG.TABLES.TEMOIGNAGES, id, data);
                showToast('Témoignage modifié', 'success');
            } else {
                await supabase.insert(CONFIG.TABLES.TEMOIGNAGES, data);
                showToast('Témoignage ajouté', 'success');
            }
            closeModal('modal-temoin');
            loadTemoignages();
        } catch (err) {
            showToast('Erreur lors de l\'enregistrement', 'error');
        }
    });

    // Rating stars
    document.querySelectorAll('.rating-select .star').forEach(star => {
        star.addEventListener('click', () => {
            const value = parseInt(star.dataset.value);
            document.getElementById('temoin-note').value = value;
            updateStars(value);
        });
    });

    function updateStars(value) {
        document.querySelectorAll('.rating-select .star').forEach(star => {
            const starValue = parseInt(star.dataset.value);
            star.classList.toggle('active', starValue <= value);
        });
    }

    function renderStars(count) {
        return Array(5).fill(0).map((_, i) => 
            `<i class="fa-solid fa-star ${i < count ? 'active' : ''}"></i>`
        ).join('');
    }

    // =========================================
    // SUPPRESSION
    // =========================================

    window.deleteItem = function(id, type) {
        document.getElementById('delete-id').value = id;
        document.getElementById('delete-type').value = type;
        openModal('modal-delete');
    };

    document.getElementById('confirm-delete').addEventListener('click', async () => {
        const id = document.getElementById('delete-id').value;
        const type = document.getElementById('delete-type').value;
        const table = type === 'actualites' ? CONFIG.TABLES.ACTUALITES : CONFIG.TABLES.TEMOIGNAGES;
        
        try {
            await supabase.delete(table, id);
            showToast('Supprimé avec succès', 'success');
            closeModal('modal-delete');
            
            if (type === 'actualites') loadActualites();
            else loadTemoignages();
        } catch (err) {
            showToast('Erreur lors de la suppression', 'error');
        }
    });

    // =========================================
    // UPLOAD IMAGES
    // =========================================

    function initImageUploads() {
        // Actualité
        const actuPreview = document.getElementById('actu-image-preview');
        const actuFile = document.getElementById('actu-image-file');
        
        actuPreview.addEventListener('click', () => actuFile.click());
        actuFile.addEventListener('change', async (e) => {
            if (e.target.files[0]) {
                actuPreview.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Upload...</span>';
                const url = await uploadImageToR2(e.target.files[0], 'actualites');
                if (url) {
                    document.getElementById('actu-image-url').value = url;
                    actuPreview.innerHTML = `<img src="${url}" alt="Preview">`;
                } else {
                    actuPreview.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i><span>Erreur upload</span>';
                }
            }
        });
        
        // Témoignage
        const temoinPreview = document.getElementById('temoin-photo-preview');
        const temoinFile = document.getElementById('temoin-photo-file');
        
        temoinPreview.addEventListener('click', () => temoinFile.click());
        temoinFile.addEventListener('change', async (e) => {
            if (e.target.files[0]) {
                temoinPreview.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Upload...</span>';
                const url = await uploadImageToR2(e.target.files[0], 'temoignages');
                if (url) {
                    document.getElementById('temoin-photo-url').value = url;
                    temoinPreview.innerHTML = `<img src="${url}" alt="Preview">`;
                } else {
                    temoinPreview.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i><span>Erreur upload</span>';
                }
            }
        });
    }

    async function uploadImageToR2(file, folder) {
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        
        try {
            const res = await fetch(`${CONFIG.SUPABASE_URL}/storage/v1/object/polyclinique-kennedy/${folder}/${fileName}`, {
                method: 'POST',
                headers: {
                    'apikey': CONFIG.SUPABASE_KEY,
                    'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
                    'Content-Type': file.type
                },
                body: file
            });
            
            if (res.ok) {
                return `${CONFIG.R2_PUBLIC_URL}/polyclinique-kennedy/${folder}/${fileName}`;
            }
        } catch (err) {
            console.error('Upload error:', err);
        }
        return null;
    }

    // =========================================
    // MODALS
    // =========================================

    function openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    function closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    document.querySelectorAll('.modal-close, [data-modal]').forEach(el => {
        el.addEventListener('click', () => {
            const modalId = el.dataset.modal;
            if (modalId) closeModal(modalId);
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal.id);
        });
    });

    // =========================================
    // TOAST NOTIFICATIONS
    // =========================================

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fa-solid fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // =========================================
    // UTILITAIRES
    // =========================================

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    }

    function truncate(str, length) {
        if (!str) return '';
        return str.length > length ? str.substring(0, length) + '...' : str;
    }

    // =========================================
    // INITIALISATION
    // =========================================

    function init() {
        initPinLogin();
        initNavigation();
        initImageUploads();
        logoutBtn.addEventListener('click', logout);
        checkSession();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
