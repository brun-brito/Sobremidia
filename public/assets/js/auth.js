document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        setupLogout();
        handleAdminPermissions(user);
    });
});

/**
 * Configura o botão de logout em todas as páginas
 */
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'login.html';
            }).catch((error) => {
                console.error('Erro ao sair:', error);
            });
        });
    }
}

/**
 * Configura permissões para o usuário administrador
 */
function handleAdminPermissions(user) {
    if (user.email === 'admin@admin.com') {
        const checkinNav = document.getElementById('checkin-id');
        const criarCampanhaNav = document.getElementById('criar-campanha-id');
        const campanhaNav = document.getElementById('campanha-id');
        const campanhaNavLink = document.getElementById('campanha-a-id');

        if (checkinNav) checkinNav.style.display = 'block';
        if (criarCampanhaNav) criarCampanhaNav.style.display = 'none';
        if (campanhaNav) campanhaNav.style.display = 'none';
        if (campanhaNavLink) campanhaNavLink.classList.add('disabled-link');

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('disabled-link');
            link.addEventListener('click', handleNavigation);
        });

        if (document.getElementById('reports-section')) {
            document.getElementById('reports-section').style.display = 'block';
        }
    }
}

/**
 * Gerencia a navegação dentro da aplicação
 */
function handleNavigation(e) {
    const href = this.getAttribute('href');
    if (href && href !== '#') return;

    e.preventDefault();
    const sectionToShow = this.getAttribute('data-section');

    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });

    if (document.getElementById(sectionToShow)) {
        document.getElementById(sectionToShow).style.display = 'block';
    }
}
