document.addEventListener('DOMContentLoaded', async () => {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        setupProfile(user);
        setupEmailVerification(user);
    });
});

/**
 * Função para buscar e exibir os dados do usuário no perfil.
 */
async function setupProfile(user) {
    // Exibir informações básicas do Firebase Authentication
    document.getElementById('user-email').innerText = user.email;
    document.getElementById('user-verify').innerText = user.emailVerified ? "Sim" : "Não";

    // Exibir spinner enquanto carrega os dados
    const loadingSpinner = document.getElementById('loading-spinner2');
    const profileList = document.getElementById('profile-info-list');
    if (loadingSpinner) loadingSpinner.style.display = 'flex';
    if (profileList) profileList.style.display = 'none';

    // Buscar informações adicionais do Firestore
    try {
        const querySnapshot = await db.collection('usuarios').where('email', '==', user.email).get();
        
        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            document.getElementById('welcome-message').innerHTML = `Seja bem-vindo(a), <span id="user-name">${userData.nome.split(" ")[0] || 'Usuário'}</span>`;
            document.getElementById('user-razao').innerText = userData.nome || 'Não informado';
            document.getElementById('user-cnpj').innerText = userData.cnpj || 'Não informado';

            // Esconder o spinner e exibir as informações
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            if (profileList) profileList.style.display = 'block';
        } else {
            console.warn('Nenhum dado adicional encontrado para este usuário.');
            document.getElementById('user-razao').innerText = 'Não encontrado';
            document.getElementById('user-cnpj').innerText = 'Não encontrado';
        }
    } catch (error) {
        console.error('Erro ao buscar informações adicionais do usuário:', error);
        document.getElementById('user-cnpj').innerText = 'Erro ao carregar dados.';
    }
}

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
                    alert('E-mail de verificação enviado. Por favor, confira a caixa de entrada e o spam.');
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