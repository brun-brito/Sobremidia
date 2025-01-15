document.addEventListener('DOMContentLoaded', () => {
    const loadingSpinnerContainer = document.getElementById('loading-spinner2');
    const listaInicio = document.getElementById('profile-info-list');
    
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            
            document.getElementById('welcome-message').innerText = `Seja bem-vindo(a), ${user.displayName}`;
            document.getElementById('user-email').innerText = user.email;
            document.getElementById('user-razao').innerText = user.displayName;
            document.getElementById('user-verify').innerText = user.emailVerified ? 'Sim' : 'Não';

            try {
                const querySnapshot = await db.collection('usuarios').where('email', '==', user.email).get();
                
                if (!querySnapshot.empty) {
                    const userData = querySnapshot.docs[0].data();
                    document.getElementById('user-cnpj').innerText = userData.cnpj ? userData.cnpj : '-';
                    loadingSpinnerContainer.style.display = 'none';
                    listaInicio.style.display = 'block';
                }
            } catch (error) {
                document.getElementById('user-cnpj').innerText = 'Erro ao buscar CNPJ.';
                console.error('Erro ao buscar CNPJ:', error);
            }

            if (user.emailVerified) {
                document.getElementById('campaigns-section').style.display = 'block';
            } else {
                const verifyEmailBtn = document.getElementById('verify-email-btn');
                verifyEmailBtn.style.display = 'inline-block';
                const verifyEmailLoading = document.getElementById('verify-email-loading');
            
                verifyEmailBtn.addEventListener('click', function() {
                    verifyEmailLoading.style.display = 'inline';
                    verifyEmailBtn.disabled = true;
            
                    user.sendEmailVerification().then(function() {
                        alert('Um e-mail de verificação foi enviado para ' + user.email + '. Por favor, verifique sua caixa de entrada ou Spam/ Lixo Eletrônico.');
                    }).catch(function(error) {
                        console.error('Erro ao enviar e-mail de verificação: ', error);
                        alert('Erro ao enviar e-mail de verificação. Tente novamente mais tarde.');
                    }).then(function() {
                        verifyEmailLoading.style.display = 'none';
                        verifyEmailBtn.disabled = false;
                    });
                });           

                document.getElementById('verification-warning').style.display = 'block';

                document.querySelectorAll('.nav-link').forEach(link => {
                    const sectionToShow = link.getAttribute('data-section');
                    if (sectionToShow !== 'profile-section') {
                        link.addEventListener('click', (e) => {
                            e.preventDefault();
                        });
                        link.classList.add('disabled-link'); // vai desabilitar os itens do menu, se não tiver o email verificado
                    }
                });
            }

            if (user.emailVerified) {
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.addEventListener('click', function(e) {
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

