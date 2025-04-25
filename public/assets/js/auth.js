const API_URL = window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5001/sobremidia-ce/us-central1/v1"
    : "https://us-central1-sobremidia-ce.cloudfunctions.net/v1";

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        if (!user.emailVerified && !window.location.href.includes('profile.html')) {
            alert("Por favor, verifique seu e-mail antes de acessar esta página.");
            window.location.href = 'profile.html';
            return;
        }

        setupLogout();
        await handleUserPermissions(user);
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
async function handleUserPermissions(user) {
    try {
        const userDoc = await db.collection("usuarios").doc(user.uid).get();
        if (!userDoc.exists) {
            console.warn("Usuário não encontrado no Firestore.");
            return;
        }

        const userData = userDoc.data();
        const userRole = userData.funcao; // Obtendo função do usuário

        // Ocultar todas as seções inicialmente
        const sections = {
            usuarios: document.getElementById('usuarios-id'),
            relatorios: document.getElementById('reports-id'),
            checkin: document.getElementById('checkin-id'),
            paineis: document.getElementById('paineis-id'),
            realizarCheckin: document.getElementById('realizar-checkin-button'),
            historicoCheckin: document.getElementById('view-checkins-button')
        };

        Object.values(sections).forEach(el => {
            if (el) el.style.display = 'none';
        });

        // Aplicar permissões de acordo com a função do usuário
        switch (userRole) {
            case "administrador":
                if (sections.usuarios) sections.usuarios.style.display = 'block';
                if (sections.relatorios) sections.relatorios.style.display = 'block';
                if (sections.checkin) sections.checkin.style.display = 'block';
                if (sections.paineis) sections.paineis.style.display = 'block';
                if (sections.realizarCheckin) sections.realizarCheckin.style.display = 'block';
                if (sections.historicoCheckin) sections.historicoCheckin.style.display = 'block';
                break;

            case "OPEC":
                if (sections.relatorios) sections.relatorios.style.display = 'block';
                if (sections.checkin) sections.checkin.style.display = 'block';
                if (sections.paineis) sections.paineis.style.display = 'block';
                if (sections.historicoCheckin) sections.historicoCheckin.style.display = 'block';
                break;

            case "tecnico":
                if (sections.checkin) sections.checkin.style.display = 'block';
                if (sections.realizarCheckin) sections.realizarCheckin.style.display = 'block';
                break;

            default:
                console.warn("Função do usuário não reconhecida.");
        }

    } catch (error) {
        console.error("Erro ao buscar informações do usuário:", error);
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


// ativa hamburguer menu lateral
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('header nav ul');
  
    // Abre ou fecha o menu ao clicar no botão de toggle
    menuToggle.addEventListener('click', (event) => {
        event.stopPropagation(); // Evita que o clique se propague
        menu.classList.toggle('showing');
    });
  
    // Fecha o menu ao clicar fora dele
    document.addEventListener('click', (event) => {
        const isClickInsideMenu = menu.contains(event.target);
        const isClickOnToggle = menuToggle.contains(event.target);
  
        if (!isClickInsideMenu && !isClickOnToggle) {
            menu.classList.remove('showing');
        }
    });
  });
  
  // Fecha o menu ao selecionar alguma seção
  document.querySelectorAll('header nav ul li a').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelector('header nav ul').classList.remove('showing');
    });
  });