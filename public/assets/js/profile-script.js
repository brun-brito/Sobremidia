document.addEventListener('DOMContentLoaded', async () => {
    auth.onAuthStateChanged(async (user) => {
    if (document.getElementById('welcome-message')) {
        document.getElementById('welcome-message').innerText = `Seja bem-vindo(a), ${user.displayName}`;
    }
    if (document.getElementById('user-email')) {
        document.getElementById('user-email').innerText = user.email;
    }
    if (document.getElementById('user-razao')) {
        document.getElementById('user-razao').innerText = user.displayName;
    }
    if (document.getElementById('user-verify')) {
        document.getElementById('user-verify').innerText = user.emailVerified ? "Sim" : "Não";
    }

    // Buscar informações adicionais no banco de dados
    try {
        const querySnapshot = await db.collection('usuarios').where('email', '==', user.email).get();
        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            if (document.getElementById('user-cnpj')) {
                document.getElementById('user-cnpj').innerText = userData.cnpj || '-';
            }
            const loadingSpinnerContainer = document.getElementById('loading-spinner2');
            const listaInicio = document.getElementById('profile-info-list');

            if (loadingSpinnerContainer) loadingSpinnerContainer.style.display = 'none';
            if (listaInicio) listaInicio.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro ao buscar CNPJ:', error);
        if (document.getElementById('user-cnpj')) {
            document.getElementById('user-cnpj').innerText = 'Erro ao buscar CNPJ.';
        }
    }
    if (user.email !== 'admin@admin.com') {
        setupEmailVerification(user);
        const reportsButton = document.getElementById('reports-a-id');
        if (reportsButton) reportsButton.classList.add('disabled-link');
    }
    });
});

/**
 * Configura o botão de verificação de e-mail, caso o usuário não esteja verificado
 */
function setupEmailVerification(user) {
    if (!user.emailVerified) {
        const verifyEmailBtn = document.getElementById('verify-email-btn');
        if (verifyEmailBtn) {
            verifyEmailBtn.style.display = 'inline-block';
            verifyEmailBtn.addEventListener('click', () => {
                user.sendEmailVerification().then(() => {
                    alert('E-mail de verificação enviado.');
                }).catch((error) => {
                    console.error('Erro ao enviar e-mail de verificação:', error);
                });
            });
        }

        if (document.getElementById('verification-warning')) {
            document.getElementById('verification-warning').style.display = 'block';
        }

        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('data-section') !== 'profile-section') {
                link.addEventListener('click', (e) => e.preventDefault());
                link.classList.add('disabled-link');
            }
        });
    }
}
