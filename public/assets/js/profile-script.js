document.addEventListener('DOMContentLoaded', () => {
    const reportNavLink = document.getElementById('reports-id');
    const campanhaNavLink = document.getElementById('campanha-id');
    const loadingSpinnerContainer = document.getElementById('loading-spinner2');
    const listaInicio = document.getElementById('profile-info-list');
    
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            document.getElementById('welcome-message').innerText = `Seja bem-vindo(a), ${user.displayName}`;
            document.getElementById('user-email').innerText = user.email;
            document.getElementById('user-razao').innerText = user.displayName;
            document.getElementById('user-verify').innerText = user.emailVerified ? 'Sim' : 'Não';

            // Busca no banco de dados para preencher outras informações do usuário
            try {
                const querySnapshot = await db.collection('usuarios').where('email', '==', user.email).get();
                if (!querySnapshot.empty) {
                    const userData = querySnapshot.docs[0].data();
                    document.getElementById('user-cnpj').innerText = userData.cnpj || '-';
                    loadingSpinnerContainer.style.display = 'none';
                    listaInicio.style.display = 'block';
                }
            } catch (error) {
                document.getElementById('user-cnpj').innerText = 'Erro ao buscar CNPJ.';
                console.error('Erro ao buscar CNPJ:', error);
            }

            // Permitir acesso total para o administrador
            if (user.email === 'admin@admin.com') {
                campanhaNavLink.className = 'disabled-link';
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('disabled-link');
                    link.addEventListener('click', function (e) {
                        e.preventDefault();
                        const sectionToShow = this.getAttribute('data-section');
                        document.querySelectorAll('.content-section').forEach(section => {
                            section.style.display = 'none';
                        });
                        document.getElementById(sectionToShow).style.display = 'block';
                    });
                });
                document.getElementById('reports-section').style.display = 'block';
            } else {
                reportNavLink.className = 'disabled-link';
                
                // Restringir acesso se não for administrador
                if (!user.emailVerified) {
                    const verifyEmailBtn = document.getElementById('verify-email-btn');
                    verifyEmailBtn.style.display = 'inline-block';
                    verifyEmailBtn.addEventListener('click', () => {
                        user.sendEmailVerification().then(() => {
                            alert('E-mail de verificação enviado.');
                        }).catch((error) => {
                            console.error('Erro ao enviar e-mail de verificação:', error);
                        });
                    });
                    document.getElementById('verification-warning').style.display = 'block';

                    // Desabilitar links de navegação para usuários sem verificação
                    document.querySelectorAll('.nav-link').forEach(link => {
                        if (link.getAttribute('data-section') !== 'profile-section') {
                            link.addEventListener('click', (e) => e.preventDefault());
                            link.classList.add('disabled-link');
                        }
                    });
                }
            }

            if (user.emailVerified || user.email === 'admin@admin.com') {
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.addEventListener('click', function (e) {
                        e.preventDefault();
                        const sectionToShow = this.getAttribute('data-section');
                        document.querySelectorAll('.content-section').forEach(section => {
                            section.style.display = 'none';
                        });
                        document.getElementById(sectionToShow).style.display = 'block';
                    });
                });
                document.querySelector('.nav-link[data-section="profile-section"]').click();
            }
        } else {
            window.location.href = 'login.html';
        }
    });

    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Erro ao sair:', error);
        });
    });
});

// ativa hamburguer menu lateral
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('header nav ul');

    // Abre ou fecha o menu ao clicar no botão de toggle
    menuToggle.addEventListener('click', () => {
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
